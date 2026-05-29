import type { Direction, GameState, GridConfig, Position } from '../shared/types';

/**
 * Return the Position one step ahead of `pos` in `direction`.
 */
export function step(pos: Position, direction: Direction): Position {
  const deltas: Record<Direction, { dx: number; dy: number }> = {
    UP:    { dx:  0, dy: -1 },
    DOWN:  { dx:  0, dy:  1 },
    LEFT:  { dx: -1, dy:  0 },
    RIGHT: { dx:  1, dy:  0 },
  };
  const { dx, dy } = deltas[direction];
  return { x: pos.x + dx, y: pos.y + dy };
}

/**
 * Returns true if two positions are equal.
 */
export function posEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Spawn food at a random unoccupied cell. Guarantees no overlap with snake body.
 */
export function spawnFood(state: GameState): GameState {
  const { grid, snake } = state;
  let position: Position;
  do {
    position = {
      x: Math.floor(Math.random() * grid.width),
      y: Math.floor(Math.random() * grid.height),
    };
  } while (snake.body.some(seg => posEqual(seg, position)));

  return { ...state, food: { position } };
}

/**
 * Create a fresh game state. Snake starts at center facing RIGHT, food spawned randomly.
 */
export function createInitialState(grid: GridConfig): GameState {
  const centerX = Math.floor(grid.width / 2);
  const centerY = Math.floor(grid.height / 2);

  // Snake length 3, facing RIGHT: head at center, body extends to the left
  const body: Position[] = [
    { x: centerX,     y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];

  const baseState: GameState = {
    snake: {
      body,
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
    },
    food: { position: { x: 0, y: 0 } }, // placeholder, replaced by spawnFood
    score: 0,
    status: 'IDLE',
    grid,
    tickCount: 0,
  };

  return spawnFood(baseState);
}

/**
 * Returns true if the snake head collides with a wall or its own body.
 */
export function checkCollision(state: GameState): boolean {
  const { snake, grid } = state;
  const head = snake.body[0];

  // Wall collision
  if (head.x < 0 || head.x >= grid.width || head.y < 0 || head.y >= grid.height) {
    return true;
  }

  // Self collision: head against body[1..n-1]
  for (let i = 1; i < snake.body.length; i++) {
    if (posEqual(head, snake.body[i])) {
      return true;
    }
  }

  return false;
}

/**
 * Buffer a direction change. Ignores 180-degree reversals and no-ops.
 */
export function setDirection(state: GameState, direction: Direction): GameState {
  const current = state.snake.direction;

  // Ignore same direction
  if (direction === current) {
    return state;
  }

  // Ignore 180-degree reversals
  const reversals: Record<Direction, Direction> = {
    UP:    'DOWN',
    DOWN:  'UP',
    LEFT:  'RIGHT',
    RIGHT: 'LEFT',
  };
  if (direction === reversals[current]) {
    return state;
  }

  return {
    ...state,
    snake: { ...state.snake, nextDirection: direction },
  };
}

/**
 * Advance the game by one tick. Returns a new immutable state.
 * Applies nextDirection, moves snake, checks collision, checks food.
 */
export function tick(state: GameState): GameState {
  // Only advance during PLAYING or NPC_DEMO
  if (state.status !== 'PLAYING' && state.status !== 'NPC_DEMO') {
    return state;
  }

  // Apply buffered direction
  const direction = state.snake.nextDirection;

  // Compute new head
  const currentHead = state.snake.body[0];
  const newHead = step(currentHead, direction);

  // Build the new body (without tail removal yet) for collision checking
  const grownBody: Position[] = [newHead, ...state.snake.body];

  // Check wall collision
  if (
    newHead.x < 0 || newHead.x >= state.grid.width ||
    newHead.y < 0 || newHead.y >= state.grid.height
  ) {
    return {
      ...state,
      snake: { ...state.snake, direction, body: grownBody.slice(0, -1) },
      status: 'GAME_OVER',
      tickCount: state.tickCount + 1,
    };
  }

  // Check self collision: new head against current body[0..n-2] (i.e. excluding the tail
  // that will be removed this tick, since it moves away — unless eating food)
  const bodyWithoutTail = state.snake.body.slice(0, -1);
  const selfCollision = bodyWithoutTail.some(seg => posEqual(seg, newHead));

  if (selfCollision) {
    return {
      ...state,
      snake: { ...state.snake, direction, body: grownBody.slice(0, -1) },
      status: 'GAME_OVER',
      tickCount: state.tickCount + 1,
    };
  }

  // Check food
  if (posEqual(newHead, state.food.position)) {
    // Grow: keep full grown body (don't remove tail)
    const newSnakeState: GameState = {
      ...state,
      snake: { ...state.snake, direction, body: grownBody },
      score: state.score + 10,
      tickCount: state.tickCount + 1,
    };
    return spawnFood(newSnakeState);
  }

  // Normal move: add new head, remove tail
  const newBody = grownBody.slice(0, -1);
  return {
    ...state,
    snake: { ...state.snake, direction, body: newBody },
    tickCount: state.tickCount + 1,
  };
}
