import type { Direction, GameEvent } from '../shared/types';

// TODO: implement keyboard input handling

/**
 * Attach keyboard listeners to window. Calls `dispatch` with the appropriate
 * GameEvent whenever a relevant key is pressed.
 *
 * Key bindings:
 *   ArrowUp / W    → SET_DIRECTION UP
 *   ArrowDown / S  → SET_DIRECTION DOWN
 *   ArrowLeft / A  → SET_DIRECTION LEFT
 *   ArrowRight / D → SET_DIRECTION RIGHT
 *   Space / Enter  → START_GAME (if IDLE or GAME_OVER), PAUSE/RESUME (if PLAYING/PAUSED)
 *   R              → RESET_GAME
 *
 * Returns a cleanup function that removes the listeners.
 */
export function attachInputHandlers(dispatch: (event: GameEvent) => void): () => void {
  throw new Error('Not implemented');
}
