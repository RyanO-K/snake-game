import http from 'http';
import fs from 'fs';
import path from 'path';
import { SERVER_PORT, SCORES_FILE, MAX_HIGH_SCORES } from '../shared/constants';
import type { ScoreEntry, ScoreBoard } from '../shared/types';

const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const SCORES_PATH = path.resolve(__dirname, '../../', SCORES_FILE);

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
};

function readScoreBoard(): ScoreBoard {
  try {
    const raw = fs.readFileSync(SCORES_PATH, 'utf-8');
    return JSON.parse(raw) as ScoreBoard;
  } catch {
    return { entries: [], highScore: 0 };
  }
}

function writeScoreBoard(board: ScoreBoard): void {
  fs.writeFileSync(SCORES_PATH, JSON.stringify(board, null, 2), 'utf-8');
}

const server = http.createServer((req, res) => {
  const method = req.method ?? 'GET';
  const url    = req.url   ?? '/';

  // API: GET /api/scores
  if (method === 'GET' && url === '/api/scores') {
    const board = readScoreBoard();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(board));
    return;
  }

  // API: POST /api/scores
  if (method === 'POST' && url === '/api/scores') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const entry = JSON.parse(body) as ScoreEntry;
        const board = readScoreBoard();
        const merged = [...board.entries, entry]
          .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp)
          .slice(0, MAX_HIGH_SCORES);
        const updated: ScoreBoard = { entries: merged, highScore: merged[0]?.score ?? 0 };
        writeScoreBoard(updated);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updated));
      } catch {
        res.writeHead(400);
        res.end('Bad request');
      }
    });
    return;
  }

  // Static files
  const filePath = url === '/' ? '/index.html' : url;
  const absPath = path.join(PUBLIC_DIR, filePath);
  const ext = path.extname(absPath);

  fs.readFile(absPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(SERVER_PORT, () => {
  console.log(`Snake server running at http://localhost:${SERVER_PORT}`);
});
