const db = require('../config/db');
const axios = require('axios');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Assistant (Agentic AI) service — RAG chat, volume summarization and single-paper QA.
 *
 * All LLM/ML calls degrade gracefully: on any ML error the caller still receives a
 * well-formed payload with `degraded:true` and a helpful message, never a 500.
 */
class AssistantService {
  // ── RAG Chat ───────────────────────────────────────────────────────────────

  /**
   * Conversational RAG. Creates a session on first message, loads the last 6
   * messages as history, proxies the ML `/rag/chat` endpoint, persists the
   * user + assistant turns, and returns the grounded answer with sources.
   */
  async chat(userId, query, sessionId = null) {
    // Resolve / create the session (verify ownership if an id is supplied)
    let session;
    if (sessionId) {
      const owned = await db.query(
        `SELECT id FROM assistant_chat_sessions WHERE id = $1 AND user_id = $2`,
        [sessionId, userId]
      );
      if (owned.rows.length === 0) {
        const e = new Error('Session not found'); e.status = 404; throw e;
      }
      session = { id: sessionId };
    } else {
      const title = (query || '').trim().slice(0, 60) || 'New chat';
      const created = await db.query(
        `INSERT INTO assistant_chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id`,
        [userId, title]
      );
      session = { id: created.rows[0].id };
    }

    // Load last 6 messages of the session (chronological order for the LLM)
    const histRes = await db.query(
      `SELECT role, content FROM assistant_chat_messages
        WHERE session_id = $1 ORDER BY created_at DESC LIMIT 6`,
      [session.id]
    );
    const history = histRes.rows.reverse().map((r) => ({ role: r.role, content: r.content }));

    // Proxy the ML RAG endpoint; degrade on any failure
    let answer, sources, followups, degraded = false;
    try {
      const res = await axios.post(
        `${ML_SERVICE_URL}/rag/chat`,
        { query, history },
        { timeout: 60000 }
      );
      const data = res.data || {};
      answer = data.answer || '';
      sources = Array.isArray(data.sources) ? data.sources : [];
      followups = Array.isArray(data.followups) ? data.followups : [];
      degraded = data.degraded === true;
    } catch (e) {
      logger.warn(`[Assistant] chat ML call failed: ${e.message}`);
      answer = 'The AI assistant is temporarily unavailable. Please try again in a moment.';
      sources = [];
      followups = [];
      degraded = true;
    }

    // Persist the user turn then the assistant turn (sources as jsonb)
    await db.query(
      `INSERT INTO assistant_chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
      [session.id, query]
    );
    await db.query(
      `INSERT INTO assistant_chat_messages (session_id, role, content, sources)
       VALUES ($1, 'assistant', $2, $3::jsonb)`,
      [session.id, answer, JSON.stringify(sources)]
    );
    await db.query(
      `UPDATE assistant_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [session.id]
    );

    return { session_id: session.id, answer, sources, followups, degraded };
  }

  /** List the caller's chat sessions (most recently updated first). */
  async listSessions(userId) {
    const res = await db.query(
      `SELECT id, title, created_at, updated_at
         FROM assistant_chat_sessions WHERE user_id = $1
        ORDER BY updated_at DESC`,
      [userId]
    );
    return res.rows;
  }

  /** Messages for a session the caller owns (403 otherwise). */
  async getMessages(userId, sessionId) {
    const owned = await db.query(
      `SELECT id FROM assistant_chat_sessions WHERE id = $1`,
      [sessionId]
    );
    if (owned.rows.length === 0) {
      const e = new Error('Session not found'); e.status = 404; throw e;
    }
    const ownerCheck = await db.query(
      `SELECT id FROM assistant_chat_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    if (ownerCheck.rows.length === 0) {
      const e = new Error('Not authorized'); e.status = 403; throw e;
    }
    const res = await db.query(
      `SELECT id, role, content, sources, created_at
         FROM assistant_chat_messages WHERE session_id = $1
        ORDER BY created_at ASC`,
      [sessionId]
    );
    return res.rows;
  }

  /** Delete a session the caller owns (messages cascade). */
  async deleteSession(userId, sessionId) {
    const res = await db.query(
      `DELETE FROM assistant_chat_sessions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [sessionId, userId]
    );
    if (res.rows.length === 0) {
      const e = new Error('Session not found'); e.status = 404; throw e;
    }
    return { deleted: true, id: sessionId };
  }

  // ── Volume Summary ───────────────────────────────────────────────────────────

  /**
   * Map-reduce summary over a collection of library items chosen by scope:
   *   my_library : the caller's items (recent 20)
   *   all        : recent 20 items across everyone
   *   ids        : specific item ids
   *   journal    : best-effort ILIKE match of the journal string
   */
  async summarize(userId, { scope, journal, ids } = {}) {
    let rows = [];
    const cols = 'id, title, abstract, full_text, user_id, tags';

    if (scope === 'my_library') {
      const r = await db.query(
        `SELECT ${cols} FROM library_items WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [userId]
      );
      rows = r.rows;
    } else if (scope === 'all') {
      const r = await db.query(
        `SELECT ${cols} FROM library_items ORDER BY created_at DESC LIMIT 20`
      );
      rows = r.rows;
    } else if (scope === 'ids') {
      const idList = Array.isArray(ids) ? ids : [];
      if (idList.length > 0) {
        const r = await db.query(
          `SELECT ${cols} FROM library_items WHERE id = ANY($1) LIMIT 20`,
          [idList]
        );
        rows = r.rows;
      }
    } else if (scope === 'journal') {
      const j = (journal || '').trim();
      if (j) {
        const like = `%${j}%`;
        const r = await db.query(
          `SELECT ${cols} FROM library_items
            WHERE title ILIKE $1 OR abstract ILIKE $1 OR authors ILIKE $1
            ORDER BY created_at DESC LIMIT 20`,
          [like]
        );
        rows = r.rows;
      }
    }

    const scopeLabel = this._scopeLabel(scope, journal, rows.length);
    const documents = rows.map((r) => ({
      id: String(r.id),
      title: r.title || '',
      text: `${r.abstract || ''} ${r.full_text || ''}`.trim().slice(0, 3000),
    }));

    // Proxy the ML summarize endpoint; degrade on any failure
    let summary, degraded = false;
    try {
      const res = await axios.post(
        `${ML_SERVICE_URL}/rag/summarize`,
        { documents, scope_label: scopeLabel },
        { timeout: 90000 }
      );
      summary = res.data || {};
      if (typeof summary.doc_count !== 'number') summary.doc_count = documents.length;
      degraded = summary.degraded === true;
    } catch (e) {
      logger.warn(`[Assistant] summarize ML call failed: ${e.message}`);
      summary = {
        overview: 'The AI summarizer is temporarily unavailable. Please try again in a moment.',
        themes: [],
        notable: [],
        doc_count: documents.length,
        degraded: true,
      };
      degraded = true;
    }

    // Cache the result (best-effort — never fail the request on cache errors)
    try {
      await db.query(
        `INSERT INTO assistant_summaries (user_id, scope_key, result)
         VALUES ($1, $2, $3::jsonb)`,
        [userId, scopeLabel, JSON.stringify(summary)]
      );
    } catch (e) {
      logger.warn(`[Assistant] summary cache write failed: ${e.message}`);
    }

    return { ...summary, degraded, scope_label: scopeLabel };
  }

  _scopeLabel(scope, journal, count) {
    if (scope === 'my_library') return `My Library (${count} items)`;
    if (scope === 'all') return `All Papers (${count} items)`;
    if (scope === 'ids') return `Selected (${count} items)`;
    if (scope === 'journal') return `Journal: ${journal || ''} (${count} items)`;
    return `Summary (${count} items)`;
  }

  // ── Paper QA ─────────────────────────────────────────────────────────────────

  /** Question-answering grounded in a single library item's text. */
  async paperQa(userId, itemId, question) {
    const res = await db.query(
      `SELECT id, title, abstract, full_text FROM library_items WHERE id = $1`,
      [itemId]
    );
    if (res.rows.length === 0) {
      const e = new Error('Item not found'); e.status = 404; throw e;
    }
    const item = res.rows[0];
    const text = item.full_text || item.abstract || '';

    try {
      const ml = await axios.post(
        `${ML_SERVICE_URL}/rag/paper-qa`,
        { question, title: item.title || '', text },
        { timeout: 60000 }
      );
      const data = ml.data || {};
      return {
        answer: data.answer || '',
        supporting_quotes: Array.isArray(data.supporting_quotes) ? data.supporting_quotes : [],
        degraded: data.degraded === true,
      };
    } catch (e) {
      logger.warn(`[Assistant] paper-qa ML call failed: ${e.message}`);
      return {
        answer: 'The AI assistant is temporarily unavailable for this paper. Please try again in a moment.',
        supporting_quotes: [],
        degraded: true,
      };
    }
  }
}

module.exports = new AssistantService();
