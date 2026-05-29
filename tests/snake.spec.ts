import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Click the Start button and wait for the game to enter PLAYING state. */
async function startGame(page: Page) {
  await page.click('[data-testid="start-btn"]');
  await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
}

/**
 * Wait for a full game tick to elapse.
 * The tick interval is 150 ms; we wait 200 ms to be safe.
 */
async function waitTick(page: Page) {
  await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// Page load & static UI
// ---------------------------------------------------------------------------

test.describe('Page load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has title "Snake"', async ({ page }) => {
    await expect(page).toHaveTitle('Snake');
  });

  test('canvas is visible', async ({ page }) => {
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('canvas has correct dimensions (480×480)', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('width', '480');
    await expect(canvas).toHaveAttribute('height', '480');
  });

  test('start button is visible before game begins', async ({ page }) => {
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();
  });

  test('score display is visible showing 0', async ({ page }) => {
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
    await expect(page.locator('[data-testid="score"]')).toHaveText('0');
  });

  test('high scores panel is visible', async ({ page }) => {
    await expect(page.locator('#score-panel')).toBeVisible();
  });

  test('game status is IDLE on load', async ({ page }) => {
    await expect(page.locator('[data-game-status="IDLE"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Starting the game
// ---------------------------------------------------------------------------

test.describe('Starting the game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('clicking Start changes status to PLAYING', async ({ page }) => {
    await page.click('[data-testid="start-btn"]');
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });

  test('start button is hidden while game is PLAYING', async ({ page }) => {
    await page.click('[data-testid="start-btn"]');
    await expect(page.locator('[data-testid="start-btn"]')).toBeHidden();
  });

  test('pressing Enter also starts the game', async ({ page }) => {
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Snake movement – arrow keys
// ---------------------------------------------------------------------------

test.describe('Snake movement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
  });

  test('ArrowRight is accepted as initial direction', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await waitTick(page);
    // Snake starts facing RIGHT; pressing RIGHT is a no-op but must not crash.
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });

  test('ArrowDown changes direction to DOWN', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await waitTick(page);
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
    await expect(page.locator('[data-snake-direction="DOWN"]')).toBeVisible();
  });

  test('ArrowUp changes direction to UP', async ({ page }) => {
    // Move down first so UP is not a 180° reversal from the initial RIGHT direction.
    await page.keyboard.press('ArrowDown');
    await waitTick(page);
    await page.keyboard.press('ArrowUp');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="UP"]')).toBeVisible();
  });

  test('ArrowLeft changes direction to LEFT', async ({ page }) => {
    // Must turn away from RIGHT first to avoid 180° reversal.
    await page.keyboard.press('ArrowDown');
    await waitTick(page);
    await page.keyboard.press('ArrowLeft');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="LEFT"]')).toBeVisible();
  });

  test('180-degree reversal is ignored', async ({ page }) => {
    // Snake starts facing RIGHT; pressing LEFT must be a no-op.
    await page.keyboard.press('ArrowLeft');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="RIGHT"]')).toBeVisible();
  });

  test('arrow keys are ignored when game is not PLAYING', async ({ page }) => {
    // Navigate to home without starting — status is IDLE.
    await page.goto('/');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-game-status="IDLE"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

test.describe('Scoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
  });

  test('score starts at 0', async ({ page }) => {
    await expect(page.locator('[data-testid="score"]')).toHaveText('0');
  });

  test('score increments when snake eats food', async ({ page }) => {
    // Steer directly at the food by injecting a cheat via exposed test helper.
    // The game must expose window.__test__ with a forceEatFood() method.
    await page.evaluate(() => (window as any).__test__.forceEatFood());
    await waitTick(page);
    const score = page.locator('[data-testid="score"]');
    await expect(score).not.toHaveText('0');
  });
});

// ---------------------------------------------------------------------------
// Game over
// ---------------------------------------------------------------------------

test.describe('Game over', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
  });

  test('status becomes GAME_OVER when snake hits a wall', async ({ page }) => {
    // Drive snake into the right wall immediately.
    await page.evaluate(() => (window as any).__test__.forceWallCollision());
    await waitTick(page);
    await expect(page.locator('[data-game-status="GAME_OVER"]')).toBeVisible();
  });

  test('status becomes GAME_OVER when snake hits itself', async ({ page }) => {
    await page.evaluate(() => (window as any).__test__.forceSelfCollision());
    await waitTick(page);
    await expect(page.locator('[data-game-status="GAME_OVER"]')).toBeVisible();
  });

  test('game-over overlay is shown with final score', async ({ page }) => {
    await page.evaluate(() => (window as any).__test__.forceWallCollision());
    await waitTick(page);
    await expect(page.locator('[data-testid="game-over-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible();
  });

  test('score prompt asks for initials (max 3 characters)', async ({ page }) => {
    await page.evaluate(() => (window as any).__test__.forceWallCollision());
    await waitTick(page);
    const input = page.locator('[data-testid="initials-input"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('maxlength', '3');
  });

  test('submitting initials saves score and shows high scores', async ({ page }) => {
    await page.evaluate(() => (window as any).__test__.forceWallCollision());
    await waitTick(page);
    await page.fill('[data-testid="initials-input"]', 'AAA');
    await page.click('[data-testid="submit-score-btn"]');
    await expect(page.locator('#score-list li')).toHaveCount(1);
  });

  test('Start button reappears after game over', async ({ page }) => {
    await page.evaluate(() => (window as any).__test__.forceWallCollision());
    await waitTick(page);
    await page.fill('[data-testid="initials-input"]', 'AAA');
    await page.click('[data-testid="submit-score-btn"]');
    await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// NPC demo
// ---------------------------------------------------------------------------

test.describe('NPC demo', () => {
  test('NPC demo starts after 10 s of inactivity on IDLE screen', async ({ page }) => {
    await page.goto('/');
    // The IDLE_TIMEOUT_MS is 10_000; use a slightly longer wait.
    await page.waitForTimeout(11_000);
    await expect(page.locator('[data-game-status="NPC_DEMO"]')).toBeVisible();
  });

  test('any arrow key press during NPC demo cancels it and returns to IDLE', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(11_000);
    await expect(page.locator('[data-game-status="NPC_DEMO"]')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-game-status="IDLE"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// High scores API
// ---------------------------------------------------------------------------

test.describe('High scores API', () => {
  test('GET /api/scores returns JSON with entries array', async ({ request }) => {
    const res = await request.get('/api/scores');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('entries');
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test('POST /api/scores persists a new entry', async ({ request }) => {
    const entry = { name: 'TST', score: 42, timestamp: Date.now() };
    const res = await request.post('/api/scores', { data: entry });
    expect(res.ok()).toBeTruthy();
    const board = await res.json();
    expect(board.entries.some((e: any) => e.name === 'TST' && e.score === 42)).toBe(true);
  });

  test('high scores list is capped at 10 entries', async ({ request }) => {
    // Submit 11 scores and verify only 10 are kept.
    for (let i = 0; i < 11; i++) {
      await request.post('/api/scores', {
        data: { name: 'X' + i, score: i * 10, timestamp: Date.now() },
      });
    }
    const res = await request.get('/api/scores');
    const board = await res.json();
    expect(board.entries.length).toBeLessThanOrEqual(10);
  });
});
