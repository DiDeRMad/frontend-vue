const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

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
  players[socket.id] = { x: 0, y: 0 };

  // Send full state to the newly connected client
  socket.emit('init', { id: socket.id, players });

  // Notify other clients about the new player
  socket.broadcast.emit('playerJoined', { id: socket.id, position: players[socket.id] });

  // Handle movement updates from the client
  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      // Broadcast this player's new position to others
      socket.broadcast.emit('playerMoved', { id: socket.id, position: players[socket.id] });
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