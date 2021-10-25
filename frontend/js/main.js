/* eslint-disable import/no-cycle */
/* eslint-disable no-use-before-define */
import { info } from './config.js';
import { renderMessage } from './helpers.js';
import * as Render from './render-elements.js';

const ws = new WebSocket(`ws://${info.hostname}${info.port}/`);
ws.onopen = onWsOpen;
ws.onmessage = onWsMessage;
ws.onerror = onWsError;
ws.onclose = onWsClose;

const keysStatus = {
  leftArrowPressed: false,
  rightArrowPressed: false,
  spacePressed: false,
};

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

      setupKeysControls();
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

    removeKeysControls();
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
}

function onWsClose() {
  console.log('Connection close');
}

function setupKeysControls() {
  document.addEventListener('keydown', onkeydown);
  document.addEventListener('keyup', onKeyUp);
}

function removeKeysControls() {
  document.removeEventListener('keydown', onkeydown);
  document.removeEventListener('keyup', onKeyUp);
}

function onkeydown(e) {
  e.preventDefault();

  if (
    (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== ' ') ||
    e.repeat
  )
    return;

  if (e.key === 'ArrowRight') {
    keysStatus.rightArrowPressed = true;
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(keysStatus),
      playerNumber: player,
    });
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = true;
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(keysStatus),
      playerNumber: player,
    });
  }

  if (e.key === ' ') {
    // sending a copy bc no need for how much the key is pressed
    const copyKeysStatus = { ...keysStatus, spacePressed: true };
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(copyKeysStatus),
      playerNumber: player,
    });
  }
}

function onKeyUp(e) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

  if (e.key === 'ArrowRight') {
    keysStatus.rightArrowPressed = false;
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(keysStatus),
      playerNumber: player,
    });
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = false;
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(keysStatus),
      playerNumber: player,
    });
  }
}

export { sendToServer };
