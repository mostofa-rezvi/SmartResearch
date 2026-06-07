const request = require('supertest');
const express = require('express');
const Y = require('yjs');

// Mock dependencies before requiring router
jest.mock('../config/db', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery,
    pool: {
      connect: jest.fn(),
    },
  };
});

jest.mock('../middleware/auth.middleware', () => ({
  verifyAuth: (req, res, next) => {
    req.user = {
      id: req.headers['x-mock-user-id'] ? parseInt(req.headers['x-mock-user-id']) : 1,
    };
    next();
  },
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const db = require('../config/db');
const projectsRouter = require('../routes/projects');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());

// Mock socket.io attachment middleware
const mockIo = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};
app.use((req, res, next) => {
  req.io = mockIo;
  next();
});

app.use('/api/v1/projects', projectsRouter);
app.use(errorHandler);

describe('Document Version History API', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(mockClient);

    // Default mock query implementations
    db.query.mockImplementation((sql, params) => {
      const q = sql.toLowerCase();

      // Authorization checks (project_members check inside projectService.getProject)
      if (q.includes('select role') || q.includes('project_members')) {
        return Promise.resolve({ rowCount: 1, rows: [{ role: 'admin' }] });
      }

      // Fetch projects
      if (q.includes('select * from projects')) {
        return Promise.resolve({ rowCount: 1, rows: [{ id: 1, name: 'Project Alpha' }] });
      }

      // Fetch users / members
      if (q.includes('select u.id') && q.includes('users')) {
        return Promise.resolve({ rowCount: 1, rows: [{ id: 1, name: 'John Doe', role: 'admin' }] });
      }

      // Listing versions
      if (q.includes('document_versions') && q.includes('select')) {
        return Promise.resolve({
          rows: [
            {
              id: 101,
              version_name: 'Version 1',
              preview_text: 'Preview of version 1 content',
              created_at: '2026-06-07T12:00:00Z',
              creator_name: 'John Doe',
            },
          ],
        });
      }

      return Promise.resolve({ rows: [] });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/projects/:id/versions', () => {
    it('should retrieve all version snapshots of the project document successfully', async () => {
      const response = await request(app)
        .get('/api/v1/projects/1/versions')
        .set('x-mock-user-id', '1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].version_name).toBe('Version 1');
      expect(response.body.data[0].creator_name).toBe('John Doe');
    });

    it('should block unauthorized users from listing versions', async () => {
      // Mock db queries to simulate user not in project
      db.query.mockImplementationOnce((sql, params) => {
        return Promise.resolve({ rowCount: 0 }); // project_members check returns 0 rows
      });

      const response = await request(app)
        .get('/api/v1/projects/1/versions')
        .set('x-mock-user-id', '999');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Unauthorized');
    });
  });

  describe('POST /api/v1/projects/:id/versions', () => {
    it('should create a named version snapshot of the current document state', async () => {
      // Create a dummy Yjs update binary
      const ydoc = new Y.Doc();
      const text = ydoc.getText('content');
      text.insert(0, 'Hello from Yjs');
      const stateBinary = Buffer.from(Y.encodeStateAsUpdate(ydoc));

      // Mock transaction query inside createVersionSnapshot
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ content_binary: stateBinary }] }) // SELECT content_binary FOR UPDATE
        .mockResolvedValueOnce({
          rows: [
            {
              id: 102,
              version_name: 'Snapshot 1',
              preview_text: 'Hello from Yjs',
              created_at: '2026-06-07T12:30:00Z',
            },
          ],
        }) // INSERT INTO document_versions
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .post('/api/v1/projects/1/versions')
        .set('x-mock-user-id', '1')
        .send({ versionName: 'Snapshot 1' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.version_name).toBe('Snapshot 1');
      expect(response.body.data.preview_text).toBe('Hello from Yjs');
    });

    it('should fail if versionName parameter is missing', async () => {
      const response = await request(app)
        .post('/api/v1/projects/1/versions')
        .set('x-mock-user-id', '1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('versionName is required');
    });
  });

  describe('POST /api/v1/projects/:id/versions/:versionId/revert', () => {
    it('should revert the active document to a chosen version snapshot and broadcast updates', async () => {
      const ydoc = new Y.Doc();
      const text = ydoc.getText('content');
      text.insert(0, 'Reverted text');
      const stateBinary = Buffer.from(Y.encodeStateAsUpdate(ydoc));

      // Mock transaction query inside revertToVersion
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ content_binary: stateBinary }] }) // SELECT content_binary version check
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 10 }] }) // SELECT doc FOR UPDATE check
        .mockResolvedValueOnce({ rows: [] }) // UPDATE doc content
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .post('/api/v1/projects/1/versions/102/revert')
        .set('x-mock-user-id', '1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Document successfully reverted');
      expect(response.body.data.versionId).toBe('102');

      // Verify WebSocket broadcast
      expect(mockIo.to).toHaveBeenCalledWith('project_1');
      expect(mockIo.emit).toHaveBeenCalledWith('sync:reverted', {
        versionId: '102',
        binary: expect.any(Buffer),
      });
    });
  });
});
