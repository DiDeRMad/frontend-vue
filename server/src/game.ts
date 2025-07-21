import { Server as SocketIOServer } from 'socket.io';

type Vec2 = { x: number; y: number };

export class Game {
  private players: Map<string, Vec2> = new Map();
  constructor(private io: SocketIOServer) {}

  addPlayer(id: string) {
    this.players.set(id, { x: 0, y: 0 });
  }

  movePlayer(id: string, dx: number, dy: number) {
    const pos = this.players.get(id);
    if (!pos) return;
    pos.x += dx;
    pos.y += dy;
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  getState() {
    return Object.fromEntries(this.players);
  }
}