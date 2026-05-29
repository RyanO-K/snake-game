import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SERVER_ENTRY = path.resolve(__dirname, '../dist/server/server.js');

/** Spawn the server on a given port and resolve once it's accepting connections. */
function startServerOnPort(port: number): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [SERVER_ENTRY], {
      env: { ...process.env, PORT: String(port) },
    });

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`Server on port ${port} did not start within 5 s`));
    }, 5_000);

    proc.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('running at')) {
        clearTimeout(timeout);
        resolve(proc);
      }
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      clearTimeout(timeout);
      proc.kill();
      reject(new Error(`Server stderr: ${chunk.toString()}`));
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const ALTERNATE_PORTS = [3001, 4000, 8080];

for (const port of ALTERNATE_PORTS) {
  test.describe(`Server on port ${port}`, () => {
    let proc: ChildProcess;

    test.beforeAll(async () => {
      proc = await startServerOnPort(port);
    });

    test.afterAll(() => {
      proc?.kill();
    });

    test(`GET / returns HTML with title "Snake" on port ${port}`, async ({ request }) => {
      const res = await request.get(`http://localhost:${port}/`);
      expect(res.ok()).toBeTruthy();
      const body = await res.text();
      expect(body).toContain('<title>Snake</title>');
    });

    test(`GET /api/scores returns valid JSON on port ${port}`, async ({ request }) => {
      const res = await request.get(`http://localhost:${port}/api/scores`);
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body).toHaveProperty('entries');
      expect(Array.isArray(body.entries)).toBe(true);
    });

    test(`static assets (style.css) are served on port ${port}`, async ({ request }) => {
      const res = await request.get(`http://localhost:${port}/style.css`);
      expect(res.ok()).toBeTruthy();
      expect(res.headers()['content-type']).toContain('text/css');
    });

    test(`static assets (bundle.js) are served on port ${port}`, async ({ request }) => {
      const res = await request.get(`http://localhost:${port}/bundle.js`);
      expect(res.ok()).toBeTruthy();
      expect(res.headers()['content-type']).toContain('javascript');
    });

    test(`404 for unknown routes on port ${port}`, async ({ request }) => {
      const res = await request.get(`http://localhost:${port}/does-not-exist`);
      expect(res.status()).toBe(404);
    });
  });
}
