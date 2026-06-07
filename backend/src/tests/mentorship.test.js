const request = require('supertest');
const express = require('express');

// Mock dependencies before requiring the router
jest.mock('../config/db', () => ({
  query: jest.fn()
}));
jest.mock('../config/neo4j', () => ({
  getSession: jest.fn()
}));
jest.mock('../middleware/auth', () => ({
  auth: (req, res, next) => {
    // Default mock user, can be overridden by setting headers in test
    req.user = { id: req.headers['x-mock-user-id'] ? parseInt(req.headers['x-mock-user-id']) : 1 };
    next();
  }
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const db = require('../config/db');
const { getSession } = require('../config/neo4j');
const mentorshipRouter = require('../routes/mentorship');

const app = express();
app.use(express.json());
app.use('/api/v1/mentorship', mentorshipRouter);

describe('Mentorship Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /request', () => {
    it('should create a new mentorship request', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{ id: 10, mentor_id: 2, mentee_id: 1, message: 'Hi', status: 'pending' }]
        })
        .mockResolvedValue({
          rows: [{ name: 'Test User', email: 'test@example.com' }]
        });

      const response = await request(app)
        .post('/api/v1/mentorship/request')
        .set('x-mock-user-id', '1')
        .send({ mentor_id: 2, message: 'Hi' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(10);
      expect(db.query).toHaveBeenCalled();
    });

    it('should return 400 if mentor_id is missing', async () => {
      const response = await request(app)
        .post('/api/v1/mentorship/request')
        .set('x-mock-user-id', '1')
        .send({ message: 'Hi' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should return 500 on db error', async () => {
      db.query.mockRejectedValueOnce(new Error('DB error'));

      const response = await request(app)
        .post('/api/v1/mentorship/request')
        .set('x-mock-user-id', '1')
        .send({ mentor_id: 2 });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /my', () => {
    it('should fetch user mentorships', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, mentor_id: 1, mentee_id: 2, mentor_name: 'Me', mentee_name: 'Other' }
        ]
      });

      const response = await request(app)
        .get('/api/v1/mentorship/my')
        .set('x-mock-user-id', '1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [1]);
    });
  });

  describe('PATCH /:id/respond', () => {
    it('should accept a request and trigger Neo4j sync', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, mentor_id: 1, mentee_id: 2, status: 'accepted' }]
        })
        .mockResolvedValue({
          rows: [{ name: 'Test User', email: 'test@example.com' }]
        });

      const mockSessionRun = jest.fn().mockResolvedValue({});
      const mockSessionClose = jest.fn().mockResolvedValue({});
      getSession.mockReturnValue({ run: mockSessionRun, close: mockSessionClose });

      const response = await request(app)
        .patch('/api/v1/mentorship/1/respond')
        .set('x-mock-user-id', '1')
        .send({ status: 'accepted' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('accepted');
      expect(db.query).toHaveBeenCalled();
      expect(getSession).toHaveBeenCalledTimes(1);
      expect(mockSessionRun).toHaveBeenCalledTimes(1);
      expect(mockSessionClose).toHaveBeenCalledTimes(1);
    });

    it('should reject a request without triggering Neo4j sync', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, mentor_id: 1, mentee_id: 2, status: 'rejected' }]
        })
        .mockResolvedValue({
          rows: [{ name: 'Test User', email: 'test@example.com' }]
        });

      const response = await request(app)
        .patch('/api/v1/mentorship/1/respond')
        .set('x-mock-user-id', '1')
        .send({ status: 'rejected' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('rejected');
      expect(getSession).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/api/v1/mentorship/1/respond')
        .set('x-mock-user-id', '1')
        .send({ status: 'maybe' });

      expect(response.status).toBe(400);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should return 404 if request not found or unauthorized', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .patch('/api/v1/mentorship/1/respond')
        .set('x-mock-user-id', '1')
        .send({ status: 'accepted' });

      expect(response.status).toBe(404);
    });
  });
});
