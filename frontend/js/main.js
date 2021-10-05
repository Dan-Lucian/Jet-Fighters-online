// import builing functions here
import { ws } from './setup-websocket.js';
ws.setupWsEvents();

import { init } from './init-game.js';
init();

import { setupCanvasEvents } from './setup-canvas-events.js';
setupCanvasEvents();
