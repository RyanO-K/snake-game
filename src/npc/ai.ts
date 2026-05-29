import type { Direction, GameState, Position } from '../shared/types';

// TODO: implement NPC controller

/**
 * Compute the next direction for the NPC using BFS pathfinding toward food.
 * Falls back to a safe random direction if no path exists.
 *
 * Must never return a direction that causes immediate wall or self collision.
 */
export function computeNpcDirection(state: GameState): Direction {
  throw new Error('Not implemented');
  // Suggested approach:
  // 1. BFS from snake head to food position, avoiding occupied cells
  // 2. If path found, return the first step direction
  // 3. If no path (surrounded), pick any safe direction (flood-fill survival)
  // 4. If no safe direction exists, return current direction (resign gracefully)
}

/**
 * Returns all 4 neighbours of a position that are within grid bounds
 * and not occupied by the snake body.
 */
export function safeNeighbours(pos: Position, state: GameState): Array<{ pos: Position; dir: Direction }> {
  throw new Error('Not implemented');
}

/**
 * High-level controller that wraps the NPC AI. Used by main.ts game loop.
 */
export class NpcController {
  /** Returns the next direction the NPC wants to move. */
  getNextDirection(state: GameState): Direction {
    return computeNpcDirection(state);
  }
}
