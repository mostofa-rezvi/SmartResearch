require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/community', require('./routes/community'));
app.use('/api/journals', require('./routes/journals'));
app.use('/api/discovery', require('./routes/discovery'));
app.use('/api/users', require('./routes/users'));
app.use('/api/moderation', require('./routes/moderation'));

// Make io accessible in routes if needed (e.g., via req.app.get('io') or just by exporting it, but here we can just attach it to req)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO Connection Event
io.on('connection', (socket) => {
  console.log('A user connected via WebSocket');
  
  // Basic room joining for personalized feeds
  socket.on('join_feed', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Basic Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
