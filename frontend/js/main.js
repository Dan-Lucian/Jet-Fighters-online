/* eslint-disable no-use-before-define */
import { info } from './config.js';
import { renderMessage, isInputValid } from './helpers.js';
import { Jet, clearCanvas, drawBullets } from './canvas-painting.js';

const ws = new WebSocket(`ws://${info.hostname}${info.port}/`);
ws.onopen = onOpen;
ws.onmessage = onMessage;
ws.onerror = onError;
ws.onclose = onClose;

const game = document.getElementById('game');
const gameMenu = document.getElementById('game-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const gameOverMenuMessage = document.getElementById('game-over-menu__message');
const newGame = document.getElementById('btn-new-game');
const form = document.getElementById('form');
const input = document.getElementById('input-room-code');
const roomIdElement = document.getElementById('room-id');
const scoreP1 = document.getElementById('score-p1');
const scoreP2 = document.getElementById('score-p2');

const keysStatus = {
  leftArrowPressed: false,
  rightArrowPressed: false,
  spacePressed: false,
};

let player;
let isGameRunning = false;
let wJet;
let bJet;

form.onsubmit = onSubmit;
newGame.onclick = onClick;

function onOpen() {
  console.log('Connection established');
}

function onMessage(message) {
  const jsonMessage = JSON.parse(message.data);
  const {
    eventFromServer,
    roomId,
    joinable,
    textMessage,
    gameState: stringGameState,
    playerNumber,
  } = jsonMessage;

  let gameState;
  if (stringGameState) gameState = JSON.parse(stringGameState);

  if (eventFromServer === 'newRoomResponse') {
    console.log(`Server new room created: ${roomId}`);
    renderRoomId(roomId);
  }

  if (eventFromServer === 'joinRoomResponse') {
    if (!joinable) {
      console.log(`Join denial because: ${textMessage}`);
      return;
    }
    console.log(`Joining: ${roomId}`);
  }

  if (eventFromServer === 'otherPlayerDisconnected') {
    console.log('Other player disconnected');
    removeKeysControls();
    renderGameMenu();
    hideGameOverMenu();
    hideGame();
    requestAnimationFrame(() => renderMessage('Other player disconnected'));
    isGameRunning = false;
    player = null;
  }

  if (eventFromServer === 'gameState') {
    if (!isGameRunning) {
      // need for button disactivating
      hideGameMenu();
      hideGameOverMenu();
      renderGameScreen(gameState);
      setupKeysControls();
      player = playerNumber;
      isGameRunning = true;
      return;
    }
    renderGame(gameState, playerNumber);
  }

  // remove playerNumber on gameOver ??
  if (eventFromServer === 'gameOver') {
    renderGameOverMenu(gameState, playerNumber);
    hideGame();
    isGameRunning = false;
  }
}

function onError() {
  console.log('Connection error');
}

function onClose() {
  console.log('Connection close');
}

function onSubmit(e) {
  e.preventDefault();

  // if room id code already displayed then ignore submit
  if (roomIdElement.offsetHeight !== 0) return;

  const { value: inputValue } = input;

  if (!isInputValid(inputValue, '^r[A-Za-z0-9]{5}$')) {
    requestAnimationFrame(() => renderMessage('Invalid room ID'));
    return;
  }

  requestJoin(inputValue);
}

async function onClick() {
  requestNewRoom();
}

function requestNewRoom() {
  ws.send(JSON.stringify({ eventFromClient: 'newRoomRequest' }));
}

function requestJoin(joinId) {
  ws.send(JSON.stringify({ eventFromClient: 'joinRoomRequest', joinId }));
}

function renderRoomId(id) {
  roomIdElement.textContent = `Room Id: ${id}`;
  roomIdElement.style.display = 'block';
  requestAnimationFrame(() =>
    renderMessage('The game will start when the 2nd player will join this room')
  );
}

// --------------------------------------
// -----------Game render/hide-----------
// --------------------------------------

function renderGameScreen(gameState) {
  wJet = new Jet('img/white-jet.webp', gameState.p1);
  bJet = new Jet('img/black-jet.webp', gameState.p2);
  wJet.setScore(0);
  bJet.setScore(0);

  requestAnimationFrame(() => {
    game.style.display = 'block';
  });
}

function renderGame(gameState) {
  clearCanvas();
  drawBullets(gameState);

  wJet.draw(gameState.p1);
  bJet.draw(gameState.p2);

  if (wJet.hasScoreChanged(gameState.p1.score)) {
    wJet.setScore(gameState.p1.score);
    scoreP1.textContent = `${gameState.p1.score}`;
  }
  if (bJet.hasScoreChanged(gameState.p2.score)) {
    bJet.setScore(gameState.p2.score);
    scoreP2.textContent = `${gameState.p2.score}`;
  }
}

function hideGame() {
  game.style.display = 'none';
}

// --------------------------------------
// -----Game Over Menu render/hide-------
// --------------------------------------
function renderGameOverMenu({ winPlayer }, playerNumber) {
  if (winPlayer === 'draw') {
    gameOverMenuMessage.textContent = 'It is a draw';
  } else if (winPlayer === playerNumber) {
    gameOverMenuMessage.textContent = 'You Won';
  } else {
    gameOverMenuMessage.textContent = 'You Lost';
  }

  gameOverMenu.style.display = 'block';
}

function hideGameOverMenu() {
  gameOverMenu.style.display = 'none';
}

// --------------------------------------
// --------Game Menu render/hide---------
// --------------------------------------

function renderGameMenu() {
  gameMenu.style.display = 'block';
  newGame.disabled = '';
  roomIdElement.style.display = 'none';
}

function hideGameMenu() {
  gameMenu.style.display = 'none';
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
    ws.send(
      JSON.stringify({
        eventFromClient: 'keyPressed',
        keysStatus: JSON.stringify(keysStatus),
        playerNumber: player,
      })
    );
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = true;
    ws.send(
      JSON.stringify({
        eventFromClient: 'keyPressed',
        keysStatus: JSON.stringify(keysStatus),
        playerNumber: player,
      })
    );
  }

  if (e.key === ' ') {
    // sending a copt bc no need for how much the key is pressed
    const copyKeysStatus = { ...keysStatus, spacePressed: true };
    ws.send(
      JSON.stringify({
        eventFromClient: 'keyPressed',
        keysStatus: JSON.stringify(copyKeysStatus),
        playerNumber: player,
      })
    );
  }
}

function onKeyUp(e) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

  if (e.key === 'ArrowRight') {
    keysStatus.rightArrowPressed = false;
    ws.send(
      JSON.stringify({
        eventFromClient: 'keyPressed',
        keysStatus: JSON.stringify(keysStatus),
        playerNumber: player,
      })
    );
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = false;
    ws.send(
      JSON.stringify({
        eventFromClient: 'keyPressed',
        keysStatus: JSON.stringify(keysStatus),
        playerNumber: player,
      })
    );
  }
}
