import type { Direction, GameState, GridConfig, Position } from '../shared/types';

// TODO: implement all functions below

/**
 * Create a fresh game state. Snake starts at center facing RIGHT, food spawned randomly.
 */
export function createInitialState(grid: GridConfig): GameState {
  throw new Error('Not implemented');
}

/**
 * Advance the game by one tick. Returns a new immutable state.
 * Applies nextDirection, moves snake, checks collision, checks food.
 */
export function tick(state: GameState): GameState {
  throw new Error('Not implemented');
}

/**
 * Buffer a direction change. Ignores 180-degree reversals and no-ops.
 */
export function setDirection(state: GameState, direction: Direction): GameState {
  throw new Error('Not implemented');
}

/**
 * Returns true if the snake head collides with a wall or its own body.
 */
export function checkCollision(state: GameState): boolean {
  throw new Error('Not implemented');
}

/**
 * Spawn food at a random unoccupied cell. Guarantees no overlap with snake body.
 */
export function spawnFood(state: GameState): GameState {
  throw new Error('Not implemented');
}

/**
 * Return the Position one step ahead of `pos` in `direction`.
 */
export function step(pos: Position, direction: Direction): Position {
  throw new Error('Not implemented');
}

/**
 * Returns true if two positions are equal.
 */
export function posEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}
