const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getSession } = require('../config/neo4j');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');
const { templates } = require('../services/email.service');
const reputationService = require('../services/reputation.service');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/** Cosine similarity between two equal-length numeric vectors (0 if degenerate). */
function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

// POST /request
router.post('/request', auth, async (req, res) => {
  try {
    const { mentor_id, message, slot_id } = req.body;
    const mentee_id = req.user.id;

    if (!mentor_id) {
      return res.status(400).json({ success: false, message: 'Mentor ID is required' });
    }

    const result = await db.query(
      `INSERT INTO mentorships (mentor_id, mentee_id, message, slot_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [mentor_id, mentee_id, message, slot_id || null]
    );

    const mentorship = result.rows[0];

    res.status(201).json({ success: true, data: mentorship });

    // Notify the mentor about the request
    setImmediate(async () => {
      try {
        const mentorRes = await db.query('SELECT email FROM users WHERE id = $1', [mentor_id]);
        const menteeRes = await db.query('SELECT name FROM users WHERE id = $1', [mentee_id]);
        if (mentorRes.rows.length > 0) {
          const menteeName = menteeRes.rows[0]?.name || 'A student';
          const emailTpl = templates.mentorshipRequest(menteeName);
          await notificationService.notify(
            parseInt(mentor_id, 10),
            'mentorship_request',
            `New mentorship request from ${menteeName}`,
            `${menteeName} sent you a mentorship request on ResearchBridge.`,
            { from_user_id: mentee_id, mentorship_id: mentorship.id },
            mentorRes.rows[0].email,
            emailTpl
          );
        }
      } catch (notifyErr) {
        logger.warn('[Mentorship] Initial request notification failed:', notifyErr.message);
      }
    });
  } catch (error) {
    logger.error(`Error requesting mentorship: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /my
router.get('/my', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT m.*, 
              u_mentor.name as mentor_name, u_mentor.avatar_url as mentor_avatar,
              u_mentee.name as mentee_name, u_mentee.avatar_url as mentee_avatar
       FROM mentorships m
       JOIN users u_mentor ON m.mentor_id = u_mentor.id
       JOIN users u_mentee ON m.mentee_id = u_mentee.id
       WHERE m.mentor_id = $1 OR m.mentee_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error(`Error fetching mentorships: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /:id/respond
router.patch('/:id/respond', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const mentor_id = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE mentorships 
       SET status = $1 
       WHERE id = $2 AND mentor_id = $3 AND status = 'pending'
       RETURNING *`,
      [status, id, mentor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentorship request not found or unauthorized' });
    }

    const mentorship = result.rows[0];

    // Trigger graph sync + reputation reward if accepted
    if (status === 'accepted') {
      // If the request was against a slot, increment its taken count and close if full
      if (mentorship.slot_id) {
        await db.query(
          `UPDATE mentorship_slots SET taken = taken + 1,
             is_open = (taken + 1 < capacity)
           WHERE id = $1`,
          [mentorship.slot_id]
        ).catch((e) => logger.warn(`[Mentorship] slot update failed: ${e.message}`));
      }
      // Reputation: reward both mentor (offering guidance) and mentee (engaging)
      reputationService.award(parseInt(mentor_id, 10), 10, 'mentorship_accepted', 'mentorship', mentorship.id)
        .catch((e) => logger.warn(`[Mentorship] mentor reputation failed: ${e.message}`));
      reputationService.award(parseInt(mentorship.mentee_id, 10), 5, 'mentorship_started', 'mentorship', mentorship.id)
        .catch((e) => logger.warn(`[Mentorship] mentee reputation failed: ${e.message}`));

      const session = getSession();
      try {
        await session.run(
          `
          MATCH (mentor:Researcher {userId: $mentorId})
          MATCH (mentee:Researcher {userId: $menteeId})
          MERGE (mentor)-[:MENTORS]->(mentee)
          `,
          {
            mentorId: parseInt(mentor_id, 10),
            menteeId: parseInt(mentorship.mentee_id, 10)
          }
        );
        logger.info(`Neo4j: Created MENTORS edge from Researcher ${mentor_id} to Researcher ${mentorship.mentee_id}`);
      } catch (graphError) {
        logger.error(`Error syncing MENTORS edge to Neo4j: ${graphError.message}`);
        // We still return success for the DB update
      } finally {
        await session.close();
      }
    }

    res.json({ success: true, data: mentorship });

    // Notify the mentee about the decision
    setImmediate(async () => {
      try {
        const menteeRes = await db.query('SELECT email FROM users WHERE id = $1', [mentorship.mentee_id]);
        const mentorRes = await db.query('SELECT name FROM users WHERE id = $1', [mentor_id]);
        if (menteeRes.rows.length > 0 && status === 'accepted') {
          const mentorName = mentorRes.rows[0]?.name || 'Your mentor';
          const emailTpl = templates.mentorshipAccepted(mentorName);
          await notificationService.notify(
            mentorship.mentee_id,
            'mentorship_accepted',
            `${mentorName} accepted your mentorship request`,
            `You now have a mentorship connection with ${mentorName} on ResearchBridge.`,
            { from_user_id: parseInt(mentor_id, 10), mentorship_id: mentorship.id },
            menteeRes.rows[0].email,
            emailTpl
          );
        } else if (menteeRes.rows.length > 0 && status === 'rejected') {
          await notificationService.notify(
            mentorship.mentee_id,
            'mentorship_rejected',
            'Mentorship request not accepted',
            'The mentor was unable to accept your request at this time.',
            { from_user_id: parseInt(mentor_id, 10), mentorship_id: mentorship.id }
          );
        }
      } catch (notifyErr) {
        logger.warn('[Mentorship] Notification failed (non-fatal):', notifyErr.message);
      }
    });
  } catch (error) {
    logger.error(`Error responding to mentorship: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Mentorship slots (mentors offer structured availability) ────────────────────

// POST /slots — a mentor opens a structured mentorship slot
router.post('/slots', auth, async (req, res) => {
  try {
    const { domain, title, description, capacity, availability } = req.body;
    if (!domain) return res.status(400).json({ success: false, message: 'domain is required' });
    const result = await db.query(
      `INSERT INTO mentorship_slots (mentor_id, domain, title, description, capacity, availability)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, domain, title || null, description || null, capacity || 1, availability || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error(`Error creating mentorship slot: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /slots — list open slots (optional ?domain= filter)
router.get('/slots', auth, async (req, res) => {
  try {
    const { domain } = req.query;
    const params = [];
    let where = 'WHERE s.is_open = TRUE';
    if (domain) { params.push(`%${domain}%`); where += ` AND s.domain ILIKE $${params.length}`; }
    const result = await db.query(
      `SELECT s.*, u.name AS mentor_name, u.avatar_url AS mentor_avatar, u.trust_tier
         FROM mentorship_slots s JOIN users u ON s.mentor_id = u.id
        ${where}
        ORDER BY s.created_at DESC`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error(`Error listing mentorship slots: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /recommend — CF+CB mentor recommendations for the current user.
// Uses the SAME matching engine as Module 2: Sentence-BERT semantic similarity
// (mentee interests embedded ↔ mentor profile embeddings from ES) blended with
// domain keyword overlap + trust-tier authority. Filtered by open availability
// and mentorship history.
router.get('/recommend', auth, async (req, res) => {
  try {
    const menteeId = req.user.id;
    // mentee interests (research_interests + domain_tags)
    const meRes = await db.query(
      `SELECT COALESCE(research_interests,'[]'::jsonb) AS ri, COALESCE(domain_tags,'[]'::jsonb) AS dt
         FROM users WHERE id = $1`, [menteeId]);
    const interestList = [...(meRes.rows[0]?.ri || []), ...(meRes.rows[0]?.dt || [])];
    const interests = interestList.map((s) => String(s).toLowerCase());

    // Open slots whose mentor is not already mentoring this mentee and isn't the mentee
    const slotsRes = await db.query(
      `SELECT s.id AS slot_id, s.domain, s.title, s.availability, s.capacity, s.taken, s.mentor_id,
              u.name AS mentor_name, u.avatar_url AS mentor_avatar, u.trust_tier,
              COALESCE(u.research_interests,'[]'::jsonb) AS mentor_interests
         FROM mentorship_slots s
         JOIN users u ON s.mentor_id = u.id
        WHERE s.is_open = TRUE
          AND s.mentor_id <> $1
          AND NOT EXISTS (
            SELECT 1 FROM mentorships m
             WHERE m.mentor_id = s.mentor_id AND m.mentee_id = $1
               AND m.status IN ('pending','accepted')
          )`,
      [menteeId]
    );

    // ── CB (Sentence-BERT semantic) — embed the mentee's interests and fetch the
    //    candidate mentors' profile embeddings from ES (same vectors as Module 2). ──
    let menteeVec = null;
    if (interestList.length > 0) {
      try {
        const r = await axios.post(`${ML_SERVICE_URL}/embed`, { text: interestList.join(', ') }, { timeout: 30000 });
        menteeVec = r.data?.embedding || r.data?.vectors || null;
      } catch (e) { logger.warn(`[Mentorship] mentee embed failed: ${e.message}`); }
    }
    const mentorIds = [...new Set(slotsRes.rows.map((s) => s.mentor_id))];
    const mentorVecs = new Map();
    if (menteeVec && mentorIds.length > 0) {
      try {
        const { getEsClient } = require('../config/elasticsearch'); // lazy (ES client fails to load under Jest)
        const es = getEsClient();
        const mget = await es.mget({ index: 'users', body: { ids: mentorIds.map(String) } });
        for (const doc of mget.docs || []) {
          if (doc.found && Array.isArray(doc._source?.embedding)) mentorVecs.set(Number(doc._id), doc._source.embedding);
        }
      } catch (e) { logger.warn(`[Mentorship] mentor embeddings mget failed: ${e.message}`); }
    }

    // Blend: semantic similarity (0..1) + domain/interest keyword overlap + trust-tier authority
    const tierBoost = { professor: 0.15, verified: 0.08, basic: 0.03, unverified: 0 };
    const scored = slotsRes.rows.map((s) => {
      const bag = [String(s.domain).toLowerCase(), ...((s.mentor_interests || []).map((x) => String(x).toLowerCase()))];
      let overlap = 0;
      for (const it of interests) if (bag.some((b) => b.includes(it) || it.includes(b))) overlap++;
      const overlapScore = overlap / Math.max(1, interests.length);

      const mentorVec = mentorVecs.get(Number(s.mentor_id));
      const semantic = menteeVec && mentorVec ? Math.max(0, cosine(menteeVec, mentorVec)) : 0;

      // Weight the SBERT semantic signal highest, then keyword overlap, then authority.
      const composite = (menteeVec ? 0.6 * semantic : 0) + (menteeVec ? 0.25 : 0.7) * overlapScore + (tierBoost[s.trust_tier] || 0);
      return {
        ...s,
        semantic_score: Math.round(semantic * 100),
        match_score: Math.round(Math.min(1, composite) * 100),
        match_basis: menteeVec && mentorVec ? 'semantic+overlap' : 'overlap',
      };
    }).sort((a, b) => b.match_score - a.match_score);

    res.json({ success: true, data: scored.slice(0, 10) });
  } catch (error) {
    logger.error(`Error recommending mentors: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Mentorship sessions (tracking) ──────────────────────────────────────────────

// POST /:id/sessions — schedule a session on an accepted mentorship
router.post('/:id/sessions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_at, notes } = req.body;
    // only participants of an accepted mentorship may create sessions
    const m = await db.query(
      `SELECT * FROM mentorships WHERE id = $1 AND status = 'accepted' AND (mentor_id = $2 OR mentee_id = $2)`,
      [id, req.user.id]
    );
    if (m.rows.length === 0) return res.status(404).json({ success: false, message: 'Accepted mentorship not found' });
    const result = await db.query(
      `INSERT INTO mentorship_sessions (mentorship_id, scheduled_at, notes) VALUES ($1, $2, $3) RETURNING *`,
      [id, scheduled_at || null, notes || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error(`Error creating session: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /sessions/:sid/complete — mark a session complete (rewards both parties)
router.patch('/sessions/:sid/complete', auth, async (req, res) => {
  try {
    const { sid } = req.params;
    const sess = await db.query(
      `SELECT s.*, m.mentor_id, m.mentee_id FROM mentorship_sessions s
         JOIN mentorships m ON s.mentorship_id = m.id
        WHERE s.id = $1 AND (m.mentor_id = $2 OR m.mentee_id = $2)`,
      [sid, req.user.id]
    );
    if (sess.rows.length === 0) return res.status(404).json({ success: false, message: 'Session not found' });
    if (sess.rows[0].status === 'completed') {
      return res.json({ success: true, data: sess.rows[0], message: 'Already completed' });
    }
    const upd = await db.query(
      `UPDATE mentorship_sessions SET status = 'completed' WHERE id = $1 RETURNING *`, [sid]);
    // reward reputation for a completed session
    reputationService.award(sess.rows[0].mentor_id, 8, 'mentorship_session_completed', 'session', sid).catch(() => {});
    reputationService.award(sess.rows[0].mentee_id, 4, 'mentorship_session_completed', 'session', sid).catch(() => {});
    res.json({ success: true, data: upd.rows[0] });
  } catch (error) {
    logger.error(`Error completing session: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /:id/sessions — list sessions for a mentorship
router.get('/:id/sessions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT s.* FROM mentorship_sessions s
         JOIN mentorships m ON s.mentorship_id = m.id
        WHERE s.mentorship_id = $1 AND (m.mentor_id = $2 OR m.mentee_id = $2)
        ORDER BY s.scheduled_at ASC NULLS LAST, s.created_at ASC`,
      [id, req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error(`Error listing sessions: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
