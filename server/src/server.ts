import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

import { Game } from './game';

const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

const game = new Game(io);

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

io.on('connection', (socket) => {
  game.addPlayer(socket.id);

  socket.emit('init', { id: socket.id, state: game.getState() });
  socket.broadcast.emit('playerJoined', { id: socket.id });

  socket.on('move', (direction: { dx: number; dy: number }) => {
    game.movePlayer(socket.id, direction.dx, direction.dy);
    io.emit('state', game.getState());
  });

  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
    io.emit('playerLeft', { id: socket.id });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});