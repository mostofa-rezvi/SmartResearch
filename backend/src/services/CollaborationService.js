const db = require('../config/db');
const logger = require('../utils/logger');
const Y = require('yjs');

class CollaborationService {
  /**
   * Loads the document from Postgres, applies an incoming update, 
   * and saves the merged binary state back to Postgres.
   */
  async applyUpdate(projectId, updateBinary) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Fetch current document state
      const docRes = await client.query(
        'SELECT content_binary FROM collaborative_docs WHERE project_id = $1 FOR UPDATE',
        [projectId]
      );
      
      let ydoc = new Y.Doc();
      if (docRes.rowCount > 0 && docRes.rows[0].content_binary) {
        // Load existing state
        Y.applyUpdate(ydoc, docRes.rows[0].content_binary);
      } else if (docRes.rowCount === 0) {
        // Ensure doc row exists
        await client.query(
          'INSERT INTO collaborative_docs (project_id, title) VALUES ($1, $2)',
          [projectId, 'Main Research Doc']
        );
      }

      // 2. Apply incoming update
      Y.applyUpdate(ydoc, new Uint8Array(updateBinary));

      // 3. Encode the merged state
      const newState = Y.encodeStateAsUpdate(ydoc);
      const stateBuffer = Buffer.from(newState);

      // 4. Save back to Postgres
      await client.query(
        'UPDATE collaborative_docs SET content_binary = $1, updated_at = CURRENT_TIMESTAMP WHERE project_id = $2',
        [stateBuffer, projectId]
      );

      await client.query('COMMIT');
      return newState; // Return the full state (or just broadcast the update to others)
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Failed to apply Yjs update for project ${projectId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getDocumentState(projectId) {
    const docRes = await db.query(
      'SELECT content_binary FROM collaborative_docs WHERE project_id = $1',
      [projectId]
    );
    if (docRes.rowCount > 0 && docRes.rows[0].content_binary) {
      return docRes.rows[0].content_binary;
    }
    // Return empty state
    const ydoc = new Y.Doc();
    return Buffer.from(Y.encodeStateAsUpdate(ydoc));
  }
}

module.exports = new CollaborationService();
