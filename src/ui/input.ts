import type { GameEvent, GameStatus } from '../shared/types';

// We need access to the current game status to decide what Space/Enter should do.
// We do this via a getter callback so main.ts can pass a live reference.

/**
 * Attach keyboard listeners to window. Calls `dispatch` with the appropriate
 * GameEvent whenever a relevant key is pressed.
 *
 * Key bindings:
 *   ArrowUp / W    → SET_DIRECTION UP
 *   ArrowDown / S  → SET_DIRECTION DOWN
 *   ArrowLeft / A  → SET_DIRECTION LEFT
 *   ArrowRight / D → SET_DIRECTION RIGHT
 *   Space / Enter  → START_GAME (if IDLE or GAME_OVER), PAUSE_GAME (if PLAYING), RESUME_GAME (if PAUSED)
 *   R              → RESET_GAME
 *
 * @param dispatch  Event dispatcher
 * @param getStatus Callback that returns the current GameStatus (read live on each keypress)
 * Returns a cleanup function that removes the listeners.
 */
export function attachInputHandlers(
  dispatch: (event: GameEvent) => void,
  getStatus: () => GameStatus,
): () => void {
  const handler = (e: KeyboardEvent): void => {
    const status = getStatus();

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        dispatch({ type: 'SET_DIRECTION', direction: 'UP' });
        break;

      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        dispatch({ type: 'SET_DIRECTION', direction: 'DOWN' });
        break;

      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        dispatch({ type: 'SET_DIRECTION', direction: 'LEFT' });
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        dispatch({ type: 'SET_DIRECTION', direction: 'RIGHT' });
        break;

      case ' ':
      case 'Enter':
        e.preventDefault();
        if (status === 'IDLE' || status === 'GAME_OVER') {
          dispatch({ type: 'START_GAME' });
        } else if (status === 'PLAYING') {
          dispatch({ type: 'PAUSE_GAME' });
        } else if (status === 'PAUSED') {
          dispatch({ type: 'RESUME_GAME' });
        }
        break;

      case 'r':
      case 'R':
        dispatch({ type: 'RESET_GAME' });
        break;

      default:
        break;
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
