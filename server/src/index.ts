import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { initGameLoop } from './game/gameLoop';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Example ping-pong
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Start basic game loop (placeholder)
initGameLoop(io);