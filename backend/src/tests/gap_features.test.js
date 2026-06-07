const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../config/db', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn()
  }
}));

jest.mock('../middleware/auth.middleware', () => ({
  verifyAuth: (req, res, next) => {
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
const communityRouter = require('../routes/community');
const projectsRouter = require('../routes/projects');

const app = express();
app.use(express.json());
app.use('/api/v1/community', communityRouter);
app.use('/api/v1/projects', projectsRouter);

describe('Gap Analysis Features Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AMA Sessions API', () => {
    describe('POST /api/v1/community/amas', () => {
      it('should schedule a new AMA session and create a community post', async () => {
        const mockProfessor = { id: 2, role: 'invited_user', name: 'Dr. John Doe' };
        const mockPost = { id: 10, user_id: 2, type: 'ama', title: 'AMA: Machine Learning Q&A', content: 'Ask me anything about ML.' };
        const mockAMA = {
          id: 5,
          professor_id: 2,
          post_id: 10,
          title: 'Machine Learning Q&A',
          description: 'Ask me anything about ML.',
          scheduled_at: '2026-07-07T10:00:00.000Z',
          end_at: '2026-07-07T12:00:00.000Z',
          status: 'scheduled'
        };

        // 1. User check query
        db.query.mockResolvedValueOnce({ rows: [mockProfessor] });
        // 2. Post creation insert query
        db.query.mockResolvedValueOnce({ rows: [mockPost] });
        // 3. AMA session insert query
        db.query.mockResolvedValueOnce({ rows: [mockAMA] });

        const response = await request(app)
          .post('/api/v1/community/amas')
          .set('x-mock-user-id', '1')
          .send({
            professor_id: 2,
            title: 'Machine Learning Q&A',
            description: 'Ask me anything about ML.',
            scheduled_at: '2026-07-07T10:00:00Z',
            end_at: '2026-07-07T12:00:00Z'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.post_id).toBe(10);
        expect(response.body.data.title).toBe('Machine Learning Q&A');
      });

      it('should return 400 if scheduled start time is after end time', async () => {
        const mockProfessor = { id: 2, role: 'invited_user', name: 'Dr. John Doe' };
        db.query.mockResolvedValueOnce({ rows: [mockProfessor] });

        const response = await request(app)
          .post('/api/v1/community/amas')
          .set('x-mock-user-id', '1')
          .send({
            professor_id: 2,
            title: 'Machine Learning Q&A',
            description: 'Ask me anything about ML.',
            scheduled_at: '2026-07-07T12:00:00Z',
            end_at: '2026-07-07T10:00:00Z'
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/community/amas', () => {
      it('should retrieve scheduled AMA sessions successfully', async () => {
        const mockAMAs = [
          { id: 1, title: 'AI Ethics', professor_name: 'Dr. Smith', question_count: 5 }
        ];
        db.query.mockResolvedValueOnce({ rows: mockAMAs });

        const response = await request(app)
          .get('/api/v1/community/amas')
          .set('x-mock-user-id', '1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockAMAs);
      });
    });
  });

  describe('Peer Review System API', () => {
    describe('POST /api/v1/projects/:id/reviews/request', () => {
      it('should request a peer review successfully', async () => {
        // 1. Project auth check
        db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ role: 'admin' }] });
        // 2. Reviewer validation
        db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ name: 'Dr. Reviewer' }] });
        // 3. Insert peer review
        const mockReview = { id: 1, project_id: 100, requester_id: 1, reviewer_id: 2, status: 'requested' };
        db.query.mockResolvedValueOnce({ rows: [mockReview] });

        const response = await request(app)
          .post('/api/v1/projects/100/reviews/request')
          .set('x-mock-user-id', '1')
          .send({ reviewer_id: 2 });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('requested');
      });

      it('should return 403 if requester is not project member', async () => {
        db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

        const response = await request(app)
          .post('/api/v1/projects/100/reviews/request')
          .set('x-mock-user-id', '1')
          .send({ reviewer_id: 2 });

        expect(response.status).toBe(403);
      });
    });

    describe('PATCH /api/v1/projects/reviews/:reviewId/status', () => {
      it('should accept a peer review request', async () => {
        const mockReview = { id: 1, project_id: 100, requester_id: 1, reviewer_id: 2, status: 'requested' };
        db.query.mockResolvedValueOnce({ rowCount: 1, rows: [mockReview] });
        
        const mockUpdatedReview = { ...mockReview, status: 'accepted' };
        db.query.mockResolvedValueOnce({ rows: [mockUpdatedReview] });

        const response = await request(app)
          .patch('/api/v1/projects/reviews/1/status')
          .set('x-mock-user-id', '2')
          .send({ status: 'accepted' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('accepted');
      });

      it('should return 403 if responder is not the assigned reviewer', async () => {
        const mockReview = { id: 1, project_id: 100, requester_id: 1, reviewer_id: 2, status: 'requested' };
        db.query.mockResolvedValueOnce({ rowCount: 1, rows: [mockReview] });

        const response = await request(app)
          .patch('/api/v1/projects/reviews/1/status')
          .set('x-mock-user-id', '3')
          .send({ status: 'accepted' });

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/v1/projects/reviews/:reviewId/submit', () => {
      it('should submit peer review content successfully', async () => {
        const mockReview = { id: 1, project_id: 100, requester_id: 1, reviewer_id: 2, status: 'accepted' };
        db.query.mockResolvedValueOnce({ rowCount: 1, rows: [mockReview] });

        const mockSubmittedReview = { ...mockReview, review_content: 'Excellent draft.', status: 'completed' };
        db.query.mockResolvedValueOnce({ rows: [mockSubmittedReview] });

        const response = await request(app)
          .post('/api/v1/projects/reviews/1/submit')
          .set('x-mock-user-id', '2')
          .send({ review_content: 'Excellent draft.' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('completed');
        expect(response.body.data.review_content).toBe('Excellent draft.');
      });
    });
  });
});
