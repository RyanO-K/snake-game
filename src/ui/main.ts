// Browser entry point — bundled to public/bundle.js by build script
// TODO: wire together all modules

import { GRID, TICK_INTERVAL_MS, NPC_TICK_INTERVAL_MS, IDLE_TIMEOUT_MS } from '../shared/constants';
import { createInitialState, tick, setDirection } from '../game/core';
import { render } from './renderer';
import { attachInputHandlers } from './input';
import { ScoreManager } from '../score/score-manager';
import { NpcController } from '../npc/ai';

// TODO: implement the main game loop
// 1. Get canvas element, set width/height from constants
// 2. Create initial GameState
// 3. Attach input handlers that dispatch GameEvents
// 4. On each tick interval, call core.tick() and re-render
// 5. Track idle time; after IDLE_TIMEOUT_MS with status === 'IDLE' or 'GAME_OVER',
//    start NPC demo (set status = 'NPC_DEMO')
// 6. NPC demo runs at NPC_TICK_INTERVAL_MS; any user input cancels it and starts IDLE
// 7. On GAME_OVER: prompt for initials (max 3 chars), submit score via ScoreManager
// 8. Render high score board alongside canvas
