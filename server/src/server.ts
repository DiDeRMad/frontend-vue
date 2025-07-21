import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

import { Game, Vec2 } from './game';

const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

const game = new Game();

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

io.on('connection', (socket) => {
  game.addPlayer(socket.id);

  socket.emit('init', { id: socket.id, state: game.getState() });
  socket.broadcast.emit('playerJoined', { id: socket.id });

  socket.on('move', (direction: { dx: number; dy: number }) => {
    game.movePlayer(socket.id, direction.dx, direction.dy);
  });

  socket.on('setName', (name: string) => {
    game.setPlayerName(socket.id, name);
  });

  socket.on('chat', (message: string) => {
    const player = game.getState().players[socket.id];
    const name = player?.name || 'Anonymous';
    io.emit('chat', { id: socket.id, name, message: message.slice(0, 200) });
  });

  socket.on('shoot', (dir: Vec2 | undefined) => {
    if (dir) {
      game.shoot(socket.id, dir);
    }
  });

  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
    io.emit('playerLeft', { id: socket.id });
  });
});

// game loop ~20 ticks/sec
const TICK_RATE = 20; // Hz
setInterval(() => {
  const dt = 1; // treat dt as 1 per tick (pixels per tick already tuned)
  game.update(dt);
  io.emit('state', game.getState());
}, 1000 / TICK_RATE);

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});