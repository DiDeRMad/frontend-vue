import { Server as SocketIOServer } from 'socket.io';
import { getWorldState, tick } from './gameState';

const TICK_RATE = 30; // 30 updates per second

export function initGameLoop(io: SocketIOServer) {
  setInterval(() => {
    tick();
    io.emit('state', getWorldState());
  }, 1000 / TICK_RATE);
}