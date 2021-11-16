/* eslint-disable import/no-mutable-exports */

/* eslint-disable import/no-cycle */

/* eslint-disable no-use-before-define */
import { info } from './config.js';
import * as Render from './render-elements.js';
Render.renderGameMenu(true, 'btn-create__popup--connecting'); // return to wss

var ws = new WebSocket("wss://".concat(info.hostname).concat(info.port));
ws.onopen = onWsOpen;
ws.onmessage = onWsMessage;
ws.onerror = onWsError;
ws.onclose = onWsClose; // will be assigned inside ws connection

var player;
var isGameRunning = false;

function sendToServer(obj) {
  ws.send(JSON.stringify(obj));
}

function onWsOpen() {
  console.log('Connection established');
  Render.renderGameMenu(true, 'btn-create__popup--connected');
}

function onWsMessage(message) {
  var jsonFromServer = JSON.parse(message.data);
  var {
    eventFromServer
  } = jsonFromServer; // first check is gameState because performance

  if (eventFromServer === 'gameState') {
    var {
      gameState: stringGameState,
      playerNumber
    } = jsonFromServer;
    var gameState = JSON.parse(stringGameState);

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
    var {
      roomId
    } = jsonFromServer;
    Render.renderRoomId(roomId);
    player = 'p1';
    return;
  }

  if (eventFromServer === 'denialJoinRoom') {
    // reason sent from server has to match the css class from front
    var {
      reason
    } = jsonFromServer;
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
    var {
      reason: _reason
    } = jsonFromServer;
    Render.unrenderGame();
    Render.unrenderGameOverMenu(); // not proud of this

    if (_reason) {
      Render.renderGameMenu(false, "btn-create__popup--".concat(_reason));
    } else {
      Render.renderGameMenu();
    }

    isGameRunning = false;
    player = null;
    return;
  }

  if (eventFromServer === 'gameOver') {
    var {
      gameState: _stringGameState,
      playerNumber: _playerNumber
    } = jsonFromServer;

    var _gameState = JSON.parse(_stringGameState);

    Render.unrenderGameMenu();
    Render.unrenderGame();
    Render.renderGameOverMenu(_gameState.winPlayer, _playerNumber);
    isGameRunning = false;
    return;
  }

  if (eventFromServer === 'askPlayAgain') {
    Render.renderAskPlayAgain();
  }
}

function onWsError() {
  console.log('Connection error');
  Render.renderGameMenu(false, 'btn-create__popup--disconnected');
  Render.disableGameMenuButtons();
}

function onWsClose() {
  console.log('Connection close');
  Render.renderGameMenu(false, 'btn-create__popup--disconnected');
  Render.disableGameMenuButtons();
}

function getPlayerNumber() {
  return player;
}

export { sendToServer, getPlayerNumber };