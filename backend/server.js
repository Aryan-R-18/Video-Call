const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active users and their socket connections
const users = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('join', ({ username, roomId }) => {
    const user = {
      id: socket.id,
      username,
      roomId: roomId || null
    };
    
    users.set(socket.id, user);
    
    if (roomId) {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket.id);
      
      // Notify room members about new user
      socket.to(roomId).emit('user-joined', { user });
    }
    
    // Send list of connected users
    io.emit('users-list', Array.from(users.values()));
  });

  // Handle video call signaling
  socket.on('offer', ({ to, offer }) => {
    socket.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    socket.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // Handle chat messages
  socket.on('chat-message', ({ to, message }) => {
    const user = users.get(socket.id);
    const messageData = {
      from: socket.id,
      username: user.username,
      message,
      timestamp: new Date()
    };
    
    if (to === 'all') {
      io.emit('chat-message', messageData);
    } else {
      socket.to(to).emit('chat-message', messageData);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      if (user.roomId) {
        const room = rooms.get(user.roomId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            rooms.delete(user.roomId);
          } else {
            socket.to(user.roomId).emit('user-left', { userId: socket.id });
          }
        }
      }
      users.delete(socket.id);
      io.emit('users-list', Array.from(users.values()));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 