/* eslint-disable no-use-before-define */
import { url } from 'inspector';
import { info } from './config.js';
import { showMessage, isInputValid, loadImage } from './helpers.js';
import { Jet, Bullet } from './canvas-painting.js';

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

const gameStarted = false;
let whiteJet;
let whiteBullet;
let blackJet;
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
        `game is running with initial state x=${gameState.x} & y=${gameState.y}`
      );

      blackJet = new Jet(gameState, loadImage('img/black.jet.webp'));
      whiteJet = new Jet(gameState, loadImage('img/black.jet.webp'));
    });
    return;
  }
  blackJet.draw(gameState);
  whiteJet.draw(gameState);
}

function renderGameMenu() {
  gameMenu.style.display = 'block';
  game.style.display = 'none';
  newGame.disabled = '';
  roomIdElement.style.display = 'none';
  requestAnimationFrame(() => showMessage('Other player disconnected'));
}
