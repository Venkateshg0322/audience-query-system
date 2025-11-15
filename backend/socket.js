// backend/socket.js - Real-time WebSocket Server
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Join all-users room for broadcasts
    socket.join('all-users');
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.broadcast.emit('user-typing', {
        userId: socket.userId,
        queryId: data.queryId
      });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Emit events to specific users or all users
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.to('all-users').emit(event, data);
  }
};

// Real-time notifications
const notifyNewQuery = (query) => {
  emitToAll('new-query', {
    message: 'New query received!',
    query
  });
};

const notifyQueryAssigned = (query, userId) => {
  emitToUser(userId, 'query-assigned', {
    message: 'A query has been assigned to you',
    query
  });
};

const notifyQueryUpdated = (query) => {
  emitToAll('query-updated', {
    message: 'Query updated',
    query
  });
};

const notifyQueryEscalated = (query) => {
  emitToAll('query-escalated', {
    message: 'URGENT: Query escalated!',
    query,
    priority: 'high'
  });
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToAll,
  notifyNewQuery,
  notifyQueryAssigned,
  notifyQueryUpdated,
  notifyQueryEscalated
};