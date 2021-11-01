/* eslint-disable import/no-mutable-exports */
/* eslint-disable import/no-cycle */
/* eslint-disable no-use-before-define */
import { info } from './config.js';
import { renderMessage } from './helpers.js';
import * as Render from './render-elements.js';

// Render.renderWsPreonnectionLoadingScreen();
Render.renderGameMenu();

const ws = new WebSocket(`ws://${info.hostname}${info.port}`);
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

  // first check is gameState because performance
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
    // reason sent from server has to match the css class from front
    const { reason } = jsonFromServer;
    Render.renderJoinFormPopup(reason);
    return;
  }

  if (eventFromServer === 'invalidNewGameForm') {
    Render.renderBtnNewGamePopup('server-invalid-form');
    return;
  }

  if (eventFromServer === 'invalidJoinGameForm') {
    Render.renderJoinFormPopup('server-invalid-form');
    return;
  }

  if (eventFromServer === 'roomDestroyed') {
    // reason sent from server has to match with css class
    const { reason } = jsonFromServer;
    console.log(`Room destroyed reason: ${reason}`);

    Render.unrenderGame();
    Render.unrenderGameOverMenu();

    // not proud of this
    if (reason) {
      Render.renderGameMenu(false, `btn-create__popup--${reason}`);
    } else {
      Render.renderGameMenu();
    }

    isGameRunning = false;
    player = null;
    return;
  }

  if (eventFromServer === 'gameOver') {
    const { gameState: stringGameState, playerNumber } = jsonFromServer;
    const gameState = JSON.parse(stringGameState);

    Render.unrenderGameMenu();
    Render.unrenderGame();
    Render.renderGameOverMenu(gameState.winPlayer, playerNumber);

    isGameRunning = false;
    return;
  }

  if (eventFromServer === 'askPlayAgain') {
    console.log('Other player asked to play again');
    Render.renderAskPlayAgain();
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
