/* eslint-disable no-use-before-define */
// import { url } from 'inspector';
import { info } from './config.js';
import { showMessage, isInputValid, loadImage } from './helpers.js';
import { Jet, clearCanvas } from './canvas-painting.js';

const ws = new WebSocket(`ws://${info.hostname}${info.port}/`);
ws.onopen = onOpen;
ws.onmessage = onMessage;
ws.onerror = onError;
ws.onclose = onClose;

const gameMenu = document.getElementById('game-menu');
const game = document.getElementById('game');
const newGame = document.getElementById('btn-new-game');
const form = document.getElementById('form');
const input = document.getElementById('input-room-code');
const roomIdElement = document.getElementById('room-id');
const keysStatus = { leftArrowPressed: false, rightArrowPressed: false };

let gameStarted = false;
let wJet;
let whiteBullet;
let bJet;
let blackBullet;

form.onsubmit = onSubmit;
newGame.onclick = onClick;

function onOpen() {
  console.log('Connection established');
}

function onMessage(message) {
  const jsonMessage = JSON.parse(message.data);
  const { eventFromServer, roomId, joinable, textMessage, gameState } =
    jsonMessage;

  if (eventFromServer === 'newRoomResponse') {
    console.log(`   New room created: ${roomId}`);
    showRoomId(roomId);
  }

  if (eventFromServer === 'joinRoomResponse') {
    if (!joinable) {
      console.log(`Join denial because: ${textMessage}`);
      return;
    }
    console.log(`   Joining: ${roomId}`);
  }

  if (eventFromServer === 'otherPlayerDisconnected') {
    console.log('Other player disconnected');
    removeKeyDownEvent();
    renderGameMenu();
  }

  if (eventFromServer === 'gameState') {
    renderGame(JSON.parse(gameState));
  }

  // next: every time a gamestate is received, update the game
  // paint the game on next requestAnimationFrame
}

function onError() {
  console.log('Connection error');
}

function onClose() {
  console.log('Connection close');
}

function onSubmit(e) {
  e.preventDefault();

  if (roomIdElement.offsetHeight !== 0) return;

  const { value: inputValue } = input;

  if (!isInputValid(inputValue, '^r[A-Za-z0-9]{5}$')) {
    showMessage('Invalid room ID');
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

function showRoomId(id) {
  roomIdElement.innerHTML = `Room Id: ${id}`;
  roomIdElement.style.display = 'block';
  newGame.disabled = 'true';
  showMessage('The game will start when the 2nd player will join this room');
}

function renderGame(gameState) {
  if (!gameStarted) {
    requestAnimationFrame(() => {
      gameMenu.style.display = 'none';
      game.style.display = 'block';
      console.log(
        `game is running with initial state x=${gameState.p1.x} & y=${gameState.p1.y}`
      );

      gameStarted = true;

      wJet = new Jet('img/white-jet.webp', gameState.p1);
      bJet = new Jet('img/black-jet.webp', gameState.p2);

      setupKeyDownEvent();
    });
    return;
  }

  clearCanvas();
  wJet.draw(gameState.p1);
  bJet.draw(gameState.p2);
}

function renderGameMenu() {
  gameStarted = false;
  gameMenu.style.display = 'block';
  game.style.display = 'none';
  newGame.disabled = '';
  roomIdElement.style.display = 'none';
  requestAnimationFrame(() => showMessage('Other player disconnected'));
}

function setupKeyDownEvent() {
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

function removeKeyDownEvent() {
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('keyup', onKeyUp);
}

function onKeyDown(e) {
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
      })
    );
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = true;
    ws.send(
      JSON.stringify({
        eventFromClient: 'keyPressed',
        keysStatus: JSON.stringify(keysStatus),
      })
    );
  }

  // shooting on space
  // if (e.key === ' ') {
  //   const { x, y, angle, speed } = gameState.p1;
  //   gameState.p1.bullets.push({
  //     // x, y => precision relative to jet model
  //     x: x - 1,
  //     y: y - 1,
  //     angle,
  //     speed: speed * 2,
  //     color: '#fff',
  //   });
  // }
}

function onKeyUp(e) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

  if (e.key === 'ArrowRight') {
    keysStatus.rightArrowPressed = false;
    ws.send(
      JSON.stringify({
        eventFromClient: 'keyPressed',
        keysStatus: JSON.stringify(keysStatus),
      })
    );
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = false;
    ws.send(
      JSON.stringify({
        eventFromClient: 'keyPressed',
        keysStatus: JSON.stringify(keysStatus),
      })
    );
  }
}
