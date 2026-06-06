const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getSession } = require('../config/neo4j');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// POST /request
router.post('/request', auth, async (req, res) => {
  try {
    const { mentor_id, message } = req.body;
    const mentee_id = req.user.id;

    if (!mentor_id) {
      return res.status(400).json({ success: false, message: 'Mentor ID is required' });
    }

    const result = await db.query(
      `INSERT INTO mentorships (mentor_id, mentee_id, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [mentor_id, mentee_id, message]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
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
  const session = getSession();
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

    // Trigger graph sync if accepted
    if (status === 'accepted') {
      try {
        await session.run(
          `
          MATCH (mentor:User {id: $mentorId})
          MATCH (mentee:User {id: $menteeId})
          MERGE (mentor)-[:MENTORS]->(mentee)
          `,
          {
            mentorId: mentor_id.toString(),
            menteeId: mentorship.mentee_id.toString()
          }
        );
        logger.info(`Neo4j: Created MENTORS edge from User ${mentor_id} to User ${mentorship.mentee_id}`);
      } catch (graphError) {
        logger.error(`Error syncing MENTORS edge to Neo4j: ${graphError.message}`);
        // We still return success for the DB update
      } finally {
        await session.close();
      }
    }

    res.json({ success: true, data: mentorship });
  } catch (error) {
    logger.error(`Error responding to mentorship: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
