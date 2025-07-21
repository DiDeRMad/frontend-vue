import { Position } from '../types/player.types';

// Distance calculation
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 2D distance (ignoring Z axis)
export function calculateDistance2D(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Check if position is within range
export function isInRange(pos1: Position, pos2: Position, range: number): boolean {
  return calculateDistance(pos1, pos2) <= range;
}

// Linear interpolation
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Math.max(0, Math.min(1, t));
}

// Vector lerp
export function lerpPosition(start: Position, end: Position, t: number): Position {
  return {
    x: lerp(start.x, end.x, t),
    y: lerp(start.y, end.y, t),
    z: lerp(start.z, end.z, t),
    zone: end.zone
  };
}

// Clamp value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Random number between min and max (inclusive)
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float between min and max
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Random element from array
export function randomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

// Weighted random selection
export function weightedRandom<T>(items: { item: T; weight: number }[]): T | undefined {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return undefined;
  
  let random = Math.random() * totalWeight;
  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1]?.item;
}

// Calculate angle between two positions
export function calculateAngle(from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.atan2(dy, dx);
}

// Convert degrees to radians
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Normalize angle to 0-360 degrees
export function normalizeAngle(degrees: number): number {
  degrees = degrees % 360;
  if (degrees < 0) degrees += 360;
  return degrees;
}

// Check if angle is within field of view
export function isInFieldOfView(
  observerAngle: number,
  targetAngle: number,
  fieldOfView: number
): boolean {
  const diff = Math.abs(normalizeAngle(targetAngle - observerAngle));
  return diff <= fieldOfView / 2 || diff >= 360 - fieldOfView / 2;
}

// Calculate percentage
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// Apply percentage modifier
export function applyPercentage(value: number, percentage: number): number {
  return value * (1 + percentage / 100);
}

// Round to decimal places
export function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// Calculate diminishing returns
export function diminishingReturns(value: number, cap: number, k: number = 0.01): number {
  return cap * (1 - Math.exp(-k * value));
}

// Calculate level difference modifier
export function levelDifferenceModifier(attackerLevel: number, defenderLevel: number): number {
  const diff = defenderLevel - attackerLevel;
  if (diff <= -10) return 1.5; // 50% bonus
  if (diff >= 10) return 0.5; // 50% penalty
  return 1 + (diff * -0.05); // 5% per level
}

// Generate UUID
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Shuffle array (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Calculate circle points
export function getCirclePoints(center: Position, radius: number, points: number): Position[] {
  const result: Position[] = [];
  const angleStep = (2 * Math.PI) / points;
  
  for (let i = 0; i < points; i++) {
    const angle = i * angleStep;
    result.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
      z: center.z,
      zone: center.zone
    });
  }
  
  return result;
}

// Check if point is inside rectangle
export function isPointInRectangle(
  point: Position,
  rectMin: Position,
  rectMax: Position
): boolean {
  return point.x >= rectMin.x && point.x <= rectMax.x &&
         point.y >= rectMin.y && point.y <= rectMax.y &&
         point.z >= rectMin.z && point.z <= rectMax.z;
}

// Check if point is inside circle
export function isPointInCircle(
  point: Position,
  center: Position,
  radius: number
): boolean {
  return calculateDistance2D(point, center) <= radius;
}

// Ray casting for line of sight
export function hasLineOfSight(
  start: Position,
  end: Position,
  obstacles: { min: Position; max: Position }[]
): boolean {
  const steps = Math.ceil(calculateDistance(start, end));
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = lerpPosition(start, end, t);
    
    for (const obstacle of obstacles) {
      if (isPointInRectangle(point, obstacle.min, obstacle.max)) {
        return false;
      }
    }
  }
  
  return true;
}