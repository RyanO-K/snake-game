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
import { createInitialState, tick, setDirection } from '../game/core';
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
  setTimeout(() => {
    const raw = window.prompt('Enter your initials (3 chars):') ?? 'AAA';
    const name = raw.slice(0, 3).toUpperCase() || 'AAA';
    dispatch({ type: 'SUBMIT_SCORE', name });
    startIdleTimeout();
  }, 500);
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
      }
      break;

    case 'RESUME_GAME':
      if (state.status === 'PAUSED') {
        state = { ...state, status: 'PLAYING' };
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
        startIdleTimeout();
      } else {
        state = setDirection(state, event.direction);
      }
      break;

    case 'SUBMIT_SCORE':
      scoreManager
        .submit({ name: event.name, score: state.score, timestamp: Date.now() })
        .then((board) => updateScoreDom(board))
        .catch(() => {
          // Silently ignore submission errors; scoreboard just won't update
        });
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

// Initial render (IDLE screen)
render(ctx, state, scoreManager.getHighScore());

// Start idle countdown
startIdleTimeout();
