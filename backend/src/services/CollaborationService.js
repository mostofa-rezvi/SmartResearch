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

  /**
   * Creates a snapshot version of the collaborative document for the project.
   * Extracts the plaintext/HTML preview from the Yjs binary.
   */
  async createVersionSnapshot(projectId, userId, versionName) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch current document content
      const docRes = await client.query(
        'SELECT content_binary FROM collaborative_docs WHERE project_id = $1 FOR UPDATE',
        [projectId]
      );

      if (docRes.rowCount === 0 || !docRes.rows[0].content_binary) {
        throw new Error('No collaborative document found for project');
      }

      const contentBinary = docRes.rows[0].content_binary;

      // 2. Decode update binary to extract preview text using Yjs XmlFragment/Text
      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, new Uint8Array(contentBinary));
      
      // TipTap stores text in a Y.XmlFragment named 'default' by default
      // Custom tests or other Yjs sync methods may use a Y.Text named 'content'
      const xmlFragment = ydoc.getXmlFragment('default');
      const textType = ydoc.getText('content');
      
      let previewText = '';
      if (xmlFragment && xmlFragment.toString() && xmlFragment.toString() !== '[]') {
        previewText = xmlFragment.toString();
      } else if (textType && textType.toString()) {
        previewText = textType.toString();
      } else {
        previewText = 'Empty Document';
      }

      // 3. Save snapshot version
      const insertRes = await client.query(
        `INSERT INTO document_versions (project_id, version_name, content_binary, preview_text, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, version_name, preview_text, created_at`,
        [projectId, versionName, contentBinary, previewText, userId]
      );

      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Failed to create version snapshot for project ${projectId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reverts the project collaborative document to a specified version.
   * Returns the reverted content binary.
   */
  async revertToVersion(projectId, versionId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get version binary
      const verRes = await client.query(
        'SELECT content_binary FROM document_versions WHERE id = $1 AND project_id = $2',
        [versionId, projectId]
      );

      if (verRes.rowCount === 0) {
        throw new Error('Version snapshot not found');
      }

      const contentBinary = verRes.rows[0].content_binary;

      // 2. Update active collaborative document content
      // Note: Ensure the collaborative document row exists
      const docCheck = await client.query(
        'SELECT id FROM collaborative_docs WHERE project_id = $1 FOR UPDATE',
        [projectId]
      );

      if (docCheck.rowCount === 0) {
        await client.query(
          'INSERT INTO collaborative_docs (project_id, title, content_binary) VALUES ($1, $2, $3)',
          [projectId, 'Main Research Doc', contentBinary]
        );
      } else {
        await client.query(
          'UPDATE collaborative_docs SET content_binary = $1, updated_at = CURRENT_TIMESTAMP WHERE project_id = $2',
          [contentBinary, projectId]
        );
      }

      await client.query('COMMIT');
      return contentBinary;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Failed to revert to version ${versionId} for project ${projectId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves all snapshots for a project, joined with the creator's user name.
   */
  async listVersions(projectId) {
    const { rows } = await db.query(
      `SELECT dv.id, dv.version_name, dv.preview_text, dv.created_at, u.name as creator_name
         FROM document_versions dv
         LEFT JOIN users u ON dv.created_by = u.id
        WHERE dv.project_id = $1
        ORDER BY dv.created_at DESC`,
      [projectId]
    );
    return rows;
  }
}

module.exports = new CollaborationService();
