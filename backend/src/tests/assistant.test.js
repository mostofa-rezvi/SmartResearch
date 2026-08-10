const request = require('supertest');
const express = require('express');
const { errors } = require('celebrate');

// ── Mocks (must be declared before the router is required) ──────────────────
jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('axios');

jest.mock('../middleware/auth.middleware', () => ({
  verifyAuth: (req, res, next) => {
    req.user = { id: 1, name: 'Tester', email: 't@e.com', role: 'user' };
    next();
  },
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const db = require('../config/db');
const axios = require('axios');
const assistantRouter = require('../routes/assistant');

const app = express();
app.use(express.json());
app.use('/api/v1/assistant', assistantRouter);
app.use(errors()); // celebrate validation error handler
// generic error handler mirroring the app's next(err) contract
app.use((err, req, res, next) => {
  res.status(err.status || err.statusCode || 500).json({ success: false, error: { message: err.message } });
});

describe('Assistant (Agentic AI) Routes', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /assistant/chat', () => {
    it('persists turns and returns the grounded answer shape', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 42 }] }) // INSERT session RETURNING id
        .mockResolvedValueOnce({ rows: [] })           // load last 6 messages
        .mockResolvedValueOnce({ rows: [] })           // INSERT user message
        .mockResolvedValueOnce({ rows: [] })           // INSERT assistant message
        .mockResolvedValueOnce({ rows: [] });          // UPDATE session.updated_at

      axios.post.mockResolvedValueOnce({
        data: {
          answer: 'Grounded answer [1]',
          sources: [{ id: '7', type: 'paper', title: 'X', snippet: '...', score: 0.8 }],
          followups: ['More?'],
          degraded: false,
        },
      });

      const res = await request(app)
        .post('/api/v1/assistant/chat')
        .send({ query: 'who works on low-resource NLP?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.session_id).toBe(42);
      expect(res.body.data.answer).toBe('Grounded answer [1]');
      expect(res.body.data.sources).toHaveLength(1);
      expect(res.body.data.followups).toEqual(['More?']);
      // assistant message persisted with sources jsonb
      const assistantInsert = db.query.mock.calls.find(
        (c) => /INSERT INTO assistant_chat_messages/.test(c[0]) && /assistant/.test(c[0])
      );
      expect(assistantInsert).toBeDefined();
    });

    it('degrades (no throw, 200) when the ML service fails', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 99 }] });
      axios.post.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const res = await request(app)
        .post('/api/v1/assistant/chat')
        .send({ query: 'anything' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.degraded).toBe(true);
      expect(typeof res.body.data.answer).toBe('string');
      expect(res.body.data.sources).toEqual([]);
    });

    it('rejects an empty query (validation)', async () => {
      const res = await request(app).post('/api/v1/assistant/chat').send({ query: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /assistant/summarize', () => {
    it('returns the summary shape for my_library scope', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, title: 'Paper A', abstract: 'abs', full_text: 'body', user_id: 1, tags: [] }],
        }) // gather library_items
        .mockResolvedValueOnce({ rows: [{ id: 5 }] }); // cache insert

      axios.post.mockResolvedValueOnce({
        data: {
          overview: 'Overview text',
          themes: [{ theme: 'T1', summary: 's', papers: ['1'] }],
          notable: [{ id: '1', title: 'Paper A', why: 'seminal' }],
          doc_count: 1,
          degraded: false,
        },
      });

      const res = await request(app)
        .post('/api/v1/assistant/summarize')
        .send({ scope: 'my_library' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview).toBe('Overview text');
      expect(res.body.data.themes).toHaveLength(1);
      expect(res.body.data.notable).toHaveLength(1);
      expect(res.body.data.degraded).toBe(false);
    });

    it('degrades (200) when the ML summarizer fails', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] }) // gather (empty is ok)
        .mockResolvedValueOnce({ rows: [{ id: 6 }] }); // cache insert
      axios.post.mockRejectedValueOnce(new Error('timeout'));

      const res = await request(app)
        .post('/api/v1/assistant/summarize')
        .send({ scope: 'all' });

      expect(res.status).toBe(200);
      expect(res.body.data.degraded).toBe(true);
      expect(Array.isArray(res.body.data.themes)).toBe(true);
    });
  });

  describe('POST /assistant/paper-qa', () => {
    it('returns 404 when the item is missing', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // SELECT library_items -> none

      const res = await request(app)
        .post('/api/v1/assistant/paper-qa')
        .send({ item_id: 12345, question: 'what dataset?' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('returns answer + supporting_quotes for an existing item', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 3, title: 'Paper', abstract: 'a', full_text: 'full body text' }],
      });
      axios.post.mockResolvedValueOnce({
        data: { answer: 'They used CoNLL.', supporting_quotes: [{ quote: 'q', score: 0.7 }], degraded: false },
      });

      const res = await request(app)
        .post('/api/v1/assistant/paper-qa')
        .send({ item_id: 3, question: 'what dataset?' });

      expect(res.status).toBe(200);
      expect(res.body.data.answer).toBe('They used CoNLL.');
      expect(res.body.data.supporting_quotes).toHaveLength(1);
    });

    it('degrades (200) when the ML QA call fails', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 3, title: 'Paper', abstract: 'a', full_text: 'body' }],
      });
      axios.post.mockRejectedValueOnce(new Error('ML down'));

      const res = await request(app)
        .post('/api/v1/assistant/paper-qa')
        .send({ item_id: 3, question: 'q?' });

      expect(res.status).toBe(200);
      expect(res.body.data.degraded).toBe(true);
    });
  });
});
