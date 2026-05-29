# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: snake.spec.ts >> Page load >> score display is visible showing 0
- Location: tests\snake.spec.ts:48:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="score"]')
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for locator('[data-testid="score"]')

```

```yaml
- heading "High Scores" [level=2]
- list
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | // ---------------------------------------------------------------------------
  4   | // Helpers
  5   | // ---------------------------------------------------------------------------
  6   | 
  7   | /** Click the Start button and wait for the game to enter PLAYING state. */
  8   | async function startGame(page: Page) {
  9   |   await page.click('[data-testid="start-btn"]');
  10  |   await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  11  | }
  12  | 
  13  | /**
  14  |  * Wait for a full game tick to elapse.
  15  |  * The tick interval is 150 ms; we wait 200 ms to be safe.
  16  |  */
  17  | async function waitTick(page: Page) {
  18  |   await page.waitForTimeout(200);
  19  | }
  20  | 
  21  | // ---------------------------------------------------------------------------
  22  | // Page load & static UI
  23  | // ---------------------------------------------------------------------------
  24  | 
  25  | test.describe('Page load', () => {
  26  |   test.beforeEach(async ({ page }) => {
  27  |     await page.goto('/');
  28  |   });
  29  | 
  30  |   test('has title "Snake"', async ({ page }) => {
  31  |     await expect(page).toHaveTitle('Snake');
  32  |   });
  33  | 
  34  |   test('canvas is visible', async ({ page }) => {
  35  |     await expect(page.locator('#game-canvas')).toBeVisible();
  36  |   });
  37  | 
  38  |   test('canvas has correct dimensions (480×480)', async ({ page }) => {
  39  |     const canvas = page.locator('#game-canvas');
  40  |     await expect(canvas).toHaveAttribute('width', '480');
  41  |     await expect(canvas).toHaveAttribute('height', '480');
  42  |   });
  43  | 
  44  |   test('start button is visible before game begins', async ({ page }) => {
  45  |     await expect(page.locator('[data-testid="start-btn"]')).toBeVisible();
  46  |   });
  47  | 
  48  |   test('score display is visible showing 0', async ({ page }) => {
> 49  |     await expect(page.locator('[data-testid="score"]')).toBeVisible();
      |                                                         ^ Error: expect(locator).toBeVisible() failed
  50  |     await expect(page.locator('[data-testid="score"]')).toHaveText('0');
  51  |   });
  52  | 
  53  |   test('high scores panel is visible', async ({ page }) => {
  54  |     await expect(page.locator('#score-panel')).toBeVisible();
  55  |   });
  56  | 
  57  |   test('game status is IDLE on load', async ({ page }) => {
  58  |     await expect(page.locator('[data-game-status="IDLE"]')).toBeVisible();
  59  |   });
  60  | });
  61  | 
  62  | // ---------------------------------------------------------------------------
  63  | // Starting the game
  64  | // ---------------------------------------------------------------------------
  65  | 
  66  | test.describe('Starting the game', () => {
  67  |   test.beforeEach(async ({ page }) => {
  68  |     await page.goto('/');
  69  |   });
  70  | 
  71  |   test('clicking Start changes status to PLAYING', async ({ page }) => {
  72  |     await page.click('[data-testid="start-btn"]');
  73  |     await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  74  |   });
  75  | 
  76  |   test('start button is hidden while game is PLAYING', async ({ page }) => {
  77  |     await page.click('[data-testid="start-btn"]');
  78  |     await expect(page.locator('[data-testid="start-btn"]')).toBeHidden();
  79  |   });
  80  | 
  81  |   test('pressing Enter also starts the game', async ({ page }) => {
  82  |     await page.keyboard.press('Enter');
  83  |     await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  84  |   });
  85  | });
  86  | 
  87  | // ---------------------------------------------------------------------------
  88  | // Snake movement – arrow keys
  89  | // ---------------------------------------------------------------------------
  90  | 
  91  | test.describe('Snake movement', () => {
  92  |   test.beforeEach(async ({ page }) => {
  93  |     await page.goto('/');
  94  |     await startGame(page);
  95  |   });
  96  | 
  97  |   test('ArrowRight is accepted as initial direction', async ({ page }) => {
  98  |     await page.keyboard.press('ArrowRight');
  99  |     await waitTick(page);
  100 |     // Snake starts facing RIGHT; pressing RIGHT is a no-op but must not crash.
  101 |     await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  102 |   });
  103 | 
  104 |   test('ArrowDown changes direction to DOWN', async ({ page }) => {
  105 |     await page.keyboard.press('ArrowDown');
  106 |     await waitTick(page);
  107 |     await expect(page.locator('[data-game-status="PLAYING"]')).toBeVisible();
  108 |     await expect(page.locator('[data-snake-direction="DOWN"]')).toBeVisible();
  109 |   });
  110 | 
  111 |   test('ArrowUp changes direction to UP', async ({ page }) => {
  112 |     // Move down first so UP is not a 180° reversal from the initial RIGHT direction.
  113 |     await page.keyboard.press('ArrowDown');
  114 |     await waitTick(page);
  115 |     await page.keyboard.press('ArrowUp');
  116 |     await waitTick(page);
  117 |     await expect(page.locator('[data-snake-direction="UP"]')).toBeVisible();
  118 |   });
  119 | 
  120 |   test('ArrowLeft changes direction to LEFT', async ({ page }) => {
  121 |     // Must turn away from RIGHT first to avoid 180° reversal.
  122 |     await page.keyboard.press('ArrowDown');
  123 |     await waitTick(page);
  124 |     await page.keyboard.press('ArrowLeft');
  125 |     await waitTick(page);
  126 |     await expect(page.locator('[data-snake-direction="LEFT"]')).toBeVisible();
  127 |   });
  128 | 
  129 |   test('180-degree reversal is ignored', async ({ page }) => {
  130 |     // Snake starts facing RIGHT; pressing LEFT must be a no-op.
  131 |     await page.keyboard.press('ArrowLeft');
  132 |     await waitTick(page);
  133 |     await expect(page.locator('[data-snake-direction="RIGHT"]')).toBeVisible();
  134 |   });
  135 | 
  136 |   test('arrow keys are ignored when game is not PLAYING', async ({ page }) => {
  137 |     // Navigate to home without starting — status is IDLE.
  138 |     await page.goto('/');
  139 |     await page.keyboard.press('ArrowDown');
  140 |     await expect(page.locator('[data-game-status="IDLE"]')).toBeVisible();
  141 |   });
  142 | });
  143 | 
  144 | // ---------------------------------------------------------------------------
  145 | // Scoring
  146 | // ---------------------------------------------------------------------------
  147 | 
  148 | test.describe('Scoring', () => {
  149 |   test.beforeEach(async ({ page }) => {
```