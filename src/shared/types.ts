export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'NPC_DEMO';

export interface Position {
  x: number;
  y: number;
}

export interface Snake {
  body: Position[]; // body[0] is head
  direction: Direction;
  nextDirection: Direction; // buffered input, applied on next tick
}

export interface Food {
  position: Position;
}

export interface GridConfig {
  width: number;    // columns (cells)
  height: number;   // rows (cells)
  cellSize: number; // pixels per cell
}

export interface GameState {
  snake: Snake;
  food: Food;
  score: number;
  status: GameStatus;
  grid: GridConfig;
  tickCount: number;
}

export interface ScoreEntry {
  name: string;
  score: number;
  timestamp: number;
}

export interface ScoreBoard {
  entries: ScoreEntry[];
  highScore: number;
}

export type GameEvent =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'SET_DIRECTION'; direction: Direction }
  | { type: 'SUBMIT_SCORE'; name: string };
