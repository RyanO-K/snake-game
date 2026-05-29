import type { Direction, GameState, Position } from '../shared/types';

/** Returns a string key for a position, used in Sets and Maps. */
function key(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

/**
 * Returns all 4 neighbours of a position that are within grid bounds
 * and not occupied by the snake body.
 */
export function safeNeighbours(pos: Position, state: GameState): Array<{ pos: Position; dir: Direction }> {
  const { grid, snake } = state;

  // Build a set of occupied cells from the snake body for O(1) lookup
  const occupied = new Set<string>(snake.body.map(key));

  const candidates: Array<{ pos: Position; dir: Direction }> = [
    { pos: { x: pos.x,     y: pos.y - 1 }, dir: 'UP'    },
    { pos: { x: pos.x,     y: pos.y + 1 }, dir: 'DOWN'  },
    { pos: { x: pos.x - 1, y: pos.y     }, dir: 'LEFT'  },
    { pos: { x: pos.x + 1, y: pos.y     }, dir: 'RIGHT' },
  ];

  return candidates.filter(({ pos: p }) =>
    p.x >= 0 && p.x < grid.width &&
    p.y >= 0 && p.y < grid.height &&
    !occupied.has(key(p))
  );
}

/**
 * Compute the next direction for the NPC using BFS pathfinding toward food.
 * Falls back to flood-fill survival if no path to food exists.
 * Falls back to the current direction if completely surrounded.
 *
 * Must never return a direction that causes immediate wall or self collision.
 */
export function computeNpcDirection(state: GameState): Direction {
  const { snake, food, grid } = state;
  const head = snake.body[0];
  const foodKey = key(food.position);

  // -----------------------------------------------------------------------
  // Phase 1 — BFS from head to food, treating snake body as walls
  // -----------------------------------------------------------------------
  const visited = new Set<string>(snake.body.map(key));
  // firstStep records which direction from head leads to each reachable cell
  const firstStep = new Map<string, Direction>();

  const queue: Position[] = [head];
  visited.add(key(head));
  let qi = 0;

  // Seed firstStep for all immediate safe neighbours of the head
  for (const { pos: nb, dir } of safeNeighbours(head, state)) {
    const k = key(nb);
    if (!visited.has(k)) {
      visited.add(k);
      firstStep.set(k, dir);
      queue.push(nb);
    }
  }

  while (qi < queue.length) {
    const current = queue[qi++];
    const currentKey = key(current);

    if (currentKey === foodKey) {
      // Path found — return the first step that leads here
      return firstStep.get(foodKey)!;
    }

    // Expand neighbours (reuse visited set; body positions already seeded)
    const neighbours: Array<{ pos: Position; dir: Direction }> = [
      { pos: { x: current.x,     y: current.y - 1 }, dir: 'UP'    },
      { pos: { x: current.x,     y: current.y + 1 }, dir: 'DOWN'  },
      { pos: { x: current.x - 1, y: current.y     }, dir: 'LEFT'  },
      { pos: { x: current.x + 1, y: current.y     }, dir: 'RIGHT' },
    ];

    for (const { pos: nb } of neighbours) {
      if (
        nb.x >= 0 && nb.x < grid.width &&
        nb.y >= 0 && nb.y < grid.height
      ) {
        const k = key(nb);
        if (!visited.has(k)) {
          visited.add(k);
          // Propagate the first-step direction from the current cell
          firstStep.set(k, firstStep.get(currentKey)!);
          queue.push(nb);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Phase 2 — Flood-fill survival: pick the neighbour with the most open space
  // -----------------------------------------------------------------------
  const safeNbs = safeNeighbours(head, state);

  if (safeNbs.length > 0) {
    let bestDir: Direction = safeNbs[0].dir;
    let bestCount = -1;

    // Build the base occupied set (all body cells + head) for flood-fill
    const bodyOccupied = new Set<string>(snake.body.map(key));

    for (const { pos: nb, dir } of safeNbs) {
      // BFS flood-fill from this neighbour, counting reachable cells
      const ffVisited = new Set<string>(bodyOccupied);
      ffVisited.add(key(nb)); // mark the neighbour itself as visited
      const ffQueue: Position[] = [nb];
      let fqi = 0;
      let count = 0;

      while (fqi < ffQueue.length) {
        const cur = ffQueue[fqi++];
        count++;

        const ffNeighbours: Position[] = [
          { x: cur.x,     y: cur.y - 1 },
          { x: cur.x,     y: cur.y + 1 },
          { x: cur.x - 1, y: cur.y     },
          { x: cur.x + 1, y: cur.y     },
        ];

        for (const p of ffNeighbours) {
          if (
            p.x >= 0 && p.x < grid.width &&
            p.y >= 0 && p.y < grid.height
          ) {
            const k = key(p);
            if (!ffVisited.has(k)) {
              ffVisited.add(k);
              ffQueue.push(p);
            }
          }
        }
      }

      if (count > bestCount) {
        bestCount = count;
        bestDir = dir;
      }
    }

    return bestDir;
  }

  // -----------------------------------------------------------------------
  // Phase 3 — Fallback: resign gracefully by continuing in the same direction
  // -----------------------------------------------------------------------
  return snake.direction;
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
