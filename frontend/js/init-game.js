/* eslint-disable no-use-before-define */
import { ws } from './setup-websocket.js';
import { showMessage, isInputValid } from './helpers.js';

export function init() {
  form.onsubmit = onSubmit;
  newGame.onclick = onClick;
}

const gameMenu = document.getElementById('game-menu');
const game = document.getElementById('game');
const newGame = document.getElementById('btn-new-game');
const form = document.getElementById('form');
const input = document.getElementById('input-room-code');

let newRoomId;

function onSubmit(e) {
  e.preventDefault();
  const { value: inputValue } = input;

  if (!isInputValid(inputValue, '^r[A-Za-z0-9]{5}$')) {
    showMessage('Invalid room ID');
    return;
  }

  ws.requestJoin(inputValue);
}

async function onClick() {
  ws.requestNewRoom();
}
