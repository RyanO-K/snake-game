// Browser entry point — bundled to public/bundle.js by build script

import {
  GRID,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TICK_INTERVAL_MS,
  NPC_TICK_INTERVAL_MS,
  IDLE_TIMEOUT_MS,
} from '../shared/constants';
import type { GameEvent, ScoreBoard } from '../shared/types';
import { createInitialState, tick, setDirection, step } from '../game/core';
import { render } from './renderer';
import { attachInputHandlers } from './input';
import { ScoreManager } from '../score/score-manager';
import { NpcController } from '../npc/ai';

// ── Canvas setup ──────────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d')!;

// ── Score manager ─────────────────────────────────────────────────────────────
const scoreManager = new ScoreManager();

// ── Game state ────────────────────────────────────────────────────────────────
let state = createInitialState(GRID); // status starts IDLE

// ── Timers ────────────────────────────────────────────────────────────────────
let tickTimer: number | null = null;
let idleTimer: number | null = null;

// ── NPC ───────────────────────────────────────────────────────────────────────
const npcController = new NpcController();

// ── DOM helpers ───────────────────────────────────────────────────────────────
function updateScoreDom(board: ScoreBoard): void {
  const list = document.getElementById('score-list');
  if (!list) return;
  list.innerHTML = '';
  for (const entry of board.entries) {
    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = entry.name;
    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = String(entry.score);
    li.appendChild(nameSpan);
    li.appendChild(scoreSpan);
    list.appendChild(li);
  }
}

function updateDom(): void {
  const container = document.getElementById('game-container')!;
  container.setAttribute('data-game-status', state.status);
  container.setAttribute('data-snake-direction', state.snake.direction);

  const scoreEl = document.getElementById('score-display');
  if (scoreEl) scoreEl.textContent = String(state.score);

  const startBtn = document.getElementById('start-btn') as HTMLButtonElement | null;
  if (startBtn) startBtn.hidden = !(state.status === 'IDLE' || state.status === 'GAME_OVER');

  const overlay = document.getElementById('game-over-overlay') as HTMLElement | null;
  if (overlay) overlay.hidden = state.status !== 'GAME_OVER';
}

// ── Game loop ─────────────────────────────────────────────────────────────────
function startGameLoop(): void {
  if (tickTimer !== null) {
    clearInterval(tickTimer);
    tickTimer = null;
  }

  const interval = state.status === 'NPC_DEMO' ? NPC_TICK_INTERVAL_MS : TICK_INTERVAL_MS;

  tickTimer = window.setInterval(() => {
    if (state.status === 'NPC_DEMO') {
      state = setDirection(state, npcController.getNextDirection(state));
    }
    state = tick(state);
    render(ctx, state, scoreManager.getHighScore());
    updateDom();
    if (state.status === 'GAME_OVER') {
      if (tickTimer !== null) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
      onGameOver();
    }
  }, interval);
}

// ── NPC demo ──────────────────────────────────────────────────────────────────
function startNpcDemo(): void {
  state = { ...createInitialState(GRID), status: 'NPC_DEMO' };
  updateDom();
  startGameLoop();
}

// ── Idle timeout ──────────────────────────────────────────────────────────────
function startIdleTimeout(): void {
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  idleTimer = window.setTimeout(() => {
    startNpcDemo();
  }, IDLE_TIMEOUT_MS);
}

// ── Game over handler ─────────────────────────────────────────────────────────
function onGameOver(): void {
  render(ctx, state, scoreManager.getHighScore());
  updateDom();
  const finalScoreEl = document.getElementById('final-score');
  if (finalScoreEl) finalScoreEl.textContent = String(state.score);
  const initialsInput = document.getElementById('initials-input') as HTMLInputElement | null;
  if (initialsInput) initialsInput.focus();
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
function dispatch(event: GameEvent): void {
  switch (event.type) {
    case 'START_GAME':
      if (state.status === 'IDLE' || state.status === 'GAME_OVER') {
        // Clear idle timer
        if (idleTimer !== null) {
          clearTimeout(idleTimer);
          idleTimer = null;
        }
        state = { ...createInitialState(GRID), status: 'PLAYING' };
        updateDom();
        startGameLoop();
      }
      break;

    case 'PAUSE_GAME':
      if (state.status === 'PLAYING') {
        state = { ...state, status: 'PAUSED' };
        if (tickTimer !== null) {
          clearInterval(tickTimer);
          tickTimer = null;
        }
        render(ctx, state, scoreManager.getHighScore());
        updateDom();
      }
      break;

    case 'RESUME_GAME':
      if (state.status === 'PAUSED') {
        state = { ...state, status: 'PLAYING' };
        updateDom();
        startGameLoop();
      }
      break;

    case 'RESET_GAME':
      if (tickTimer !== null) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
      if (idleTimer !== null) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      state = createInitialState(GRID); // status = IDLE
      render(ctx, state, scoreManager.getHighScore());
      updateDom();
      startIdleTimeout();
      break;

    case 'SET_DIRECTION':
      if (state.status === 'NPC_DEMO') {
        // Cancel NPC demo, revert to IDLE
        if (tickTimer !== null) {
          clearInterval(tickTimer);
          tickTimer = null;
        }
        state = createInitialState(GRID); // status = IDLE
        render(ctx, state, scoreManager.getHighScore());
        updateDom();
        startIdleTimeout();
      } else {
        state = setDirection(state, event.direction);
        updateDom();
      }
      break;

    case 'SUBMIT_SCORE':
      scoreManager
        .submit({ name: event.name, score: state.score, timestamp: Date.now() })
        .then((board) => updateScoreDom(board))
        .catch(() => {
          // Silently ignore submission errors; scoreboard just won't update
        });
      state = createInitialState(GRID); // reset to IDLE
      updateDom();
      break;

    default:
      break;
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────

// Load scores asynchronously and populate sidebar
(async () => {
  try {
    const board = await scoreManager.load();
    updateScoreDom(board);
  } catch {
    // Server may not be running; ignore
  }
})();

// Attach input handlers (pass live status getter)
attachInputHandlers(dispatch, () => state.status);

// Start button click handler
document.getElementById('start-btn')?.addEventListener('click', () => {
  dispatch({ type: 'START_GAME' });
});

// Submit score button handler
document.getElementById('submit-score-btn')?.addEventListener('click', () => {
  const input = document.getElementById('initials-input') as HTMLInputElement;
  const name = (input?.value ?? 'AAA').slice(0, 3).toUpperCase() || 'AAA';
  if (input) input.value = '';
  dispatch({ type: 'SUBMIT_SCORE', name });
  startIdleTimeout();
});

// Initial render (IDLE screen)
render(ctx, state, scoreManager.getHighScore());

// Sync initial DOM state
updateDom();

// Start idle countdown
startIdleTimeout();

// ── Test helpers ──────────────────────────────────────────────────────────────
(window as any).__test__ = {
  forceEatFood() {
    // Place food directly in front of the snake head so next tick eats it
    const head = state.snake.body[0];
    const nextPos = step(head, state.snake.direction);
    state = { ...state, food: { position: nextPos } };
  },
  forceWallCollision() {
    // Place snake head at the right wall edge facing RIGHT; next tick = wall collision
    state = {
      ...state,
      snake: {
        ...state.snake,
        body: [{ x: state.grid.width - 1, y: Math.floor(state.grid.height / 2) }, ...state.snake.body.slice(1)],
        direction: 'RIGHT' as const,
        nextDirection: 'RIGHT' as const,
      },
    };
  },
  forceSelfCollision() {
    // Directly trigger game over (self-collision is hard to set up in one tick)
    if (tickTimer !== null) { clearInterval(tickTimer); tickTimer = null; }
    state = { ...state, status: 'GAME_OVER' };
    render(ctx, state, scoreManager.getHighScore());
    updateDom();
    const finalScoreEl = document.getElementById('final-score');
    if (finalScoreEl) finalScoreEl.textContent = String(state.score);
  },
};
