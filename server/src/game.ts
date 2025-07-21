import { randomUUID } from 'crypto';

export type Vec2 = { x: number; y: number };

interface Player extends Vec2 {
  health: number;
  score: number;
  lastDir: Vec2; // direction of last movement for shooting
}

interface Projectile extends Vec2 {
  id: string;
  vx: number;
  vy: number;
  owner: string;
}

export class Game {
  private players: Map<string, Player> = new Map();
  private projectiles: Projectile[] = [];

  // world bounds half-size
  private readonly worldWidth = 800;
  private readonly worldHeight = 600;

  addPlayer(id: string) {
    this.players.set(id, {
      x: 0,
      y: 0,
      health: 100,
      score: 0,
      lastDir: { x: 1, y: 0 },
    });
  }

  movePlayer(id: string, dx: number, dy: number) {
    const player = this.players.get(id);
    if (!player) return;
    player.x = this.clamp(player.x + dx, -this.worldWidth / 2, this.worldWidth / 2);
    player.y = this.clamp(player.y + dy, -this.worldHeight / 2, this.worldHeight / 2);
    if (dx || dy) player.lastDir = { x: Math.sign(dx), y: Math.sign(dy) };
  }

  shoot(id: string, dir: Vec2) {
    const player = this.players.get(id);
    if (!player) return;
    const speed = 15;
    const length = Math.hypot(dir.x, dir.y) || 1;
    const vx = (dir.x / length) * speed;
    const vy = (dir.y / length) * speed;
    this.projectiles.push({
      id: randomUUID(),
      x: player.x,
      y: player.y,
      vx,
      vy,
      owner: id,
    });
  }

  removePlayer(id: string) {
    this.players.delete(id);
    // remove projectiles owned by that player
    this.projectiles = this.projectiles.filter((p) => p.owner !== id);
  }

  update(dt: number) {
    // move projectiles
    for (const p of this.projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    // out-of-bounds removal
    const inBounds = (p: Projectile) =>
      Math.abs(p.x) < this.worldWidth / 2 && Math.abs(p.y) < this.worldHeight / 2;
    this.projectiles = this.projectiles.filter(inBounds);

    // collision detection (simple radius check)
    const hitRadius = 10;
    for (const p of this.projectiles) {
      for (const [playerId, player] of this.players) {
        if (playerId === p.owner) continue;
        const distSq = (player.x - p.x) ** 2 + (player.y - p.y) ** 2;
        if (distSq < hitRadius ** 2) {
          // hit
          player.health -= 25;
          if (player.health <= 0) {
            player.health = 100;
            player.x = 0;
            player.y = 0;
            const shooter = this.players.get(p.owner);
            if (shooter) shooter.score += 1;
          }
          // mark projectile for removal
          p.x = Infinity;
          break;
        }
      }
    }
    // remove projectiles marked
    this.projectiles = this.projectiles.filter((p) => Number.isFinite(p.x));
  }

  getState() {
    return {
      players: Object.fromEntries(this.players),
      projectiles: this.projectiles.map(({ id, x, y }) => ({ id, x, y })),
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }
}