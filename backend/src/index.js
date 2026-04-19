require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());

// Make io accessible in routes BEFORE route registration (architecture fix)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API v1 Routes (standards.md §2: All APIs must be versioned)
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/community', require('./routes/community'));
app.use('/api/v1/journals', require('./routes/journals'));
app.use('/api/v1/discovery', require('./routes/discovery'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/moderation', require('./routes/moderation'));
app.use('/api/v1/reputation', require('./routes/reputation.routes'));

// Backward-compatible non-versioned routes (transitional)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/community', require('./routes/community'));
app.use('/api/journals', require('./routes/journals'));
app.use('/api/discovery', require('./routes/discovery'));
app.use('/api/users', require('./routes/users'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/reputation', require('./routes/reputation.routes'));

// Socket.IO Connection Event
io.on('connection', (socket) => {
  console.log('A user connected via WebSocket');
  
  socket.on('join_feed', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'UP' }, meta: { timestamp: new Date().toISOString() } });
});

// Global Error Handler (standards.md §1: centralized error middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
