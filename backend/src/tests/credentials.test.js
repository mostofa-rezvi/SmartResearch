const request = require('supertest');
const express = require('express');

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

jest.mock('../services/storage.service', () => ({
  uploadFile: jest.fn().mockResolvedValue('https://mock-s3-url.com/avatars/new.png'),
}));

const db = require('../config/db');
const profileRouter = require('../routes/profile.routes');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/v1/profiles', profileRouter);
app.use(errorHandler);

describe('Researcher Credentials (Audit Logs & Achievements)', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(mockClient);

    // Setup intelligent dynamic mock for db.query to avoid fragile call-order dependencies
    db.query.mockImplementation((sql, params) => {
      const q = sql.toLowerCase();

      if (q.includes('profile_audit_logs') && q.includes('count')) {
        return Promise.resolve({ rows: [{ cnt: '1' }] });
      }
      if (q.includes('profile_audit_logs')) {
        return Promise.resolve({
          rows: [
            {
              id: 10,
              action: 'profile_update',
              changed_fields: ['bio'],
              old_values: { bio: 'Old' },
              new_values: { bio: 'New' },
              ip_address: '127.0.0.1',
              created_at: '2026-06-07T10:00:00Z',
            },
          ],
        });
      }
      if (q.includes('reading_history') && q.includes('bookmark')) {
        return Promise.resolve({ rows: [{ cnt: '5' }] });
      }
      if (q.includes('connections') && q.includes('accepted')) {
        return Promise.resolve({ rows: [{ cnt: '3' }] });
      }
      if (q.includes('community_posts')) {
        return Promise.resolve({ rows: [{ cnt: '2' }] });
      }
      if (q.includes('comments')) {
        return Promise.resolve({ rows: [{ cnt: '4' }] });
      }
      if (q.includes('reading_history') && q.includes('distinct')) {
        return Promise.resolve({ rows: [{ cnt: '5' }] });
      }
      if (q.includes('users') && q.includes('select')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              name: 'Test Name',
              bio: 'Bio',
              avatar_url: 'http://avatar.jpg',
              institution_id: 1,
              educational_status: 'phd',
            },
          ],
        });
      }
      if (q.includes('user_achievements') && q.includes('select')) {
        return Promise.resolve({
          rows: [
            {
              achievement_type: 'papers_saved',
              achievement_level: 'bronze',
              achievement_data: { count: 5, label: 'Paper Archivist', icon: '📚' },
              awarded_at: '2026-06-07T10:00:00Z',
            },
          ],
        });
      }
      if (q.includes('user_achievements') && (q.includes('insert') || q.includes('update'))) {
        return Promise.resolve({ rows: [] });
      }

      return Promise.resolve({ rows: [] });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/profiles/me/audit-log', () => {
    it('should retrieve the paginated append-only profile change history', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/me/audit-log?page=1&limit=20')
        .set('x-mock-user-id', '1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
    });
  });

  describe('GET /api/v1/profiles/me/achievements', () => {
    it('should compute achievements progress and return earned badges', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/me/achievements')
        .set('x-mock-user-id', '1');

      if (response.status !== 200) {
        console.error('Achievements failed response:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.achievements).toBeDefined();

      const papersSaved = response.body.data.achievements.find(a => a.type === 'papers_saved');
      expect(papersSaved.earned_level).toBe('bronze');
    });
  });

  describe('PUT /api/v1/profiles/me', () => {
    it('should update profile and log changed fields into profile_audit_logs', async () => {
      // Mock Transaction query on client
      mockClient.query.mockImplementation((sql, params) => {
        const q = sql.toLowerCase();
        if (q.includes('begin') || q.includes('commit')) {
          return Promise.resolve({ rows: [] });
        }
        if (q.includes('select') && q.includes('users')) {
          return Promise.resolve({
            rows: [{ name: 'Old Name', bio: 'Old Bio', linkedin_url: null }],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      // Mock the final profile fetch at the end of updateProfile
      db.query.mockImplementation((sql, params) => {
        const q = sql.toLowerCase();
        if (q.includes('select') && q.includes('users')) {
          return Promise.resolve({
            rows: [{ id: 1, name: 'New Name', bio: 'New Bio', onboarding_completed: true }],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .put('/api/v1/profiles/me')
        .set('x-mock-user-id', '1')
        .send({
          name: 'New Name',
          bio: 'New Bio',
        });

      if (response.status !== 200) {
        console.error('PUT failed response:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('New Name');
    });
  });
});
