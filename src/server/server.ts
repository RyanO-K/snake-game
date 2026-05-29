import http from 'http';
import fs from 'fs';
import path from 'path';
import { SERVER_PORT, SCORES_FILE, MAX_HIGH_SCORES } from '../shared/constants';
import type { ScoreEntry, ScoreBoard } from '../shared/types';

// TODO: implement a Node.js HTTP server that:
// 1. Serves static files from /public and /dist (GET /<file>)
//    - index.html served at GET /
//    - MIME types: .html, .css, .js, .json, .ico, .png
// 2. GET  /api/scores  → returns ScoreBoard JSON
// 3. POST /api/scores  → accepts ScoreEntry JSON, appends to scores.json,
//                        keeps only top MAX_HIGH_SCORES, returns updated ScoreBoard
// 4. Listens on SERVER_PORT (3000)

const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const DIST_DIR   = path.resolve(__dirname, '../../dist/ui');

function readScoreBoard(): ScoreBoard {
  throw new Error('Not implemented');
}

function writeScoreBoard(board: ScoreBoard): void {
  throw new Error('Not implemented');
}

const server = http.createServer((req, res) => {
  // TODO: implement request routing
  res.writeHead(501);
  res.end('Not implemented');
});

server.listen(SERVER_PORT, () => {
  console.log(`Snake server running at http://localhost:${SERVER_PORT}`);
});
