import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health check for Uptime Robot
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Tab-close / refresh: client sends beacon so next disconnect is treated as explicit leave (no grace period)
app.post('/api/leave-room', (req, res) => {
  const { socketId } = req.body || {};
  if (socketId) {
    roomManager.markExplicitLeave(socketId);
  }
  res.status(204).end();
});

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ playerName }) => {
    roomManager.createRoom(socket, playerName);
  });

  socket.on('leaveRoom', () => {
    roomManager.leaveRoom(socket);
  });

  socket.on('joinRoom', ({ roomId, playerName }) => {
    roomManager.joinRoom(socket, roomId, playerName);
  });

  socket.on('reconnectRoom', ({ roomId, previousId }) => {
    roomManager.reconnectRoom(socket, roomId, previousId);
  });

  socket.on('startGame', ({ roomId }) => {
    roomManager.startGame(roomId, socket.id);
  });

  socket.on('forceEndGame', ({ roomId }) => {
    roomManager.forceEndGame(roomId, socket.id);
  });

  socket.on('updateRoomSettings', ({ roomId, settings }) => {
    roomManager.updateRoomSettings(roomId, socket.id, settings);
  });

  socket.on('submitTemplateVote', ({ roomId, templateIndex }) => {
    roomManager.submitTemplateVote(socket.id, roomId, templateIndex);
  });

  socket.on('submitCss', ({ roomId, css }) => {
    roomManager.submitCss(socket.id, roomId, css);
  });

  socket.on('submitVote', ({ roomId, votedPlayerId, score }) => {
    roomManager.submitVote(socket.id, roomId, votedPlayerId, score);
  });

  socket.on('disconnect', () => {
    roomManager.handleDisconnect(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
