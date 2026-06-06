const request = require('supertest');
const express = require('express');
const projectRoutes = require('../../src/routes/projects');
const { envelope } = require('../../src/utils/responseEnvelope');
const errorHandler = require('../../src/middleware/errorHandler');

// Mock verifyAuth to bypass JWT signature check and inject a mock user
jest.mock('../../src/middleware/auth.middleware', () => ({
  verifyAuth: (req, res, next) => {
    req.user = { id: 100 }; // Mocked user ID
    next();
  }
}));

// Mock db
jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/v1/projects', projectRoutes);
app.use(errorHandler);

describe('Projects Route Integration Tests', () => {
  const db = require('../../src/config/db');
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    db.pool.connect.mockResolvedValue(mockClient);
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce() // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Quantum Project' }] }) // INSERT projects
        .mockResolvedValueOnce() // INSERT member
        .mockResolvedValueOnce() // INSERT doc
        .mockResolvedValueOnce(); // COMMIT

      const res = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'Quantum Project', description: 'Quantum ML Integrations' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.name).toBe('Quantum Project');
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should retrieve project details', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ role: 'admin' }] }) // authCheck
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Quantum Project', description: 'Quantum ML Integrations' }] }) // projectRes
        .mockResolvedValueOnce({ rows: [{ id: 100, name: 'Researcher A', role: 'admin' }] }); // membersRes

      const res = await request(app)
        .get('/api/v1/projects/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Quantum Project');
      expect(res.body.data.members).toHaveLength(1);
    });

    it('should return 403 if user is unauthorized', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // Unauthorized membership check

      const res = await request(app)
        .get('/api/v1/projects/1');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/projects/:id/milestones', () => {
    it('should return a list of milestones for a project', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 10, project_id: 1, title: 'Draft literature review', status: 'TODO' },
          { id: 11, project_id: 1, title: 'Write methodology section', status: 'IN_PROGRESS' }
        ]
      });

      const res = await request(app)
        .get('/api/v1/projects/1/milestones');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe('Draft literature review');
    });
  });

  describe('POST /api/v1/projects/:id/milestones', () => {
    it('should create a milestone successfully', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 12, project_id: 1, title: 'New Milestone', description: 'Sample Desc', status: 'TODO' }]
      });

      const res = await request(app)
        .post('/api/v1/projects/1/milestones')
        .send({ title: 'New Milestone', description: 'Sample Desc' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Milestone');
    });
  });

  describe('PATCH /api/v1/projects/milestones/:milestoneId/status', () => {
    it('should update milestone status successfully', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'TODO', project_id: 1 }] }) // current status check
        .mockResolvedValueOnce({ rows: [{ id: 10, status: 'IN_PROGRESS' }] }); // update status query

      const res = await request(app)
        .patch('/api/v1/projects/milestones/10/status')
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('should fail status update for invalid transition', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'TODO', project_id: 1 }] }); // TODO -> DONE invalid transition

      const res = await request(app)
        .patch('/api/v1/projects/milestones/10/status')
        .send({ status: 'DONE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid transition');
    });
  });
});
