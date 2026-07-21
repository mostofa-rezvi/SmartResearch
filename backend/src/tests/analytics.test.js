const request = require('supertest');
const express = require('express');

// Mock dependencies before requiring router
jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../middleware/auth.middleware', () => ({
  verifyAuth: (req, res, next) => {
    req.user = {
      id: req.headers['x-mock-user-id'] ? parseInt(req.headers['x-mock-user-id']) : 1,
      role: req.headers['x-mock-user-role'] || 'admin',
    };
    next();
  },
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const db = require('../config/db');
const analyticsRouter = require('../routes/analytics');

const app = express();
app.use(express.json());
app.use('/api/v1/analytics', analyticsRouter);

describe('Analytics Controller & Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization check', () => {
    it('should deny access if the user is not an admin', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .set('x-mock-user-role', 'user');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');
    });
  });

  describe('GET /api/v1/analytics/overview', () => {
    it('should retrieve overall platform metrics successfully', async () => {
      // Mock the 8 Promise.all queries + role query + domains query
      db.query
        .mockResolvedValueOnce({ rows: [{ total: '150' }] }) // total users
        .mockResolvedValueOnce({ rows: [{ count: '25' }] })  // active users
        .mockResolvedValueOnce({ rows: [{ total: '80' }] })  // connections
        .mockResolvedValueOnce({ rows: [{ total: '10' }] })  // mentorships
        .mockResolvedValueOnce({ rows: [{ total: '35' }] })  // posts
        .mockResolvedValueOnce({ rows: [{ total: '5' }] })   // groups
        .mockResolvedValueOnce({ rows: [{ total: '12' }] })  // journals
        .mockResolvedValueOnce({ rows: [{ total: '4' }] })   // projects
        .mockResolvedValueOnce({
          rows: [
            { role: 'user', count: '145' },
            { role: 'admin', count: '5' },
          ],
        }) // roles
        .mockResolvedValueOnce({
          rows: [
            { domain: 'Bioinformatics', count: 42 },
            { domain: 'Machine Learning', count: 35 },
          ],
        }); // domains

      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .set('x-mock-user-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(150);
      expect(response.body.data.activeUsersLast7Days).toBe(25);
      expect(response.body.data.totalConnections).toBe(80);
      expect(response.body.data.totalMentorships).toBe(10);
      expect(response.body.data.usersByRole).toHaveLength(2);
      expect(response.body.data.topDomains).toHaveLength(2);
    });
  });

  describe('GET /api/v1/analytics/match-quality', () => {
    it('should retrieve match quality histogram and engagement metrics', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [
            { action: 'view', count: '30' },
            { action: 'bookmark', count: '10' },
            { action: 'download', count: '5' },
          ],
        }) // action breakdown
        .mockResolvedValueOnce({ rows: [{ engaged: '10', total_viewed: '25' }] }) // engagement rate
        .mockResolvedValueOnce({
          rows: [{ week_start: '2026-06-01T00:00:00.000Z', events: '15', unique_users: '4' }],
        }) // weekly trend
        .mockResolvedValueOnce({
          rows: [
            { score_bucket: '0.9-1.0', count: '5' },
            { score_bucket: '0.8-0.9', count: '10' },
          ],
        }) // score buckets (real ML recommendation scores)
        .mockResolvedValueOnce({ rows: [{ total: 15, avg_pct: 87 }] }); // match-score aggregate

      const response = await request(app)
        .get('/api/v1/analytics/match-quality')
        .set('x-mock-user-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.engagementRate).toBe(40); // 10/25 * 100
      expect(response.body.data.histogram).toHaveLength(2);
      expect(response.body.data.histogramSource).toBe('ml_match_scores');
      expect(response.body.data.avgMatchScore).toBe(87);
      expect(response.body.data.actionDistribution).toHaveLength(3);
    });
  });

  describe('GET /api/v1/analytics/collaboration', () => {
    it('should retrieve collaboration project and milestone stats', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{ total: '10', active: '8', completed: '2', archived: '0' }],
        }) // projects
        .mockResolvedValueOnce({
          rows: [{ total: '30', completed: '15', in_progress: '10', in_review: '3', todo: '2' }],
        }) // milestones
        .mockResolvedValueOnce({ rows: [{ avg_members: 3.5, max_members: 8 }] }) // members
        .mockResolvedValueOnce({
          rows: [
            { name: 'Alpha Project', status: 'active', member_count: 5, created_at: '2026-06-01' },
          ],
        }); // top projects

      const response = await request(app)
        .get('/api/v1/analytics/collaboration')
        .set('x-mock-user-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.projects.total).toBe(10);
      expect(response.body.data.milestones.completionRate).toBe(50); // 15/30 * 100
      expect(response.body.data.members.avgPerProject).toBe('3.5');
      expect(response.body.data.topProjects).toHaveLength(1);
    });
  });

  describe('GET /api/v1/analytics/growth', () => {
    it('should retrieve weekly growth trends', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{ week_start: '2026-06-01T00:00:00.000Z', new_users: '5' }],
        }) // users growth
        .mockResolvedValueOnce({
          rows: [{ week_start: '2026-06-01T00:00:00.000Z', new_connections: '10' }],
        }) // connections growth
        .mockResolvedValueOnce({
          rows: [{ week_start: '2026-06-01T00:00:00.000Z', new_posts: '15' }],
        }); // posts growth

      const response = await request(app)
        .get('/api/v1/analytics/growth')
        .set('x-mock-user-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].newUsers).toBe(5);
      expect(response.body.data[0].newConnections).toBe(10);
      expect(response.body.data[0].newPosts).toBe(15);
    });
  });

  describe('GET /api/v1/analytics/publications', () => {
    it('should retrieve publication and saved papers metrics', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total_saved: '50', unique_researchers: '12' }] }) // saved papers summary
        .mockResolvedValueOnce({
          rows: [
            { action: 'view', count: '100' },
            { action: 'bookmark', count: '50' },
          ],
        }) // reading history by action
        .mockResolvedValueOnce({
          rows: [{ week_start: '2026-06-01T00:00:00.000Z', papers_saved: '15' }],
        }) // weekly saved papers trend
        .mockResolvedValueOnce({
          rows: [{ journal_name: 'Nature Cell Biology', count: '8' }],
        }) // top journals
        .mockResolvedValueOnce({ rows: [{ total_papers: 9, unique_authors: 4 }] }); // library papers uploaded

      const response = await request(app)
        .get('/api/v1/analytics/publications')
        .set('x-mock-user-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.savedPapers.total).toBe(50);
      expect(response.body.data.savedPapers.uniqueResearchers).toBe(12);
      expect(response.body.data.publications.totalUploaded).toBe(9);
      expect(response.body.data.readingActivity.views).toBe(100);
      expect(response.body.data.readingActivity.bookmarks).toBe(50);
      expect(response.body.data.readingActivity.downloads).toBe(0); // missing action defaults to 0
      expect(response.body.data.topJournals).toHaveLength(1);
    });
  });

  describe('GET /api/v1/analytics/weekly-report', () => {
    it('should retrieve weekly report JSON successfully', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })  // users
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // connections
        .mockResolvedValueOnce({ rows: [{ count: '15' }] }) // posts
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })  // mentorships
        .mockResolvedValueOnce({ rows: [{ count: '8' }] })  // saved papers
        .mockResolvedValueOnce({ rows: [{ count: '20', users: '6' }] }) // reading activity
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })  // flags
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })  // projects
        .mockResolvedValueOnce({
          rows: [
            {
              total_users: 150,
              total_connections: 80,
              total_mentorships: 10,
              total_posts: 35,
              total_projects: 5,
              total_saved_papers: 50,
            },
          ],
        }); // totals

      const response = await request(app)
        .get('/api/v1/analytics/weekly-report')
        .set('x-mock-user-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.weeklyHighlights.newUsers).toBe(5);
      expect(response.body.data.weeklyHighlights.newConnections).toBe(10);
      expect(response.body.data.weeklyHighlights.readingEvents).toBe(20);
      expect(response.body.data.platformTotals.totalUsers).toBe(150);
    });

    it('should generate downloadable CSV file when format=csv is queried', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })  // users
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // connections
        .mockResolvedValueOnce({ rows: [{ count: '15' }] }) // posts
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })  // mentorships
        .mockResolvedValueOnce({ rows: [{ count: '8' }] })  // saved papers
        .mockResolvedValueOnce({ rows: [{ count: '20', users: '6' }] }) // reading activity
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })  // flags
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })  // projects
        .mockResolvedValueOnce({
          rows: [
            {
              total_users: 150,
              total_connections: 80,
              total_mentorships: 10,
              total_posts: 35,
              total_projects: 5,
              total_saved_papers: 50,
            },
          ],
        }); // totals

      const response = await request(app)
        .get('/api/v1/analytics/weekly-report?format=csv')
        .set('x-mock-user-role', 'admin');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment; filename=researchbridge-weekly-');
      expect(response.text).toContain('Metric,This Week,Platform Total');
      expect(response.text).toContain('New Users,5,150');
    });
  });
});
