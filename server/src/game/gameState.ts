export interface Player {
  id: string;
  x: number;
  y: number;
}

const players: Record<string, Player> = {};

export function addPlayer(id: string): Player {
  const player: Player = {
    id,
    x: Math.random() * 500,
    y: Math.random() * 500,
  };
  players[id] = player;
  return player;
}

export function removePlayer(id: string) {
  delete players[id];
}

export function movePlayer(id: string, dx: number, dy: number) {
  const player = players[id];
  if (!player) return;
  player.x += dx;
  player.y += dy;
}

export function getWorldState() {
  return {
    timestamp: Date.now(),
    players: Object.values(players),
  };
}

// Placeholder for future physics, collisions, etc.
export function tick() {
  // Currently no automatic world updates
}