const express = require('express');
const router = express.Router();
const { celebrate } = require('celebrate');
const adminController = require('../controllers/admin.controller');
const adminValidation = require('../validations/admin.validation');
const { auth, requireRole } = require('../middleware/auth');
const trustRankService = require('../services/trustrank.service');
const { envelope, errorEnvelope } = require('../utils/responseEnvelope');
const db = require('../config/db');

const VALID_TIERS = ['unverified', 'basic', 'verified', 'professor'];

// @route   POST /api/v1/admin/invite
// @desc    Initiate an exploration invite (Super Admin only)
router.post('/invite',
  [auth, requireRole(['super_admin']), celebrate(adminValidation.invite)],
  adminController.invite
);

// @route   POST /api/v1/admin/trustrank/refresh
// @desc    Recompute the TrustRank credibility PageRank on demand (admin only)
router.post('/trustrank/refresh',
  [auth, requireRole(['admin', 'super_admin'])],
  async (req, res, next) => {
    try {
      const result = await trustRankService.refreshTrustRank();
      res.json(envelope(result, { message: 'TrustRank recomputed' }));
    } catch (err) { next(err); }
  }
);

// @route   GET /api/v1/admin/users?tier=&institutional=&q=
// @desc    List users with trust/verification info (admin only)
router.get('/users',
  [auth, requireRole(['admin', 'super_admin'])],
  async (req, res, next) => {
    try {
      const params = [];
      const where = [];
      if (req.query.tier) { params.push(req.query.tier); where.push(`trust_tier = $${params.length}`); }
      if (req.query.institutional === 'true') where.push('is_institutional = TRUE');
      if (req.query.q) { params.push(`%${req.query.q}%`); where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`); }
      params.push(Math.min(parseInt(req.query.limit) || 50, 200));
      const sql = `SELECT id, name, email, role, trust_tier, is_institutional, institution_verified,
                          institution, trust_rank, reputation_points
                     FROM users ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                    ORDER BY id LIMIT $${params.length}`;
      const { rows } = await db.query(sql, params);
      res.json(envelope(rows));
    } catch (err) { next(err); }
  }
);

// @route   PATCH /api/v1/admin/users/:id/trust-tier
// @desc    Manually set a user's trust tier (admin only)
router.patch('/users/:id/trust-tier',
  [auth, requireRole(['admin', 'super_admin'])],
  async (req, res) => {
    const { tier } = req.body;
    if (!VALID_TIERS.includes(tier)) {
      return res.status(400).json(errorEnvelope(`tier must be one of: ${VALID_TIERS.join(', ')}`, 400));
    }
    const { rows } = await db.query(
      'UPDATE users SET trust_tier = $1 WHERE id = $2 RETURNING id, trust_tier',
      [tier, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json(errorEnvelope('User not found', 404));
    res.json(envelope(rows[0], { message: 'Trust tier updated' }));
  }
);

// @route   PATCH /api/v1/admin/users/:id/verify-institution
// @desc    Verify or revoke a user's institutional badge (admin only)
router.patch('/users/:id/verify-institution',
  [auth, requireRole(['admin', 'super_admin'])],
  async (req, res) => {
    const verified = req.body.verified !== false; // default true
    const { rows } = await db.query(
      `UPDATE users
          SET institution_verified = $1,
              is_institutional = CASE WHEN $1 THEN TRUE ELSE is_institutional END,
              trust_tier = CASE
                WHEN $1 AND role NOT IN ('professor','invited_user') THEN 'verified'
                ELSE trust_tier END
        WHERE id = $2
        RETURNING id, institution_verified, is_institutional, trust_tier`,
      [verified, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json(errorEnvelope('User not found', 404));
    res.json(envelope(rows[0], { message: verified ? 'Institution verified' : 'Verification revoked' }));
  }
);

// @route   POST /api/v1/admin/backfill
// @desc    Backfill data pipelines (admin only):
//          (1) emit profile.created for every user → ES `users` index + embeddings,
//          (2) seed Neo4j Researcher nodes + accepted-connection COLLABORATES edges
//              so CF graph traversal / suggested-collaborators return data.
router.post('/backfill',
  [auth, requireRole(['admin', 'super_admin'])],
  async (req, res, next) => {
    try {
      const eventBus = require('../services/eventBus.service');
      const { getSession } = require('../config/neo4j');
      const logger = require('../utils/logger');

      // (1) ES backfill — re-emit profile.created for all users
      const users = await db.query('SELECT id, name, email, institution, research_interests, domain_tags, trust_tier, bio FROM users');
      for (const u of users.rows) {
        await eventBus.emitEvent('profile.created', {
          id: u.id, name: u.name, email: u.email, institution: u.institution || '',
          research_interests: u.research_interests || [], domain_tags: u.domain_tags || [],
          trust_tier: u.trust_tier || 'unverified', bio: u.bio || '',
        });
      }

      // (2) Neo4j seed — Researcher nodes + COLLABORATES edges + Paper/AUTHORED co-authorship
      let nodes = 0, edges = 0, papers = 0, authored = 0;
      const session = getSession();
      try {
        for (const u of users.rows) {
          await session.run(
            'MERGE (r:Researcher {userId: $id}) SET r.name = $name, r.institution = $inst',
            { id: u.id, name: u.name || '', inst: u.institution || '' }
          );
          nodes++;
        }
        // COLLABORATES from accepted connections
        const conns = await db.query("SELECT requester_id, recipient_id FROM connections WHERE status = 'accepted'").catch(() => ({ rows: [] }));
        for (const c of conns.rows) {
          await session.run(
            `MATCH (a:Researcher {userId: $a}), (b:Researcher {userId: $b})
             MERGE (a)-[:COLLABORATES]->(b) MERGE (b)-[:COLLABORATES]->(a)`,
            { a: c.requester_id, b: c.recipient_id }
          );
          edges++;
        }
        // Paper nodes + AUTHORED edges — from library_items and saved_papers (co-authorship
        // emerges when two users share the same DOI/title). Keyed by DOI, else title.
        const paperRows = await db.query(`
          SELECT user_id, COALESCE(NULLIF(TRIM(doi), ''), title) AS pid, title
            FROM library_items WHERE item_type = 'paper' AND (doi IS NOT NULL OR title IS NOT NULL)
          UNION ALL
          SELECT user_id, COALESCE(NULLIF(TRIM(paper_doi), ''), paper_title) AS pid, paper_title AS title
            FROM saved_papers WHERE paper_doi IS NOT NULL OR paper_title IS NOT NULL
        `).catch(() => ({ rows: [] }));
        for (const p of paperRows.rows) {
          if (!p.pid) continue;
          await session.run(
            `MATCH (r:Researcher {userId: $uid})
             MERGE (paper:Paper {pid: $pid}) SET paper.title = $title
             MERGE (r)-[:AUTHORED]->(paper)`,
            { uid: p.user_id, pid: String(p.pid), title: p.title || '' }
          );
          authored++;
        }
        const paperCount = await session.run('MATCH (p:Paper) RETURN count(p) AS c').catch(() => null);
        papers = paperCount ? paperCount.records[0].get('c').toNumber() : 0;
      } finally {
        await session.close();
      }

      // (3) Re-index all library items into ES `papers` (title/abstract/full_text + embedding)
      let libraryIndexed = 0;
      try {
        const libraryService = require('../services/library.service');
        const items = await db.query('SELECT * FROM library_items');
        for (const it of items.rows) {
          if (Array.isArray(it.tags) === false && typeof it.tags === 'string') {
            try { it.tags = JSON.parse(it.tags); } catch (_) { it.tags = []; }
          }
          await libraryService._indexItem(it).catch((e) => logger.warn(`[Backfill] index item ${it.id} failed: ${e.message}`));
          libraryIndexed++;
        }
      } catch (e) { logger.warn(`[Backfill] library reindex failed: ${e.message}`); }

      logger.info(`[Backfill] emitted ${users.rows.length} profile.created; Neo4j: ${nodes} researchers, ${edges} collab edges, ${papers} papers, ${authored} AUTHORED edges; ${libraryIndexed} library items reindexed`);
      res.json(envelope({
        users_reindexed: users.rows.length,
        neo4j_nodes: nodes, neo4j_collab_edges: edges, neo4j_papers: papers, neo4j_authored_edges: authored,
        library_items_reindexed: libraryIndexed,
      }, { message: 'Backfill complete' }));
    } catch (err) { next(err); }
  }
);

module.exports = router;
