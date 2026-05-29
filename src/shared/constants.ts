export const GRID: import('./types').GridConfig = {
  width: 20,
  height: 20,
  cellSize: 24,
};

export const CANVAS_WIDTH = GRID.width * GRID.cellSize;   // 480
export const CANVAS_HEIGHT = GRID.height * GRID.cellSize; // 480

export const TICK_INTERVAL_MS = 150;        // player game speed
export const NPC_TICK_INTERVAL_MS = 100;    // NPC demo speed
export const IDLE_TIMEOUT_MS = 10_000;      // ms of inactivity before NPC starts

export const SERVER_PORT = 3000;
export const SCORES_FILE = 'scores.json';
export const MAX_HIGH_SCORES = 10;

export const COLORS = {
  background: '#1a1a2e',
  grid:        '#16213e',
  snakeHead:   '#e94560',
  snakeBody:   '#c23152',
  snakeTail:   '#3a1a2e',
  food:        '#f5a623',
  npcHead:     '#00b4d8',
  npcBody:     '#0077b6',
  npcTail:     '#0a1a2e',
  text:        '#eaeaea',
  overlay:     'rgba(0,0,0,0.6)',
};
