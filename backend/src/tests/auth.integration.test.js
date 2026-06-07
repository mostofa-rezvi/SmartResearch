const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const authRoutes = require('../routes/auth');
const { envelope } = require('../utils/responseEnvelope');
const errorHandler = require('../middleware/errorHandler');

// Mock dependencies
jest.mock('../config/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    call: jest.fn(),
  }),
}));

jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

// Mock pg Pool inside controller
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { 
    Pool: jest.fn(() => mPool),
    types: {
      setTypeParser: jest.fn(),
    },
  };
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);

describe('Auth Integration Tests', () => {
  const pg = require('pg');
  const pool = new pg.Pool();
  const redis = require('../config/redis').getRedisClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // checkResult (email doesn't exist)
        .mockResolvedValueOnce({ // insertResult
          rows: [{ id: 'uuid-123', name: 'Test User', email: 'test@example.com', is_verified: false }]
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password1'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(redis.set).toHaveBeenCalled(); // Verification token in redis
    });

    it('should fail if email is already in use', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'existing' }] });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password1'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/exchange-code', () => {
    it('should exchange a valid auth code for tokens', async () => {
      const mockCode = 'valid-code';
      const mockData = JSON.stringify({ userId: 'user-123' });
      
      redis.get.mockResolvedValue(mockData);
      pool.query.mockResolvedValue({
        rows: [{ id: 'user-123', name: 'OAuth User', email: 'oauth@example.com', role: 'user' }]
      });

      const res = await request(app)
        .post('/api/v1/auth/exchange-code')
        .send({ code: mockCode });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined(); // Refresh token cookie
      expect(redis.del).toHaveBeenCalledWith(`auth_code:${mockCode}`);
    });

    it('should fail for an invalid auth code', async () => {
      redis.get.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/exchange-code')
        .send({ code: 'invalid' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens given a valid refresh token cookie', async () => {
      const mockRefreshToken = 'valid-refresh-token';
      const jwt = require('jsonwebtoken');
      const config = require('../config/index');
      
      // Generate a signed token for the mock
      const signedToken = jwt.sign({ id: 'user-123' }, config.jwt.refreshSecret);
      
      redis.get.mockResolvedValue('user-123');

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${signedToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(redis.del).toHaveBeenCalled(); // Rotation
      expect(redis.set).toHaveBeenCalled(); // Store new refresh token
    });
  });
});
