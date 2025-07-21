const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const PLAYER_SIZE = 20;

function randomColor() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

function generateGuestName() {
  return 'Guest' + Math.floor(1000 + Math.random() * 9000);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// In-memory state of connected players
let players = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Initialize this player's position at origin
  players[socket.id] = {
    x: Math.random() * (WORLD_WIDTH - PLAYER_SIZE),
    y: Math.random() * (WORLD_HEIGHT - PLAYER_SIZE),
    color: randomColor(),
    nick: generateGuestName()
  };

  // Send full state and world info to the newly connected client
  socket.emit('init', {
    id: socket.id,
    players,
    world: { width: WORLD_WIDTH, height: WORLD_HEIGHT, playerSize: PLAYER_SIZE }
  });

  // Notify other clients about the new player
  socket.broadcast.emit('playerJoined', {
    id: socket.id,
    player: players[socket.id]
  });

  // Handle movement updates from the client
  socket.on('move', (data) => {
    if (players[socket.id]) {
      const clampedX = Math.max(0, Math.min(WORLD_WIDTH - PLAYER_SIZE, data.x));
      const clampedY = Math.max(0, Math.min(WORLD_HEIGHT - PLAYER_SIZE, data.y));
      players[socket.id].x = clampedX;
      players[socket.id].y = clampedY;
      // Broadcast this player's new position to everyone (including sender)
      io.emit('playerMoved', { id: socket.id, player: players[socket.id] });
    }
  });

  // Handle custom nickname from client
  socket.on('setNickname', (nickname) => {
    if (typeof nickname === 'string' && nickname.trim().length > 0) {
      players[socket.id].nick = nickname.trim().slice(0, 20); // limit length
      io.emit('nicknameChanged', { id: socket.id, nick: players[socket.id].nick });
    }
  });

  // Clean up when the client disconnects
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    socket.broadcast.emit('playerLeft', { id: socket.id });
  });
});

// Serve static files from the client directory
app.use(express.static('../client'));

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});