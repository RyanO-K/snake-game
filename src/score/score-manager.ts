import type { ScoreBoard, ScoreEntry } from '../shared/types';
import { MAX_HIGH_SCORES } from '../shared/constants';

const LS_KEY = 'snake-scores';

/**
 * Manages score state in the browser. Persists to localStorage as backup
 * and syncs with the server API at /api/scores.
 */
export class ScoreManager {
  private board: ScoreBoard = { entries: [], highScore: 0 };

  /** Fetch current scoreboard from server. Falls back to localStorage. */
  async load(): Promise<ScoreBoard> {
    try {
      const res = await fetch('http://localhost:3000/api/scores');
      const data = await res.json() as ScoreBoard;
      this.board = data;
      localStorage.setItem(LS_KEY, JSON.stringify(this.board));
    } catch {
      try {
        const raw = localStorage.getItem(LS_KEY) ?? 'null';
        const parsed = JSON.parse(raw) as ScoreBoard | null;
        if (parsed !== null) {
          this.board = parsed;
        } else {
          this.board = { entries: [], highScore: 0 };
        }
      } catch {
        this.board = { entries: [], highScore: 0 };
      }
    }
    return this.board;
  }

  /** Submit a new score entry to the server and update local state. */
  async submit(entry: ScoreEntry): Promise<ScoreBoard> {
    try {
      const res = await fetch('http://localhost:3000/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const data = await res.json() as ScoreBoard;
      this.board = data;
      localStorage.setItem(LS_KEY, JSON.stringify(this.board));
    } catch {
      const merged = ScoreManager.mergeEntry(this.board.entries, entry);
      this.updateBoard(merged);
    }
    return this.board;
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
    return [...entries, entry]
      .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp)
      .slice(0, MAX_HIGH_SCORES);
  }

  /**
   * Sets this.board from a sorted entries array, saves to localStorage,
   * and returns the updated board.
   */
  private updateBoard(entries: ScoreEntry[]): ScoreBoard {
    this.board = {
      entries,
      highScore: entries[0]?.score ?? 0,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(this.board));
    return this.board;
  }
}
