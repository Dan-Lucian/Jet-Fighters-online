/* eslint-disable import/no-mutable-exports */

/* eslint-disable import/no-cycle */
/* eslint-disable no-use-before-define */
import { info } from './config.js';
import { renderMessage } from './helpers.js';
import * as Render from './render-elements.js';

Render.renderWsPreonnectionLoadingScreen();

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
  Render.renderGameMenu();
}

function onWsMessage(message) {
  const jsonMessage = JSON.parse(message.data);
  const {
    eventFromServer,
    roomId,
    textMessage,
    gameState: stringGameState,
    playerNumber,
  } = jsonMessage;

  let gameState;
  if (stringGameState) gameState = JSON.parse(stringGameState);

  if (eventFromServer === 'gameState') {
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
    console.log(`Server new room created: ${roomId}`);
    Render.renderRoomId(roomId);
    return;
  }

  if (eventFromServer === 'denialJoinRoom') {
    requestAnimationFrame(() =>
      renderMessage(`Join denial because: ${textMessage}`)
    );
    return;
  }

  if (eventFromServer === 'roomDestroyed') {
    console.log('Room destroyed');
    requestAnimationFrame(() => renderMessage(textMessage));

    Render.unrenderGame();
    Render.unrenderGameOverMenu();
    Render.renderGameMenu();

    isGameRunning = false;
    player = null;
    return;
  }

  if (eventFromServer === 'gameOver') {
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
  Render.renderWsConnectionError();
}

function onWsClose() {
  console.log('Connection close');
  Render.renderWsConnectionError();
}

function getPlayerNumber() {
  return player;
}

export { sendToServer, getPlayerNumber };
