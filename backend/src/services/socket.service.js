let io;

module.exports = {
  init: (socketIo) => {
    io = socketIo;
  },
  
  emitToUser: (userId, event, data) => {
    if (io) {
      io.to(`user_${userId}`).emit(event, data);
    }
  },
  
  broadcast: (event, data) => {
    if (io) {
      io.emit(event, data);
    }
  },
  
  getIO: () => io
};
