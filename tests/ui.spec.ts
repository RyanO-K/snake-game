import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function startGame(page: Page) {
  await page.click('[data-testid="start-btn"]');
  await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
}

async function waitTick(page: Page) {
  await page.waitForTimeout(200); // tick interval is 150 ms
}

// ---------------------------------------------------------------------------
// 180-degree reversal — vertical axis (the known bug)
// ---------------------------------------------------------------------------

test.describe('180-degree reversal protection — vertical', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
  });

  test('pressing DOWN while moving UP is ignored', async ({ page }) => {
    // Turn UP first (valid from initial RIGHT direction)
    await page.keyboard.press('ArrowUp');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="UP"]')).toBeVisible();

    // Pressing DOWN now is a 180° reversal — must be ignored
    await page.keyboard.press('ArrowDown');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="UP"]')).toBeVisible();
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });

  test('pressing UP while moving DOWN is ignored', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="DOWN"]')).toBeVisible();

    await page.keyboard.press('ArrowUp');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="DOWN"]')).toBeVisible();
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 180-degree reversal — horizontal axis (regression guard)
// ---------------------------------------------------------------------------

test.describe('180-degree reversal protection — horizontal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
  });

  test('pressing LEFT while moving RIGHT is ignored', async ({ page }) => {
    await page.keyboard.press('ArrowLeft');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="RIGHT"]')).toBeVisible();
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });

  test('pressing RIGHT while moving LEFT is ignored', async ({ page }) => {
    // Turn down then left to get the snake moving LEFT
    await page.keyboard.press('ArrowDown');
    await waitTick(page);
    await page.keyboard.press('ArrowLeft');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="LEFT"]')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="LEFT"]')).toBeVisible();
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Rapid double-press — buffered input must also block reversals
//
// Scenario: snake moving RIGHT, player presses UP then immediately DOWN
// before the next tick fires. Because setDirection checks against the
// committed direction (RIGHT), DOWN is not flagged as a reversal of RIGHT.
// But DOWN IS a reversal of the already-buffered UP. The fix is to compare
// the incoming direction against nextDirection, not just direction.
// ---------------------------------------------------------------------------

test.describe('Rapid double-press reversal protection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
  });

  test('UP then DOWN before a tick — DOWN is rejected, snake turns UP', async ({ page }) => {
    // Press both without waiting for a tick between them
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await waitTick(page);
    // The buffered UP should have been applied; DOWN discarded
    await expect(page.locator('[data-snake-direction="UP"]')).toBeVisible();
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });

  test('DOWN then UP before a tick — UP is rejected, snake turns DOWN', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="DOWN"]')).toBeVisible();
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });

  test('LEFT then RIGHT before a tick — RIGHT is rejected, snake turns LEFT', async ({ page }) => {
    // First get the snake moving DOWN so LEFT is a valid turn
    await page.keyboard.press('ArrowDown');
    await waitTick(page);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="LEFT"]')).toBeVisible();
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });

  test('RIGHT then LEFT before a tick — LEFT is rejected', async ({ page }) => {
    // Get snake moving UP so RIGHT is a valid turn
    await page.keyboard.press('ArrowUp');
    await waitTick(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="RIGHT"]')).toBeVisible();
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Valid rapid direction changes (should NOT be blocked)
// ---------------------------------------------------------------------------

test.describe('Valid rapid direction changes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
  });

  test('RIGHT → UP → LEFT across two ticks is a valid U-turn sequence', async ({ page }) => {
    // Snake starts moving RIGHT
    await page.keyboard.press('ArrowUp');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="UP"]')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await waitTick(page);
    await expect(page.locator('[data-snake-direction="LEFT"]')).toBeVisible();
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });

  test('pressing the same direction repeatedly does not crash', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await waitTick(page);
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Pause / resume
// ---------------------------------------------------------------------------

test.describe('Pause and resume', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startGame(page);
  });

  test('Space pauses the game', async ({ page }) => {
    await page.keyboard.press('Space');
    await expect(page.locator('[data-game-status="PAUSED"]')).toBeVisible();
  });

  test('Space resumes from PAUSED', async ({ page }) => {
    await page.keyboard.press('Space');
    await expect(page.locator('[data-game-status="PAUSED"]')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  });

  test('arrow keys during PAUSED do not change direction', async ({ page }) => {
    await page.keyboard.press('Space');
    await expect(page.locator('[data-game-status="PAUSED"]')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space'); // resume
    await waitTick(page);
    // Snake should still be going RIGHT (the initial direction)
    await expect(page.locator('[data-snake-direction="RIGHT"]')).toBeVisible();
  });

  test('score does not change while paused', async ({ page }) => {
    const scoreBefore = await page.locator('[data-testid="score"]').innerText();
    await page.keyboard.press('Space');
    await page.waitForTimeout(500); // wait several tick intervals
    const scoreAfter = await page.locator('[data-testid="score"]').innerText();
    expect(scoreAfter).toBe(scoreBefore);
  });
});

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

test.describe('Canvas rendering', () => {
  test('canvas is 480×480 pixels', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toHaveAttribute('width', '480');
    await expect(canvas).toHaveAttribute('height', '480');
  });

  test('canvas is not blank after game starts', async ({ page }) => {
    await page.goto('/');
    await startGame(page);
    await waitTick(page);

    // Reads pixel data from the canvas — a fully blank (all-zero) canvas means nothing rendered
    const isBlank = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return data.every(v => v === 0);
    });
    expect(isBlank).toBe(false);
  });
});
