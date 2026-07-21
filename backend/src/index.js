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
const { socketAuthMiddleware } = require('./middleware/auth');
const notificationService = require('./services/notification.service');

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',') : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST']
  }
});

require('./services/socket.service').init(io);
notificationService.init(io); // Inject io so notification.service can emit live events


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
app.use('/api/v1/search', require('./routes/search'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/blogs', require('./routes/blogs'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/mentorship', require('./routes/mentorship'));
app.use('/api/v1/tasks', require('./routes/tasks'));
app.use('/api/v1/connections', require('./routes/connections'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/publications', require('./routes/publications'));
app.use('/api/v1/analytics', require('./routes/analytics'));
app.use('/api/v1/library', require('./routes/library.routes'));


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
app.use('/api/search', require('./routes/search'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/publications', require('./routes/publications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/library', require('./routes/library.routes'));



// Apply Socket.IO Auth Middleware
io.use(socketAuthMiddleware);

// Socket.IO Connection Event
io.on('connection', (socket) => {
  logger.info(`A user connected via WebSocket: ${socket.user?.id}`);

  // Auto-join the authenticated user's personal room so live notifications
  // (`notification:new` emitted to `user_${id}`) always reach every socket
  // they open — the notification bell no longer needs to emit `join_feed`.
  if (socket.user?.id) {
    socket.join(`user_${socket.user.id}`);
  }

  socket.on('join_feed', (userId) => {
    if (userId !== socket.user?.id) return;
    socket.join(`user_${userId}`);
  });

  // --- Collaboration Workspace Logic ---
  socket.on('join_project', async (projectId, user) => {
    try {
      // Verify project membership
      const authCheck = await db.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, socket.user.id]
      );
      
      if (authCheck.rowCount === 0) {
        socket.emit('error', { message: 'Unauthorized to join project' });
        return;
      }

      const room = `project_${projectId}`;
      socket.join(room);
      
      // Broadcast presence securely
      socket.to(room).emit('presence:join', socket.user);
      logger.info(`User ${socket.user.id} joined project room ${room}`);

      // Load initial document state
      const collaborationService = require('./services/CollaborationService');
      collaborationService.getDocumentState(projectId).then(state => {
        socket.emit('sync:init', state);
      }).catch(err => logger.error('Failed to load document state:', err));
    } catch (err) {
      logger.error('Error joining project room', err);
      socket.emit('error', { message: 'Server error joining project' });
    }
  });

  socket.on('sync:update', async (projectId, updateBinary) => {
    const room = `project_${projectId}`;
    if (!socket.rooms.has(room)) {
      return; // Must join room first to sync
    }

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

  // Awareness (live cursors / presence) — relay-only, not persisted
  socket.on('awareness:update', (projectId, updateBinary) => {
    const room = `project_${projectId}`;
    if (!socket.rooms.has(room)) return;
    socket.to(room).emit('awareness:update', updateBinary);
  });

  socket.on('leave_project', (projectId, user) => {
    const room = `project_${projectId}`;
    socket.leave(room);
    socket.to(room).emit('presence:leave', socket.user.id);
  });
  // ------------------------------------

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.user?.id}`);
  });
});

// Helper function for timeout
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
};

// Prometheus metrics (dependency-free exposition). Scrape at GET /metrics.
let _httpRequests = 0;
app.use((req, _res, next) => { _httpRequests++; next(); });
app.get('/metrics', (req, res) => {
  const mem = process.memoryUsage();
  const lines = [
    '# HELP process_uptime_seconds Process uptime in seconds.',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${process.uptime().toFixed(0)}`,
    '# HELP process_resident_memory_bytes Resident memory size in bytes.',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${mem.rss}`,
    '# HELP nodejs_heap_used_bytes Node.js heap used in bytes.',
    '# TYPE nodejs_heap_used_bytes gauge',
    `nodejs_heap_used_bytes ${mem.heapUsed}`,
    '# HELP http_requests_total Total HTTP requests handled since boot.',
    '# TYPE http_requests_total counter',
    `http_requests_total ${_httpRequests}`,
  ];
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n') + '\n');
});

// API documentation — raw OpenAPI spec + a dependency-free Redoc viewer.
app.get('/openapi.yaml', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  res.type('text/yaml');
  fs.createReadStream(path.join(__dirname, '../openapi.yaml')).on('error', () =>
    res.status(404).send('spec not found')).pipe(res);
});
app.get('/api-docs', (req, res) => {
  res.type('html').send(
    '<!doctype html><html><head><title>ResearchBridge API</title><meta charset="utf-8"/>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"/></head>' +
    '<body style="margin:0"><redoc spec-url="/openapi.yaml"></redoc>' +
    '<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script></body></html>'
  );
});

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
    
    // Initialize Storage (MinIO bucket creation)
    const { initStorage } = require('./services/storage.service');
    await initStorage();
    
    // Start Background Workers
    const graphSyncWorker = require('./workers/graphSync.worker');
    await graphSyncWorker.init();
    graphSyncWorker.start().catch(err => logger.error('GraphSync worker error', err));
    
    const searchSyncWorker = require('./workers/searchSync.worker');
    await searchSyncWorker.init();
    searchSyncWorker.start().catch(err => logger.error('SearchSync worker error', err));

    const notificationWorker = require('./workers/notification.worker');
    await notificationWorker.init();
    notificationWorker.start().catch(err => logger.error('Notification worker error', err));

    // TrustRank (Module 5): recompute credibility PageRank periodically (every 15 min) + once at boot
    const trustRankService = require('./services/trustrank.service');
    const runTrustRank = () => trustRankService.refreshTrustRank()
      .catch(err => logger.error(`[TrustRank] refresh failed: ${err.message}`));
    setTimeout(runTrustRank, 8000); // after datastores settle
    setInterval(runTrustRank, 15 * 60 * 1000);

    logger.info('Multi-database environment initialized successfully');
  } catch (err) {
    logger.error('Core database connection failed:', err.message);
  }
});
