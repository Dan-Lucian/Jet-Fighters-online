function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-use-before-define */

/* eslint-disable import/no-cycle */
import { sendToServer, getPlayerNumber } from './main.js';
import { isInputValid } from './helpers.js';
import { Jet } from './canvas-painting.js';
var jet1;
var jet2; // root element

var root = document.getElementById('root'); // game elements

var scoreP1;
var scoreP2;
var countdown; // game menu elements

var gameMenu;
var joinForm;
var input;
var btnNewGame;
var roomIdElement;
var btnQuestionControls;
var btnSelectJet;
var secondaryBtnsSelectJet;
var btnQuestionPopup;
var btnSelectJetPopup;
var formGameCustomization; // game over menu elements
// let gameOverMenu;

var btnPlayAgain;
var btnReturnToMainMenu; // let gameOverMessage;
// ------------------------------------------
// -----------Game render/unrender-----------
// ------------------------------------------

var keysStatus = {
  leftArrowPressed: false,
  rightArrowPressed: false,
  spacePressed: false
};

function resetKeysStatus() {
  keysStatus.leftArrowPressed = false;
  keysStatus.rightArrowPressed = false;
  keysStatus.spacePressed = false;
}

function renderGameScreen(gameState) {
  requestAnimationFrame(() => {
    var {
      mapHeight,
      mapWidth
    } = gameState.settings;
    var {
      color: p1Color
    } = gameState.p1;
    var {
      color: p2Color
    } = gameState.p2;
    root.innerHTML = "\n    <section class=\"game__scores\">\n      <div class=\"game__scores__p1\">\n        Creator<br /><span id=\"score-p1\">0</span>\n      </div>\n      <div class=\"game__scores__p2\">\n        Joiner<br /><span id=\"score-p2\">0</span>\n      </div>\n    </section>\n    <section class=\"game\" id=\"game\">\n      <canvas\n        width=\"".concat(mapWidth, "px\"\n        height=\"").concat(mapHeight, "px\"\n        id=\"canvas\"\n        class=\"canvas\"\n      ></canvas>\n      <div \n        style=\"width: ").concat(mapWidth, "px; height: ").concat(mapHeight, "px\" \n        class=\"game__countdown\" \n        id=\"countdown\"\n      >3</div>\n    </section>\n    ");
    setTimeout(() => {
      jet1 = new Jet("img/".concat(p1Color.slice(1), "-jet.webp"), gameState.p1);
      jet2 = new Jet("img/".concat(p2Color.slice(1), "-jet.webp"), gameState.p2);
      jet1.setScore(0);
      jet2.setScore(0);
      countdown = document.getElementById('countdown');
      scoreP1 = document.getElementById('score-p1');
      scoreP2 = document.getElementById('score-p2');
      startCountdown();
    });
  });

  function startCountdown() {
    setTimeout(() => {
      countdown.textContent = '2';
      setTimeout(() => {
        countdown.textContent = '1';
        setTimeout(() => {
          countdown.textContent = '0';
          setTimeout(() => {
            countdown.remove();
            document.addEventListener('keydown', onkeydown);
            document.addEventListener('keyup', onKeyUp);
            sendToServer({
              eventFromClient: 'countdownFinished'
            });
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }
}

function renderGame(gameState) {
  jet1.clearCanvas();
  jet1.drawBullets(gameState);
  jet1.draw(gameState.p1);
  jet2.draw(gameState.p2);

  if (jet1.hasScoreChanged(gameState.p1.score)) {
    jet1.setScore(gameState.p1.score);
    scoreP1.textContent = "".concat(gameState.p1.score);
  }

  if (jet2.hasScoreChanged(gameState.p2.score)) {
    jet2.setScore(gameState.p2.score);
    scoreP2.textContent = "".concat(gameState.p2.score);
  }
}

function unrenderGame() {
  if (!scoreP1 || !scoreP2) return;
  requestAnimationFrame(() => {
    root.innerHTML = '';
    scoreP1 = null;
    scoreP2 = null;
    countdown = null;
    resetKeysStatus();
    document.removeEventListener('keydown', onkeydown);
    document.removeEventListener('keyup', onKeyUp);
  });
}

function onkeydown(e) {
  e.preventDefault();
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== ' ' || e.repeat) return;

  if (e.key === 'ArrowRight') {
    keysStatus.rightArrowPressed = true;
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(keysStatus),
      playerNumber: getPlayerNumber()
    });
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = true;
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(keysStatus),
      playerNumber: getPlayerNumber()
    });
  }

  if (e.key === ' ') {
    // sending a copy bc no need for how much the key is pressed
    var copyKeysStatus = _objectSpread(_objectSpread({}, keysStatus), {}, {
      spacePressed: true
    });

    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(copyKeysStatus),
      playerNumber: getPlayerNumber()
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
      playerNumber: getPlayerNumber()
    });
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = false;
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(keysStatus),
      playerNumber: getPlayerNumber()
    });
  }
} // ------------------------------------------
// --------Game Menu render/unrender---------
// ------------------------------------------


function renderGameMenu(isFirstRender, popupClass) {
  var color = '#000';
  var jetType = 'balanced';
  var maxScore = '10';
  var mapWidth = '800';
  var mapHeight = '600';
  var storedGameSettings = JSON.parse(localStorage.getItem('gameCustomization'));

  if (storedGameSettings) {
    if (storedGameSettings.settings) {
      maxScore = storedGameSettings.settings.maxScore || '10';
      mapWidth = storedGameSettings.settings.mapWidth || '800';
      mapHeight = storedGameSettings.settings.mapHeight || '600';
    }

    if (storedGameSettings.jetCharacteristics) {
      color = storedGameSettings.jetCharacteristics.color || '#000';
      jetType = storedGameSettings.jetCharacteristics.jetType || 'balanced';
    }
  }

  requestAnimationFrame(() => {
    root.innerHTML = "\n      <header class=\"header\">\n      <h1 class=\"header__greeting\">Welcome to Jet Fighters Online</h1>\n      <button class=\"btn btn-question\" id=\"btn-question-controls\">?</button>\n      <div class=\"btn-question__popup\" id=\"btn-question-popup\">\n        <h2>How to play</h2>\n        <p><b>Left arrow</b> - steer left</p>\n        <p><b>Right arrow</b> - steer right</p>\n        <p><b>Spacebar</b> - shoot</p>\n      </div>\n    </header>\n\n    <article class=\"game-menu\">\n      <section class=\"game-menu__start-buttons\">\n        <div class=\"game-menu__start-buttons__create\">\n          <button\n            class=\"btn btn-menu ".concat(popupClass, "\"\n            id=\"btn-new-game\"\n            data-already-created=\"You have already created a room\"\n            data-invalid-form=\"Invalid game customization\"\n            data-wait=\"Waiting for the other player...\"\n            data-server-invalid-form=\"Server declined your customization\"\n            data-rematch-declined=\"Rematch request was declined\"\n            data-disconnect=\"Other player diconnected\"\n            data-other-exit=\"Other player left the room\"\n            data-connecting=\"Connecting...\"\n            data-connected=\"Connected\"\n            data-disconnected=\"Connection error, please refresh\"\n          >\n            Create a new game\n          </button>\n          <div class=\"game-menu__start-buttons__create__room-id\" id=\"room-id\">\n            You haven't created a room yet\n          </div>\n        </div>\n        <form\n          class=\"game-menu__start-buttons__join\"\n          id=\"join-form\"\n          data-already-created=\"You have already created a room\"\n          data-invalid-id=\"Invalid ID\"\n          data-denial-not-found=\"Room not found\"\n          data-denial-full=\"Room is full\"\n          data-server-invalid-form=\"Server declined your jet customization\"\n        >\n          <input type=\"submit\" class=\"btn btn-menu\" value=\"Join a game\" />\n          <input\n            type=\"text\"\n            placeholder=\"Write room ID here\"\n            id=\"input-room-id\"\n            class=\"game-menu__start-buttons__create__join-id\"\n          />\n        </form>\n      </section>\n      <section class=\"game-menu__customization\">\n        <h3 class=\"game-menu__customization__title\">Customize your game</h3>\n        <form\n          class=\"game-menu__customization__form\"\n          id=\"form-game-customization\"\n        >\n          <table>\n            <tr>\n              <td><label for=\"input-max-score\">Max Score: </label></td>\n              <td data-title=\"Allowed: 1-50\" class=\"tooltip\">\n                <input\n                  type=\"text\"\n                  value=\"").concat(maxScore, "\"\n                  id=\"input-max-score\"\n                  name=\"max-score\"\n                />\n              </td>\n            </tr>\n            <tr>\n              <td><label for=\"input-map-width\">Map Width: </label></td>\n              <td data-title=\"Allowed: 100-2000\" class=\"tooltip\">\n                <input\n                  type=\"text\"\n                  value=\"").concat(mapWidth, "\"\n                  id=\"input-map-width\"\n                  name=\"map-width\"\n                />\n              </td>\n            </tr>\n            <tr>\n              <td><label for=\"input-map-height\">Map Height: </label></td>\n              <td data-title=\"Allowed: 100-2000\" class=\"tooltip\">\n                <input\n                  type=\"text\"\n                  value=\"").concat(mapHeight, "\"\n                  id=\"input-map-height\"\n                  name=\"map-height\"\n                />\n              </td>\n            </tr>\n          </table>\n\n          <div class=\"game-menu__customization__jet\">\n            <div class=\"game-menu__customization__jet__type\">\n              <label for=\"select-jet-type\">Jet:</label>\n              <select name=\"jet-type\" id=\"select-jet-type\">\n                <option ").concat(jetType === 'balanced' ? 'selected' : '', " value=\"balanced\">Balanced</option>\n                <option ").concat(jetType === 'speedy' ? 'selected' : '', " value=\"speedy\">Speedy</option>\n                <option ").concat(jetType === 'twitchy' ? 'selected' : '', " value=\"twitchy\">Twitchy</option>\n              </select>\n            </div>\n            <button\n              class=\"btn btn-select-jet\"\n              id=\"btn-select-jet\"\n              data-jet-color=\"").concat(color, "\"\n            >\n              <img src=\"img/").concat(color === '#000' ? '000' : 'fff', "-jet.webp\" alt=\"black jet\" />\n            </button>\n            <div class=\"btn-select-jet__popup\" id=\"btn-select-jet-popup\">\n              <button\n                class=\"btn btn-select-jet\"\n                data-secondary=\"true\"\n                data-jet-color=\"#000\"\n              >\n                <img src=\"img/000-jet.webp\" alt=\"black jet\" />\n              </button>\n              <button\n                class=\"btn btn-select-jet\"\n                data-secondary=\"true\"\n                data-jet-color=\"#fff\"\n              >\n                <img src=\"img/fff-jet.webp\" alt=\"white jet\" />\n              </button>\n            </div>\n          </div>\n        </form>\n      </section>\n    </article>\n      ");
    setTimeout(() => {
      // gameMenu = document.getElementById('game-menu');
      joinForm = document.getElementById('join-form');
      input = document.getElementById('input-room-id');
      btnNewGame = document.getElementById('btn-new-game');
      roomIdElement = document.getElementById('room-id');
      btnQuestionControls = document.getElementById('btn-question-controls');
      btnQuestionPopup = document.getElementById('btn-question-popup');
      btnSelectJet = document.getElementById('btn-select-jet');
      btnSelectJetPopup = document.getElementById('btn-select-jet-popup');
      formGameCustomization = document.getElementById('form-game-customization');
      secondaryBtnsSelectJet = document.querySelectorAll('[data-secondary="true"]');
      joinForm.onsubmit = handleJoinFormSubmit;

      formGameCustomization.onsubmit = e => e.preventDefault();

      btnNewGame.onclick = handleBtnNewGameClick;
      btnQuestionControls.onclick = handeBtnQuestionControlsClick;
      btnSelectJet.onclick = handleBtnSelectJetClick;
      secondaryBtnsSelectJet.forEach(btn => btn.onclick = handleSecondaryBtnSelectJetClick);
      btnNewGame.disabled = '';
    });
  });

  function handleJoinFormSubmit(e) {
    e.preventDefault(); // if player number already assigned

    if (getPlayerNumber()) {
      renderJoinFormPopup('already-created');
      return;
    }

    var {
      value: inputValue
    } = input;

    if (!isInputValid(inputValue, '^r[A-Za-z0-9]{5}$')) {
      renderJoinFormPopup('invalid-id');
      return;
    }

    var gameCustomization = getJetCustomization(inputValue);
    console.log('Jet Customization:');
    console.log(gameCustomization);
    sendToServer(gameCustomization);
    updateStoredGameCustomization('gameCustomization', gameCustomization.gameSettings);
  }

  function handleBtnNewGameClick() {
    // if player number already assigned
    if (getPlayerNumber()) {
      renderBtnNewGamePopup('already-created');
      return;
    }

    clearInvalidInputsOutline();
    var invalidInputs = getInvalidInputs();

    if (invalidInputs.length) {
      invalidInputs.forEach(inputElement => {
        inputElement.classList.add('red-outline');
      });
      renderBtnNewGamePopup('invalid-form');
      return;
    }

    renderBtnNewGamePopup();
    var gameCustomization = getGameCustomization();
    console.log('Game Customization:');
    console.log(gameCustomization);
    sendToServer(gameCustomization);
    updateStoredGameCustomization('gameCustomization', gameCustomization.gameSettings);
  } // transition from display none and opacity 0
  // to display block and opacity 1 with proper animation


  function handeBtnQuestionControlsClick(e) {
    var {
      x,
      y,
      width,
      height
    } = e.target.getBoundingClientRect();
    var {
      width: widthPopup
    } = btnQuestionPopup.getBoundingClientRect();
    var xPopup = x - (widthPopup - width) / 2;
    var yPopup = y + height + window.pageYOffset - 20;
    btnQuestionPopup.style.top = "".concat(yPopup, "px");
    btnQuestionPopup.style.left = "".concat(xPopup, "px");
    requestAnimationFrame(() => {
      btnQuestionPopup.classList.toggle('fade-translate-down');
    });
  }
} // for the popup to work you need a data-popupType html atribute with the text
// then in the css you stile the ::after based using a class name
// using js you add that class name


function renderBtnNewGamePopup(popupType) {
  if (popupType) {
    btnNewGame.className = "btn btn-menu btn-create__popup--".concat(popupType);
    return;
  }

  btnNewGame.className = "btn btn-menu";
}

function disableGameMenuButtons() {
  setTimeout(() => {
    setTimeout(() => {
      btnNewGame.disabled = true;
    });
  });
}

function renderJoinFormPopup(popupType) {
  if (popupType) {
    joinForm.className = 'game-menu__start-buttons__join ' + "game-menu__start-buttons__join--".concat(popupType);
    return;
  }

  joinForm.className = 'game-menu__start-buttons__join';
}

function renderRoomId(id) {
  roomIdElement.textContent = "Room ID: ".concat(id);
  renderBtnNewGamePopup('wait');
}

function unrenderGameMenu() {
  if (!gameMenu) return;
  requestAnimationFrame(() => {
    root.innerHTML = '';
    joinForm = null;
    input = null;
    btnNewGame = null;
    roomIdElement = null;
    btnQuestionControls = null;
    btnQuestionPopup = null;
    btnSelectJet = null;
    btnSelectJetPopup = null;
    formGameCustomization = null;
    secondaryBtnsSelectJet = null;
  });
} // ------------------------------------------
// -----Game Over Menu render/unrender-------
// ------------------------------------------


function renderGameOverMenu(winPlayer, playerNumber) {
  var color = '#000';
  var jetType = 'balanced';
  var maxScore = '10';
  var mapWidth = '800';
  var mapHeight = '600';
  var gameOverMessage;
  var storedGameSettings = JSON.parse(localStorage.getItem('gameCustomization'));

  if (storedGameSettings) {
    if (storedGameSettings.settings) {
      maxScore = storedGameSettings.settings.maxScore || '10';
      mapWidth = storedGameSettings.settings.mapWidth || '800';
      mapHeight = storedGameSettings.settings.mapHeight || '600';
    }

    if (storedGameSettings.jetCharacteristics) {
      color = storedGameSettings.jetCharacteristics.color || '#000';
      jetType = storedGameSettings.jetCharacteristics.jetType || 'balanced';
    }
  }

  if (winPlayer === 'draw') {
    gameOverMessage = 'Game Over - Draw';
  } else if (winPlayer === playerNumber) {
    gameOverMessage = 'Game Over - You Won';
  } else {
    gameOverMessage = 'Game Over - You Lost';
  }

  requestAnimationFrame(() => {
    root.innerHTML = "\n    <div class=\"game-menu-container\">\n    <article class=\"game-menu game-menu--over\">\n      <h2 id=\"game-over-message\">".concat(gameOverMessage, "</h2>\n      <section class=\"game-menu__start-buttons\">\n        <div class=\"game-menu__start-buttons__create\">\n          <button\n            class=\"btn btn-menu\"\n            id=\"btn-return-to-main-menu\"\n          >\n            Return to main menu\n          </button>\n        </div>\n        <div class=\"game-menu__start-buttons__join\">\n          <button\n            class=\"btn btn-menu\"\n            id=\"btn-play-again\"\n            data-invalid-form=\"Invalid game customization\"\n            data-wait=\"Waiting for the other player...\"\n          >\n            Request a rematch\n          </button>\n        </div>\n      </section>\n      <section class=\"game-menu__customization\">\n        <h3 class=\"game-menu__customization__title\">Customize your game</h3>\n        <form\n          class=\"game-menu__customization__form\"\n          id=\"form-game-customization\"\n        >\n          <table>\n            <tr>\n              <td><label for=\"input-max-score\">Max Score: </label></td>\n              <td data-title=\"Allowed: 1-50\" class=\"tooltip\">\n                <input\n                  type=\"text\"\n                  value=\"").concat(maxScore, "\"\n                  id=\"input-max-score\"\n                  name=\"max-score\"\n                />\n              </td>\n            </tr>\n            <tr>\n              <td><label for=\"input-map-width\">Map Width: </label></td>\n              <td data-title=\"Allowed: 100-2000\" class=\"tooltip\">\n                <input\n                  type=\"text\"\n                  value=\"").concat(mapWidth, "\"\n                  id=\"input-map-width\"\n                  name=\"map-width\"\n                />\n              </td>\n            </tr>\n            <tr>\n              <td><label for=\"input-map-height\">Map Height: </label></td>\n              <td data-title=\"Allowed: 100-2000\" class=\"tooltip\">\n                <input\n                  type=\"text\"\n                  value=\"").concat(mapHeight, "\"\n                  id=\"input-map-height\"\n                  name=\"map-height\"\n                />\n              </td>\n            </tr>\n          </table>\n\n          <div class=\"game-menu__customization__jet\">\n            <div class=\"game-menu__customization__jet__type\">\n              <label for=\"select-jet-type\">Jet:</label>\n              <select name=\"jet-type\" id=\"select-jet-type\">\n              <option ").concat(jetType === 'balanced' ? 'selected' : '', " value=\"balanced\">Balanced</option>\n              <option ").concat(jetType === 'speedy' ? 'selected' : '', " value=\"speedy\">Speedy</option>\n              <option ").concat(jetType === 'twitchy' ? 'selected' : '', " value=\"twitchy\">Twitchy</option>\n              </select>\n            </div>\n            <button\n              class=\"btn btn-select-jet\"\n              id=\"btn-select-jet\"\n              data-jet-color=\"").concat(color, "\"\n            >\n              <img src=\"img/").concat(color === '#000' ? '000' : 'fff', "-jet.webp\" alt=\"black jet\" />\n            </button>\n            <div class=\"btn-select-jet__popup\" id=\"btn-select-jet-popup\">\n              <button\n                class=\"btn btn-select-jet\"\n                data-secondary=\"true\"\n                data-jet-color=\"#000\"\n              >\n                <img src=\"img/000-jet.webp\" alt=\"black jet\" />\n              </button>\n              <button\n                class=\"btn btn-select-jet\"\n                data-secondary=\"true\"\n                data-jet-color=\"#fff\"\n              >\n                <img src=\"img/fff-jet.webp\" alt=\"white jet\" />\n              </button>\n            </div>\n          </div>\n        </form>\n      </section>\n    </article>\n  </div>\n    ");
    setTimeout(() => {
      // gameOverMenu = document.getElementById('game-over-menu');
      // gameOverMessage = document.getElementById('game-over-message');
      btnPlayAgain = document.getElementById('btn-play-again');
      btnReturnToMainMenu = document.getElementById('btn-return-to-main-menu');
      btnSelectJet = document.getElementById('btn-select-jet');
      btnSelectJetPopup = document.getElementById('btn-select-jet-popup');
      formGameCustomization = document.getElementById('form-game-customization');
      secondaryBtnsSelectJet = document.querySelectorAll('[data-secondary="true"]');
      btnSelectJet.onclick = handleBtnSelectJetClick;
      secondaryBtnsSelectJet.forEach(btn => btn.onclick = handleSecondaryBtnSelectJetClick);

      formGameCustomization.onsubmit = e => e.preventDefault();

      btnPlayAgain.onclick = handleBtnPlayAgainClick;
      btnReturnToMainMenu.onclick = handleBtnReturnToMainMenuClick;
    });
  });

  function handleBtnReturnToMainMenuClick() {
    sendToServer({
      eventFromClient: 'exitRoom'
    });
  }

  function handleBtnPlayAgainClick() {
    if (btnPlayAgain.classList.contains('btn-create__popup--wait')) {
      return;
    }

    clearInvalidInputsOutline();
    var invalidInputs = getInvalidInputs();

    if (invalidInputs.length) {
      invalidInputs.forEach(inputElement => {
        inputElement.classList.add('red-outline');
      });
      renderBtnPlayAgainPopup('invalid-form');
      return;
    }

    var gameCustomization = getGameCustomization();
    gameCustomization.eventFromClient = 'requestPlayAgain';
    sendToServer(gameCustomization);
    updateStoredGameCustomization('gameCustomization', gameCustomization.gameSettings);
    renderBtnPlayAgainPopup('wait');
  }
}

function renderBtnPlayAgainPopup(popupType) {
  if (popupType) {
    btnPlayAgain.className = "btn btn-menu btn-create__popup--".concat(popupType);
    return;
  }

  btnPlayAgain.className = "btn btn-menu";
}

function unrenderGameOverMenu() {
  requestAnimationFrame(() => {
    root.innerHTML = '';
    btnPlayAgain = null;
    btnReturnToMainMenu = null;
    btnSelectJet = null;
    btnSelectJetPopup = null;
    formGameCustomization = null;
    secondaryBtnsSelectJet = null;
  });
}

function renderAskPlayAgain() {
  root.insertAdjacentHTML('beforeend', "\n    <div class=\"pop-up-message--rematch\" id=\"message--rematch\">\n      <p>The other player asks for a rematch</p>\n     <button class=\"btn btn-accept\" id=\"btn-play-again-yes\">Accept</button>\n     <button class=\"btn btn-decline\" id=\"btn-play-again-no\">Decline</button>\n    </div>\n    ");
  requestAnimationFrame(() => {
    document.getElementById('message--rematch').classList.add('fade');
    setTimeout(() => {
      var btnYes = document.getElementById('btn-play-again-yes');
      var btnNo = document.getElementById('btn-play-again-no');

      btnYes.onclick = () => {
        var gameCustomization = getJetCustomization();
        gameCustomization.eventFromClient = 'responseAskPlayAgain';
        gameCustomization.acceptPlayAgain = true;
        sendToServer(gameCustomization);
        updateStoredGameCustomization('gameCustomization', gameCustomization.gameSettings);
        btnNo.disabled = true;
      };

      btnNo.onclick = () => {
        sendToServer({
          eventFromClient: 'responseAskPlayAgain',
          acceptPlayAgain: false
        });
        btnYes.disabled = true;
      };
    });
  });
} // ------------------------------------------
// -------Preconnection loading screen-------
// ------------------------------------------


function renderWsPreonnectionLoadingScreen() {
  root.innerHTML = "\n  <div class=\"lds-spinner\">\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n  <div></div>\n  </div>\n  <div class=\"connection-message\">Connecting to the server...</div>\n  ";
} // ------------------------------------------
// --------------Shared functions------------
// ------------------------------------------


function getGameCustomization() {
  var {
    jetColor
  } = document.getElementById('btn-select-jet').dataset;
  var mapWidth = +formGameCustomization['map-width'].value;
  var mapHeight = +formGameCustomization['map-height'].value;
  var maxScore = +formGameCustomization['max-score'].value;
  var select = formGameCustomization['jet-type'];
  var jetType = select.options[select.selectedIndex].value;
  return {
    eventFromClient: 'requestNewRoom',
    gameSettings: {
      settings: {
        maxScore,
        mapWidth,
        mapHeight
      },
      jetCharacteristics: {
        color: jetColor,
        jetType
      }
    }
  };
}

function getJetCustomization(joinId) {
  var {
    jetColor
  } = document.getElementById('btn-select-jet').dataset;
  var select = formGameCustomization['jet-type'];
  var jetType = select.options[select.selectedIndex].value;
  return {
    joinId,
    eventFromClient: 'requestJoinRoom',
    gameSettings: {
      jetCharacteristics: {
        color: jetColor,
        jetType
      }
    }
  };
}

function getInvalidInputs() {
  var maxScore = +formGameCustomization['max-score'].value;
  var mapWidth = +formGameCustomization['map-width'].value;
  var mapHeight = +formGameCustomization['map-height'].value;
  var invalidInputs = [];
  if (Number.isNaN(maxScore) || maxScore < 1 || maxScore > 50) invalidInputs.push(formGameCustomization['max-score']);
  if (Number.isNaN(mapWidth) || mapWidth < 100 || mapWidth > 2000) invalidInputs.push(formGameCustomization['map-width']);
  if (Number.isNaN(mapHeight) || mapHeight < 100 || mapHeight > 2000) invalidInputs.push(formGameCustomization['map-height']);
  return invalidInputs;
}

function clearInvalidInputsOutline() {
  formGameCustomization['max-score'].classList.remove('red-outline');
  formGameCustomization['map-width'].classList.remove('red-outline');
  formGameCustomization['map-height'].classList.remove('red-outline');
}

function handleBtnSelectJetClick(e) {
  var {
    x,
    y,
    width
  } = e.currentTarget.getBoundingClientRect();
  var {
    height: heightPopup,
    width: widthPopup
  } = btnSelectJetPopup.getBoundingClientRect();
  var xPopup = x - (widthPopup - width) / 2;
  var yPopup = y - heightPopup + window.pageYOffset + 20;
  btnSelectJetPopup.style.top = "".concat(yPopup, "px");
  btnSelectJetPopup.style.left = "".concat(xPopup, "px");
  requestAnimationFrame(() => {
    btnSelectJetPopup.classList.toggle('fade-translate-up');
  });
}

function handleSecondaryBtnSelectJetClick(e) {
  requestAnimationFrame(() => {
    btnSelectJetPopup.classList.toggle('fade-translate-up');
  });
  btnSelectJet.setAttribute('data-jet-color', e.currentTarget.dataset.jetColor);
  btnSelectJet.firstElementChild.src = e.currentTarget.firstElementChild.src;
  btnSelectJet.firstElementChild.alt = e.currentTarget.firstElementChild.alt;
}

function updateStoredGameCustomization(key, obj) {
  var storedSettings = localStorage.getItem(key);

  if (!storedSettings) {
    localStorage.setItem(key, JSON.stringify(obj));
    return;
  }

  var newObj = _objectSpread(_objectSpread({}, JSON.parse(localStorage.getItem(key))), obj);

  localStorage.setItem(key, JSON.stringify(newObj));
}

export { renderGameOverMenu, unrenderGameOverMenu, renderAskPlayAgain, renderGame, renderGameScreen, unrenderGame, renderGameMenu, unrenderGameMenu, renderRoomId, renderWsPreonnectionLoadingScreen, renderJoinFormPopup, renderBtnNewGamePopup, disableGameMenuButtons };