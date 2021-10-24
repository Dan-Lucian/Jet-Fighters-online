/* eslint-disable no-use-before-define */
import { info } from './config.js';
import { renderMessage, isInputValid } from './helpers.js';
import { Jet, clearCanvas, drawBullets } from './canvas-painting.js';

const ws = new WebSocket(`ws://${info.hostname}${info.port}/`);
ws.onopen = onOpen;
ws.onmessage = onMessage;
ws.onerror = onError;
ws.onclose = onClose;

// game elements
const game = document.getElementById('game');
const scoreP1 = document.getElementById('score-p1');
const scoreP2 = document.getElementById('score-p2');

// game menu elements
const gameMenu = document.getElementById('game-menu');
const form = document.getElementById('form');
const input = document.getElementById('input-room-code');
const btnNewGame = document.getElementById('btn-new-game');
const roomIdElement = document.getElementById('room-id');

// game over menu elements
const gameOverMenu = document.getElementById('game-over-menu');
const gameOverMenuMessage = document.getElementById('game-over-menu__message');
const btnReturnToMainMenu = document.getElementById('btn-return-to-main-menu');
const btnPlayAgain = document.getElementById('btn-play-again');

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
btnNewGame.onclick = handleBtnNewGameClick;
btnReturnToMainMenu.onclick = handleBtnReturnToMainMenuClick;
btnPlayAgain.onclick = handleBtnPlayAgainClick;

function sendToServer(obj) {
  ws.send(JSON.stringify(obj));
}

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
    return;
  }

  if (eventFromServer === 'responseNewRoom') {
    console.log(`Server new room created: ${roomId}`);
    renderRoomId(roomId);
    return;
  }

  if (eventFromServer === 'denialJoinRoom') {
    requestAnimationFrame(() =>
      renderMessage(`Join denial because: ${textMessage}`)
    );
  }

  if (eventFromServer === 'roomDestroyed') {
    console.log('Room destroyed');
    removeKeysControls();
    renderGameMenu();
    hideGameOverMenu();
    hideGame();
    requestAnimationFrame(() => renderMessage(textMessage));
    isGameRunning = false;
    player = null;
    return;
  }

  // remove playerNumber on gameOver ??
  if (eventFromServer === 'gameOver') {
    renderGameOverMenu(gameState, playerNumber);
    hideGame();
    isGameRunning = false;
    return;
  }

  if (eventFromServer === 'askPlayAgain') {
    console.log('Other player asked to play again');
    renderAskPlayAgain();
    return;
  }

  if (eventFromServer === 'playAgainDenied') {
    console.log('Other player denied to play again');
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

  sendToServer({ eventFromClient: 'requestJoinRoom', joinId: inputValue });
}

async function handleBtnNewGameClick() {
  sendToServer({ eventFromClient: 'requestNewRoom' });
}

function renderRoomId(id) {
  roomIdElement.textContent = `Room Id: ${id}`;
  roomIdElement.style.display = 'block';
  requestAnimationFrame(() =>
    renderMessage('The game will start when the 2nd player will join this room')
  );
}

function handleBtnReturnToMainMenuClick(e) {
  // disconnect from ws
}

function handleBtnPlayAgainClick(e) {
  sendToServer({ eventFromClient: 'requestPlayAgain' });
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

function renderAskPlayAgain() {
  gameOverMenu.insertAdjacentHTML(
    'beforeend',
    '<div class="game-over-menu__play-again-response"> <p>Other player asks to play again, do you agree?</p> <button class="btn" id="btn-play-again-yes">Yes</button> <button class="btn" id="btn-play-again-no">No</button> </div>'
  );

  setTimeout(() => {
    const btnYes = document.getElementById('btn-play-again-yes');
    const btnNo = document.getElementById('btn-play-again-no');

    btnYes.onclick = () => {
      sendToServer({
        eventFromClient: 'responseAskPlayAgain',
        acceptPlayAgain: true,
      });
      btnNo.disable = true;
    };

    btnNo.onclick = () => {
      sendToServer({
        eventFromClient: 'responseAskPlayAgain',
        acceptPlayAgain: false,
      });
      btnYes.disable = true;
    };
  });
}

// --------------------------------------
// --------Game Menu render/hide---------
// --------------------------------------

function renderGameMenu() {
  gameMenu.style.display = 'block';
  btnNewGame.disabled = '';
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
