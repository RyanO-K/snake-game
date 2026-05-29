import type { GameState, ScoreEntry } from '../shared/types';
import { COLORS } from '../shared/constants';

/**
 * Clear and redraw the full game state onto the canvas.
 * Called once per frame from the game loop.
 */
export function render(ctx: CanvasRenderingContext2D, state: GameState, highScore: number): void {
  const { grid, snake, food, score, status } = state;
  const { cellSize, width, height } = grid;
  const canvasW = width * cellSize;
  const canvasH = height * cellSize;

  // 1. Fill background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 2. Draw grid lines
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= width; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, canvasH);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(canvasW, y * cellSize);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Draw food as orange circle
  const foodRadius = cellSize * 0.35;
  const fx = food.position.x * cellSize + cellSize / 2;
  const fy = food.position.y * cellSize + cellSize / 2;
  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(fx, fy, foodRadius, 0, Math.PI * 2);
  ctx.fill();

  // 4 & 5. Draw snake body and head
  const isNpc = status === 'NPC_DEMO';
  const bodyColor = isNpc ? COLORS.npcBody : COLORS.snakeBody;
  const headColor = isNpc ? COLORS.npcHead : COLORS.snakeHead;

  const radius = cellSize * 0.2;

  // Draw body segments (excluding head)
  ctx.fillStyle = bodyColor;
  for (let i = 1; i < snake.body.length; i++) {
    const seg = snake.body[i];
    drawRoundedRect(ctx, seg.x * cellSize + 1, seg.y * cellSize + 1, cellSize - 2, cellSize - 2, radius);
    ctx.fill();
  }

  // Draw head (slightly brighter via a lighter fill)
  if (snake.body.length > 0) {
    const head = snake.body[0];
    ctx.fillStyle = headColor;
    drawRoundedRect(ctx, head.x * cellSize + 1, head.y * cellSize + 1, cellSize - 2, cellSize - 2, radius + 1);
    ctx.fill();
    // Add a subtle inner highlight for the head
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, head.x * cellSize + 3, head.y * cellSize + 3, cellSize - 6, cellSize - 6, radius);
    ctx.fill();
    ctx.restore();
  }

  // 6. Draw score text top-left
  ctx.fillStyle = COLORS.text;
  ctx.font = `bold ${Math.max(11, cellSize * 0.55)}px 'Courier New', monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE: ${score}  BEST: ${highScore}`, 6, 6);

  // 7 & 8. Status overlays
  if (status === 'IDLE') {
    drawDimOverlay(ctx, canvasW, canvasH);
    drawCenteredText(ctx, 'SNAKE', canvasW / 2, canvasH / 2 - 36, `bold ${cellSize * 2.5}px 'Courier New', monospace`, COLORS.snakeHead);
    drawCenteredText(ctx, 'Press SPACE to play', canvasW / 2, canvasH / 2 + 20, `${cellSize * 0.8}px 'Courier New', monospace`, COLORS.text);
  } else if (status === 'GAME_OVER') {
    drawDimOverlay(ctx, canvasW, canvasH);
    drawCenteredText(ctx, 'GAME OVER', canvasW / 2, canvasH / 2 - 44, `bold ${cellSize * 1.8}px 'Courier New', monospace`, COLORS.snakeHead);
    drawCenteredText(ctx, `Score: ${score}`, canvasW / 2, canvasH / 2 + 4, `${cellSize}px 'Courier New', monospace`, COLORS.text);
    drawCenteredText(ctx, 'Press SPACE to restart', canvasW / 2, canvasH / 2 + 32, `${cellSize * 0.75}px 'Courier New', monospace`, COLORS.text);
  } else if (status === 'PAUSED') {
    drawDimOverlay(ctx, canvasW, canvasH);
    drawCenteredText(ctx, 'PAUSED', canvasW / 2, canvasH / 2 - 24, `bold ${cellSize * 2}px 'Courier New', monospace`, COLORS.text);
    drawCenteredText(ctx, 'Press SPACE to resume', canvasW / 2, canvasH / 2 + 20, `${cellSize * 0.75}px 'Courier New', monospace`, COLORS.text);
  } else if (status === 'NPC_DEMO') {
    // Subtle tag top-right
    const tag = 'NPC DEMO';
    const tagFont = `${cellSize * 0.65}px 'Courier New', monospace`;
    ctx.font = tagFont;
    const tagW = ctx.measureText(tag).width + 12;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = COLORS.npcBody;
    ctx.fillRect(canvasW - tagW - 4, 4, tagW, cellSize * 0.85);
    ctx.restore();
    ctx.fillStyle = COLORS.text;
    ctx.font = tagFont;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.fillText(tag, canvasW - 10, 7);
    ctx.textAlign = 'left';
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDimOverlay(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, w, h);
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  // reset
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/**
 * No-op stub — scores are shown in the HTML panel, not on the canvas.
 */
export function renderScoreBoard(_ctx: CanvasRenderingContext2D, _entries: ScoreEntry[]): void {
  // scores rendered in HTML sidebar
}
