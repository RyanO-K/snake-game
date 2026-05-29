import type { ScoreBoard, ScoreEntry } from '../shared/types';
import { MAX_HIGH_SCORES } from '../shared/constants';

// TODO: implement ScoreManager class

/**
 * Manages score state in the browser. Persists to localStorage as backup
 * and syncs with the server API at /api/scores.
 */
export class ScoreManager {
  private board: ScoreBoard = { entries: [], highScore: 0 };

  /** Fetch current scoreboard from server. Falls back to localStorage. */
  async load(): Promise<ScoreBoard> {
    throw new Error('Not implemented');
  }

  /** Submit a new score entry to the server and update local state. */
  async submit(entry: ScoreEntry): Promise<ScoreBoard> {
    throw new Error('Not implemented');
  }

  /** Returns the current in-memory scoreboard. */
  getBoard(): ScoreBoard {
    return this.board;
  }

  /** Returns the current high score. */
  getHighScore(): number {
    return this.board.highScore;
  }

  /**
   * Merge a new entry into an existing array, sort descending by score,
   * trim to MAX_HIGH_SCORES. Pure function, no side effects.
   */
  static mergeEntry(entries: ScoreEntry[], entry: ScoreEntry): ScoreEntry[] {
    throw new Error('Not implemented');
  }
}
