import { Server as SocketIOServer } from 'socket.io';

const TICK_RATE = 30; // 30 updates per second

export function initGameLoop(io: SocketIOServer) {
  setInterval(() => {
    // TODO: update world state here
    const state = {
      timestamp: Date.now(),
      // ... world data
    };

    io.emit('state', state);
  }, 1000 / TICK_RATE);
}