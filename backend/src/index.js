require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');
const logger = require('./utils/logger');
const db = require('./config/db');
const { initRedis } = require('./config/redis');
const { initElasticsearch, initIndices } = require('./config/elasticsearch');
const { initNeo4j } = require('./config/neo4j');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',') : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());

// Initialize Passport
require('./config/passport');
const passport = require('passport');
app.use(passport.initialize());

// Global Rate Limiting
app.use('/api', apiLimiter);

// Make io accessible in routes BEFORE route registration (architecture fix)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API v1 Routes (standards.md Â§2: All APIs must be versioned)
app.use('/api/v1/auth', authLimiter, require('./routes/auth'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/community', require('./routes/community'));
app.use('/api/v1/journals', require('./routes/journals'));
app.use('/api/v1/discovery', require('./routes/discovery'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/moderation', require('./routes/moderation'));
app.use('/api/v1/reputation', require('./routes/reputation.routes'));
app.use('/api/v1/profiles', require('./routes/profile.routes'));
app.use('/api/v1/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/v1/researchers', require('./routes/researchers'));
app.use('/api/v1/onboarding', require('./routes/onboarding'));

// Backward-compatible non-versioned routes (transitional)
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/community', require('./routes/community'));
app.use('/api/journals', require('./routes/journals'));
app.use('/api/discovery', apiLimiter, require('./routes/discovery'));
app.use('/api/users', apiLimiter, require('./routes/users'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/reputation', require('./routes/reputation.routes'));
app.use('/api/profiles', require('./routes/profile.routes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/researchers', require('./routes/researchers'));
app.use('/api/onboarding', require('./routes/onboarding'));


// Socket.IO Connection Event
io.on('connection', (socket) => {
  logger.info('A user connected via WebSocket');
  
  socket.on('join_feed', (userId) => {
    socket.join(`user_${userId}`);
  });

  // --- Collaboration Workspace Logic ---
  socket.on('join_project', (projectId, user) => {
    const room = `project_${projectId}`;
    socket.join(room);
    
    // Broadcast presence
    socket.to(room).emit('presence:join', user);
    logger.info(`User ${user.id} joined project room ${room}`);

    // Load initial document state
    const collaborationService = require('./services/CollaborationService');
    collaborationService.getDocumentState(projectId).then(state => {
      socket.emit('sync:init', state);
    }).catch(err => logger.error('Failed to load document state:', err));
  });

  socket.on('sync:update', async (projectId, updateBinary) => {
    const room = `project_${projectId}`;
    // Broadcast to others immediately for low latency
    socket.to(room).emit('sync:update', updateBinary);

    // Persist to Postgres via Yjs adapter
    try {
      const collaborationService = require('./services/CollaborationService');
      await collaborationService.applyUpdate(projectId, updateBinary);
    } catch (err) {
      logger.error('Failed to persist Yjs update:', err);
    }
  });

  socket.on('leave_project', (projectId, user) => {
    const room = `project_${projectId}`;
    socket.leave(room);
    socket.to(room).emit('presence:leave', user.id);
  });
  // ------------------------------------

  socket.on('disconnect', () => {
    logger.info('User disconnected');
    // Note: To broadcast presence:leave on disconnect, we'd need to track socket.id -> project mapping.
  });
});

// Helper function for timeout
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
};

// Health Check
app.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    postgres: 'DOWN',
    redis: 'DOWN',
    neo4j: 'DOWN',
    elasticsearch: 'DOWN',
    timestamp: new Date().toISOString()
  };

  const timeoutMs = 3000;

  const checks = await Promise.allSettled([
    withTimeout(db.query('SELECT 1'), timeoutMs),
    withTimeout((async () => {
      const redisClient = require('./config/redis').getRedisClient();
      return redisClient.ping();
    })(), timeoutMs),
    withTimeout((async () => {
      const session = require('./config/neo4j').getSession();
      await session.run('RETURN 1');
      return session.close();
    })(), timeoutMs),
    withTimeout((async () => {
      const esClient = require('./config/elasticsearch').getEsClient();
      return esClient.ping();
    })(), timeoutMs)
  ]);

  if (checks[0].status === 'fulfilled') health.postgres = 'UP';
  if (checks[1].status === 'fulfilled') health.redis = 'UP';
  if (checks[2].status === 'fulfilled') health.neo4j = 'UP';
  if (checks[3].status === 'fulfilled') health.elasticsearch = 'UP';

  if (health.postgres === 'DOWN' || health.redis === 'DOWN' || health.neo4j === 'DOWN' || health.elasticsearch === 'DOWN') {
    health.status = 'DEGRADED';
  }

  res.json({ success: true, data: health, meta: { timestamp: health.timestamp } });
});

// Global Error Handler (standards.md Â§1: centralized error middleware)
app.use(errors()); // Handle Joi validation errors
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  try {
    // Principal Database Initialization
    await db.query('SELECT NOW()');
    logger.info('PostgreSQL connected successfully');

    // Secondary Stores Initialization
    initRedis();
    initElasticsearch();
    await initIndices();
    initNeo4j();
    
    // Start Background Workers
    const graphSyncWorker = require('./workers/graphSync.worker');
    await graphSyncWorker.init();
    graphSyncWorker.start().catch(err => logger.error('GraphSync worker error', err));
    
    const searchSyncWorker = require('./workers/searchSync.worker');
    await searchSyncWorker.init();
    searchSyncWorker.start().catch(err => logger.error('SearchSync worker error', err));
    
    logger.info('Multi-database environment initialized successfully');
  } catch (err) {
    logger.error('Core database connection failed:', err.message);
  }
});
