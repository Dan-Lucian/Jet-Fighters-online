// import builing functions here
import { ws } from './setup-websocket.js';
import { init } from './init-game.js';
import { setupCanvasEvents } from './setup-canvas-events.js';

ws.setupWsEvents();
init();

setupCanvasEvents();
