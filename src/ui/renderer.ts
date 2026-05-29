import type { GameState } from '../shared/types';
import { COLORS } from '../shared/constants';

// TODO: implement canvas-based renderer

/**
 * Clear and redraw the full game state onto the canvas.
 * Called once per frame from the game loop.
 */
export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  throw new Error('Not implemented');
  // Steps:
  // 1. Fill background with COLORS.background
  // 2. Draw subtle grid lines (COLORS.grid)
  // 3. Draw food (COLORS.food, slightly rounded rect or circle)
  // 4. Draw snake body segments (COLORS.snakeBody / COLORS.npcBody based on status)
  // 5. Draw snake head (COLORS.snakeHead / COLORS.npcHead)
  // 6. Draw score text top-left
  // 7. If status === 'IDLE' or 'GAME_OVER' draw overlay with message and instructions
  // 8. If status === 'NPC_DEMO' draw "NPC Demo" watermark
}

/**
 * Draw the high-score sidebar or overlay.
 */
export function renderScoreBoard(ctx: CanvasRenderingContext2D, entries: import('../shared/types').ScoreEntry[]): void {
  throw new Error('Not implemented');
}
