const request = require('supertest');
const express = require('express');

// Mock dependencies before requiring the router
jest.mock('../config/db', () => ({
  query: jest.fn()
}));
jest.mock('../middleware/auth.middleware', () => ({
  verifyAuth: (req, res, next) => {
    req.user = { id: req.headers['x-mock-user-id'] ? parseInt(req.headers['x-mock-user-id']) : 1 };
    next();
  }
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

const db = require('../config/db');
const usersRouter = require('../routes/users');

const app = express();
app.use(express.json());
app.use('/api/v1/users', usersRouter);

describe('Reading History Controller & Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users/me/history', () => {
    it('should retrieve the user\'s reading history successfully', async () => {
      const mockHistory = [
        { id: 1, paper_id: '123', paper_title: 'Title 1', paper_doi: 'doi-1', action: 'view', read_at: '2026-06-06T12:00:00Z' },
        { id: 2, paper_id: '456', paper_title: 'Title 2', paper_doi: 'doi-2', action: 'bookmark', read_at: '2026-06-06T13:00:00Z' }
      ];

      db.query.mockResolvedValueOnce({ rows: mockHistory });

      const response = await request(app)
        .get('/api/v1/users/me/history')
        .set('x-mock-user-id', '1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockHistory);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, paper_id, paper_title, paper_doi, action, read_at FROM reading_history WHERE user_id = $1 ORDER BY read_at DESC',
        [1]
      );
    });

    it('should return 500 status on database failure', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Query Error'));

      const response = await request(app)
        .get('/api/v1/users/me/history')
        .set('x-mock-user-id', '1');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/v1/users/me/history', () => {
    it('should save a reading history record successfully', async () => {
      const mockRecord = {
        id: 1,
        user_id: 1,
        paper_id: '123',
        paper_title: 'Title 1',
        paper_doi: 'doi-1',
        action: 'view',
        read_at: '2026-06-06T12:00:00Z'
      };

      db.query.mockResolvedValueOnce({ rows: [mockRecord] });

      const response = await request(app)
        .post('/api/v1/users/me/history')
        .set('x-mock-user-id', '1')
        .send({
          paper_id: '123',
          paper_title: 'Title 1',
          paper_doi: 'doi-1',
          action: 'view'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRecord);
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO reading_history (user_id, paper_id, paper_title, paper_doi, action) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [1, '123', 'Title 1', 'doi-1', 'view']
      );
    });

    it('should return 500 status on database failure during insert', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Insert Error'));

      const response = await request(app)
        .post('/api/v1/users/me/history')
        .set('x-mock-user-id', '1')
        .send({
          paper_id: '123',
          paper_title: 'Title 1',
          paper_doi: 'doi-1',
          action: 'view'
        });

      expect(response.status).toBe(500);
    });
  });
});
