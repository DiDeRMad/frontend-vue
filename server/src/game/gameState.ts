export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
}

const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 600;

const players: Record<string, Player> = {};

export function addPlayer(id: string): Player {
  const player: Player = {
    id,
    name: `Player-${id.substring(0, 4)}`,
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
  };
  players[id] = player;
  return player;
}

export function removePlayer(id: string) {
  delete players[id];
}

export function updatePlayerName(id: string, name: string) {
  const player = players[id];
  if (player) player.name = name.slice(0, 20); // limit length
}

export function movePlayer(id: string, dx: number, dy: number) {
  const player = players[id];
  if (!player) return;
  player.x = clamp(player.x + dx, 0, WORLD_WIDTH);
  player.y = clamp(player.y + dy, 0, WORLD_HEIGHT);
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function getWorldState() {
  return {
    timestamp: Date.now(),
    players: Object.values(players),
    world: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
  };
}

// Placeholder for future physics, collisions, etc.
export function tick() {
  // Currently no automatic world updates
}