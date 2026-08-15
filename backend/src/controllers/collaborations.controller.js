const db = require('../config/db');
const { getSession } = require('../config/neo4j');
const notificationService = require('../services/notification.service');
const { templates } = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * Create a team (project) for an accepted collaboration inside a transaction.
 * Mirrors ProjectService.createProject: project + members + default doc.
 * memberIds: array of user ids — first entry becomes the admin/creator.
 * externalCollaborator: { researcher_id, name, institution } | null
 */
async function createCollaborationTeam(client, { name, description, memberIds, externalCollaborator }) {
  const projectRes = await client.query(
    'INSERT INTO projects (name, description, creator_id) VALUES ($1, $2, $3) RETURNING id, name',
    [name, description, memberIds[0]]
  );
  const projectId = projectRes.rows[0].id;

  for (let i = 0; i < memberIds.length; i++) {
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [projectId, memberIds[i], i === 0 ? 'admin' : 'member']
    );
  }

  if (externalCollaborator) {
    await client.query(
      `INSERT INTO project_external_collaborators (project_id, researcher_id, name, institution)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [projectId, externalCollaborator.researcher_id || null, externalCollaborator.name, externalCollaborator.institution || null]
    );
  }

  await client.query(
    'INSERT INTO collaborative_docs (project_id, title) VALUES ($1, $2)',
    [projectId, 'Main Research Doc']
  );

  return projectRes.rows[0];
}

/** Best-effort Neo4j COLLABORATES edge between two platform users (non-fatal). */
async function syncCollaboratesEdge(userIdA, userIdB) {
  const session = getSession();
  try {
    await session.run(
      `MATCH (a:Researcher {userId: $a}), (b:Researcher {userId: $b})
       MERGE (a)-[:COLLABORATES]->(b)
       MERGE (b)-[:COLLABORATES]->(a)`,
      { a: userIdA, b: userIdB }
    );
  } catch (graphErr) {
    logger.warn('[Collaborations] Neo4j sync failed (non-fatal):', graphErr.message);
  } finally {
    await session.close();
  }
}

/**
 * POST /api/v1/collaborations/request
 * Send a collaboration proposal to a recommended researcher.
 * Body: { recipient_user_id?, researcher_id?, researcher_name, researcher_institution?, title, message? }
 * - recipient_user_id present  → pending request + notification (recipient must accept).
 * - recipient_user_id absent   → the researcher has no platform account: the team is
 *   created immediately and the researcher is attached as an external collaborator.
 */
exports.sendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const {
      recipient_user_id: recipientUserIdRaw,
      researcher_id: researcherId,
      researcher_name: researcherName,
      researcher_institution: researcherInstitution,
      title,
      message,
    } = req.body;

    const recipientUserId = recipientUserIdRaw ? parseInt(recipientUserIdRaw, 10) : null;

    if (!researcherName || !title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'researcher_name and title are required' });
    }
    if (recipientUserId === requesterId) {
      return res.status(400).json({ success: false, message: 'You cannot send a collaboration request to yourself' });
    }

    // Prevent duplicate pending proposals to the same researcher.
    const dup = await db.query(
      `SELECT id FROM collaboration_requests
        WHERE requester_id = $1 AND status = 'pending'
          AND ((recipient_user_id IS NOT NULL AND recipient_user_id = $2)
            OR (recipient_researcher_id IS NOT NULL AND recipient_researcher_id = $3))`,
      [requesterId, recipientUserId, researcherId || null]
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'You already have a pending collaboration request with this researcher' });
    }

    // ----- Path A: researcher has no platform account → auto-create the team now.
    if (!recipientUserId) {
      const client = await db.pool.connect();
      let project;
      let request;
      try {
        await client.query('BEGIN');
        project = await createCollaborationTeam(client, {
          name: String(title).trim(),
          description: message || `Research collaboration with ${researcherName}`,
          memberIds: [requesterId],
          externalCollaborator: {
            researcher_id: researcherId,
            name: researcherName,
            institution: researcherInstitution,
          },
        });
        const reqRes = await client.query(
          `INSERT INTO collaboration_requests
             (requester_id, recipient_user_id, recipient_researcher_id, recipient_name, recipient_institution,
              proposal_title, proposal_message, status, project_id, responded_at)
           VALUES ($1, NULL, $2, $3, $4, $5, $6, 'accepted', $7, NOW())
           RETURNING *`,
          [requesterId, researcherId || null, researcherName, researcherInstitution || null,
           String(title).trim(), message || null, project.id]
        );
        request = reqRes.rows[0];
        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }

      // Confirmation notification for the requester (best-effort).
      try {
        await notificationService.notify(
          requesterId,
          'collaboration_accepted',
          `Team “${project.name}” created`,
          `${researcherName} has no platform account yet, so they were added to your new team as a collaborator.`,
          { project_id: project.id, request_id: request.id }
        );
      } catch (e) {
        logger.warn('[Collaborations] auto-create notify failed:', e.message);
      }

      return res.status(201).json({
        success: true,
        data: { ...request, auto_created: true, project_id: project.id, project_name: project.name },
        message: 'Team created — researcher added as collaborator',
      });
    }

    // ----- Path B: researcher is a platform user → pending request they must accept.
    const result = await db.query(
      `INSERT INTO collaboration_requests
         (requester_id, recipient_user_id, recipient_researcher_id, recipient_name, recipient_institution,
          proposal_title, proposal_message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [requesterId, recipientUserId, researcherId || null, researcherName, researcherInstitution || null,
       String(title).trim(), message || null]
    );
    const request = result.rows[0];

    const recipientRes = await db.query('SELECT name, email FROM users WHERE id = $1', [recipientUserId]);
    const requesterRes = await db.query('SELECT name FROM users WHERE id = $1', [requesterId]);
    if (recipientRes.rows.length > 0) {
      const requesterName = requesterRes.rows[0]?.name || 'A researcher';
      const emailTpl = templates.collaborationRequest(requesterName, request.proposal_title);
      await notificationService.notify(
        recipientUserId,
        'collaboration_request',
        `${requesterName} proposed a research collaboration`,
        `“${request.proposal_title}” — accept to create a shared research team.`,
        { from_user_id: requesterId, request_id: request.id, proposal_title: request.proposal_title },
        recipientRes.rows[0].email,
        emailTpl
      );
    }

    res.status(201).json({ success: true, data: request, message: 'Collaboration request sent' });
  } catch (err) {
    logger.error('[Collaborations] sendRequest error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/collaborations
 * All collaboration requests involving the current user (sent + received).
 */
exports.listMine = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT cr.*, u1.name AS requester_name, p.name AS project_name,
              (cr.requester_id = $1) AS i_am_requester
         FROM collaboration_requests cr
         JOIN users u1 ON u1.id = cr.requester_id
         LEFT JOIN projects p ON p.id = cr.project_id
        WHERE cr.requester_id = $1 OR cr.recipient_user_id = $1
        ORDER BY cr.created_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('[Collaborations] listMine error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/collaborations/pending
 * Incoming pending collaboration proposals for the current user.
 */
exports.listPending = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT cr.id, cr.proposal_title, cr.proposal_message, cr.created_at,
              u.id AS requester_id, u.name AS requester_name, u.institution AS requester_institution
         FROM collaboration_requests cr
         JOIN users u ON u.id = cr.requester_id
        WHERE cr.recipient_user_id = $1 AND cr.status = 'pending'
        ORDER BY cr.created_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('[Collaborations] listPending error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/v1/collaborations/:id/respond
 * Accept or decline a pending proposal. Accepting auto-creates the research
 * team with the requester as admin and the recipient as member.
 * Body: { action: 'accept' | 'decline' }
 */
exports.respond = async (req, res) => {
  try {
    const recipientId = req.user.id;
    const requestId = parseInt(req.params.id, 10);
    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'accept' or 'decline'" });
    }

    const pendingRes = await db.query(
      `SELECT * FROM collaboration_requests
        WHERE id = $1 AND recipient_user_id = $2 AND status = 'pending'`,
      [requestId, recipientId]
    );
    if (pendingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Collaboration request not found or unauthorized' });
    }
    const request = pendingRes.rows[0];

    if (action === 'decline') {
      const updated = await db.query(
        `UPDATE collaboration_requests SET status = 'declined', responded_at = NOW()
          WHERE id = $1 RETURNING *`,
        [requestId]
      );
      try {
        const recipientRes = await db.query('SELECT name FROM users WHERE id = $1', [recipientId]);
        await notificationService.notify(
          request.requester_id,
          'collaboration_declined',
          `${recipientRes.rows[0]?.name || 'A researcher'} declined your proposal`,
          `Your collaboration proposal “${request.proposal_title}” was declined.`,
          { from_user_id: recipientId, request_id: request.id }
        );
      } catch (e) {
        logger.warn('[Collaborations] decline notify failed:', e.message);
      }
      return res.status(200).json({ success: true, data: updated.rows[0], message: 'Collaboration declined' });
    }

    // Accept → create the team + membership + link, atomically.
    const client = await db.pool.connect();
    let project;
    let updatedRequest;
    try {
      await client.query('BEGIN');
      project = await createCollaborationTeam(client, {
        name: request.proposal_title,
        description: request.proposal_message || 'Research collaboration team',
        memberIds: [request.requester_id, recipientId],
        externalCollaborator: null,
      });
      const upd = await client.query(
        `UPDATE collaboration_requests SET status = 'accepted', project_id = $2, responded_at = NOW()
          WHERE id = $1 RETURNING *`,
        [requestId, project.id]
      );
      updatedRequest = upd.rows[0];
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    await syncCollaboratesEdge(request.requester_id, recipientId);

    // Notify the requester their proposal was accepted (best-effort).
    try {
      const requesterRes = await db.query('SELECT email FROM users WHERE id = $1', [request.requester_id]);
      const recipientRes = await db.query('SELECT name FROM users WHERE id = $1', [recipientId]);
      const recipientName = recipientRes.rows[0]?.name || 'A researcher';
      const emailTpl = templates.collaborationAccepted(recipientName, request.proposal_title);
      await notificationService.notify(
        request.requester_id,
        'collaboration_accepted',
        `${recipientName} accepted your proposal`,
        `Team “${project.name}” was created — start collaborating now.`,
        { from_user_id: recipientId, request_id: request.id, project_id: project.id },
        requesterRes.rows[0]?.email,
        emailTpl
      );
    } catch (e) {
      logger.warn('[Collaborations] accept notify failed:', e.message);
    }

    res.status(200).json({
      success: true,
      data: { ...updatedRequest, project_name: project.name },
      message: 'Collaboration accepted — team created',
    });
  } catch (err) {
    logger.error('[Collaborations] respond error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
