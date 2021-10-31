/* eslint-disable import/no-mutable-exports */
/* eslint-disable import/no-cycle */
/* eslint-disable no-use-before-define */
import { info } from './config.js';
import { renderMessage } from './helpers.js';
import * as Render from './render-elements.js';

const demoGameState = {
  p1: {
    x: 20,
    y: 20,
    angle: 0,
    scale: 2,
    leftArrowPressed: false,
    rightArrowPressed: false,
    spacePressed: false,
    bullets: [],
    score: 0,
    playerNumber: 'p1',
    color: '#fff',
    rotation: 6,
    speed: 1,
  },
  p2: {
    x: 50,
    y: 50,
    angle: 0,
    scale: 2,
    leftArrowPressed: false,
    rightArrowPressed: false,
    spacePressed: false,
    bullets: [],
    score: 0,
    playerNumber: 'p2',
    color: '#000',
    rotation: 6,
    speed: 1,
  },
  settings: {
    roomId: 'r12332',
    winPlayer: null,
    maxScore: 10,
    mapWidth: 500,
    mapHeight: 200,
  },
};

// Render.renderWsPreonnectionLoadingScreen();
Render.renderGameMenu(true);

const ws = new WebSocket(`ws://${info.hostname}${info.port}/`);
ws.onopen = onWsOpen;
ws.onmessage = onWsMessage;
ws.onerror = onWsError;
ws.onclose = onWsClose;

// will be assigned inside ws connection
let player;
let isGameRunning = false;

function sendToServer(obj) {
  ws.send(JSON.stringify(obj));
}

function onWsOpen() {
  console.log('Connection established');
}

function onWsMessage(message) {
  const jsonFromServer = JSON.parse(message.data);
  const { eventFromServer } = jsonFromServer;

  if (eventFromServer === 'gameState') {
    const { gameState: stringGameState, playerNumber } = jsonFromServer;
    const gameState = JSON.parse(stringGameState);

    if (!isGameRunning) {
      Render.unrenderGameMenu();
      Render.unrenderGameOverMenu();
      Render.renderGameScreen(gameState);

      player = playerNumber;
      isGameRunning = true;
      return;
    }

    Render.renderGame(gameState, playerNumber);
    return;
  }

  if (eventFromServer === 'responseNewRoom') {
    const { roomId } = jsonFromServer;
    console.log(`Server new room created: ${roomId}`);
    Render.renderRoomId(roomId);
    player = 'p1';
    return;
  }

  if (eventFromServer === 'denialJoinRoom') {
    const { textMessage } = jsonFromServer;
    Render.renderJoinFormPopup(textMessage);
    return;
  }

  if (eventFromServer === 'invalidNewGameForm') {
    Render.renderBtnNewGamePopup('server-invalid-form');
    return;
  }

  if (eventFromServer === 'roomDestroyed') {
    console.log('Room destroyed');
    const { textMessage } = jsonFromServer;
    requestAnimationFrame(() => renderMessage(textMessage));

    Render.unrenderGame();
    Render.unrenderGameOverMenu();
    Render.renderGameMenu();

    isGameRunning = false;
    player = null;
    return;
  }

  if (eventFromServer === 'gameOver') {
    const { gameState: stringGameState, playerNumber } = jsonFromServer;
    const gameState = JSON.parse(stringGameState);

    Render.unrenderGame();
    Render.renderGameOverMenu(gameState, playerNumber);

    isGameRunning = false;
    return;
  }

  if (eventFromServer === 'askPlayAgain') {
    console.log('Other player asked to play again');
    Render.renderAskPlayAgain();
    return;
  }

  if (eventFromServer === 'playAgainDenied') {
    console.log('Other player denied to play again');
  }
}

function onWsError() {
  console.log('Connection error');
  requestAnimationFrame(() => renderMessage(`Connection Error`));
}

function onWsClose() {
  console.log('Connection close');
  requestAnimationFrame(() => renderMessage(`Connection Error`));
}

function getPlayerNumber() {
  return player;
}

export { sendToServer, getPlayerNumber };
