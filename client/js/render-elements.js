/* eslint-disable no-use-before-define */
/* eslint-disable import/no-cycle */
import { sendToServer, getPlayerNumber } from './main.js';
import { isInputValid } from './helpers.js';
import { Jet } from './canvas-painting.js';

let jet1;
let jet2;

// root element
const root = document.getElementById('root');

// game elements
let scoreP1;
let scoreP2;

// game menu elements
let gameMenu;
let joinForm;
let input;
let btnNewGame;
let roomIdElement;
let btnQuestionControls;
let btnSelectJet;
let secondaryBtnsSelectJet;
let btnQuestionPopup;
let btnSelectJetPopup;
let formGameCustomization;

// game over menu elements
// let gameOverMenu;
let btnPlayAgain;
let btnReturnToMainMenu;
// let gameOverMessage;

// ------------------------------------------
// -----------Game render/unrender-----------
// ------------------------------------------

const keysStatus = {
  leftArrowPressed: false,
  rightArrowPressed: false,
  spacePressed: false,
};

function resetKeysStatus() {
  keysStatus.leftArrowPressed = false;
  keysStatus.rightArrowPressed = false;
  keysStatus.spacePressed = false;
}

function renderGameScreen(gameState) {
  requestAnimationFrame(() => {
    const { mapHeight, mapWidth } = gameState.settings;
    const { color: p1Color } = gameState.p1;
    const { color: p2Color } = gameState.p2;

    root.innerHTML = `
    <section class="game__scores">
      <div class="game__scores__p1">
        Creator<br /><span id="score-p1">0</span>
      </div>
      <div class="game__scores__p2">
        Joiner<br /><span id="score-p2">0</span>
      </div>
    </section>
    <section class="game" id="game">
      <canvas
        width="${mapWidth}px"
        height="${mapHeight}px"
        id="canvas"
        class="canvas"
      ></canvas>
    </section>
    `;

    setTimeout(() => {
      jet1 = new Jet(`img/${p1Color.slice(1)}-jet.webp`, gameState.p1);
      jet2 = new Jet(`img/${p2Color.slice(1)}-jet.webp`, gameState.p2);

      jet1.setScore(0);
      jet2.setScore(0);

      scoreP1 = document.getElementById('score-p1');
      scoreP2 = document.getElementById('score-p2');

      document.addEventListener('keydown', onkeydown);
      document.addEventListener('keyup', onKeyUp);
    });
  });
}

function renderGame(gameState) {
  jet1.clearCanvas();
  jet1.drawBullets(gameState);

  jet1.draw(gameState.p1);
  jet2.draw(gameState.p2);

  if (jet1.hasScoreChanged(gameState.p1.score)) {
    jet1.setScore(gameState.p1.score);
    scoreP1.textContent = `${gameState.p1.score}`;
  }
  if (jet2.hasScoreChanged(gameState.p2.score)) {
    jet2.setScore(gameState.p2.score);
    scoreP2.textContent = `${gameState.p2.score}`;
  }
}

function unrenderGame() {
  if (!scoreP1 || !scoreP2) return;
  requestAnimationFrame(() => {
    root.innerHTML = '';
    scoreP1 = null;
    scoreP2 = null;

    resetKeysStatus();
    document.removeEventListener('keydown', onkeydown);
    document.removeEventListener('keyup', onKeyUp);
  });
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
      playerNumber: getPlayerNumber(),
    });
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = true;
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(keysStatus),
      playerNumber: getPlayerNumber(),
    });
  }

  if (e.key === ' ') {
    // sending a copy bc no need for how much the key is pressed
    const copyKeysStatus = { ...keysStatus, spacePressed: true };
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(copyKeysStatus),
      playerNumber: getPlayerNumber(),
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
      playerNumber: getPlayerNumber(),
    });
  }

  if (e.key === 'ArrowLeft') {
    keysStatus.leftArrowPressed = false;
    sendToServer({
      eventFromClient: 'keyPressed',
      keysStatus: JSON.stringify(keysStatus),
      playerNumber: getPlayerNumber(),
    });
  }
}

// ------------------------------------------
// --------Game Menu render/unrender---------
// ------------------------------------------

function renderGameMenu(isFirstRender, popupClass) {
  let color = '#000';
  let jetType = 'balanced';
  let maxScore = '10';
  let mapWidth = '800';
  let mapHeight = '600';
  const storedGameSettings = JSON.parse(
    localStorage.getItem('gameCustomization')
  );

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
    if (isFirstRender) {
      root.innerHTML = `
      <header class="header">
      <h1 class="header__greeting">Welcome to Jet Fighters Online</h1>
      <button class="btn btn-question" id="btn-question-controls">?</button>
      <div class="btn-question__popup" id="btn-question-popup">
        <h2>How to play</h2>
        <p><b>Left arrow</b> - steer left</p>
        <p><b>Right arrow</b> - steer right</p>
        <p><b>Spacebar</b> - shoot</p>
      </div>
    </header>

    <article class="game-menu">
      <section class="game-menu__start-buttons">
        <div class="game-menu__start-buttons__create">
          <button
            class="btn btn-menu ${popupClass}"
            id="btn-new-game"
            data-already-created="You have already created a room"
            data-invalid-form="Invalid game customization"
            data-wait="Waiting for the other player..."
            data-server-invalid-form="Server declined your customization"
            data-rematch-declined="Rematch request was declined"
            data-disconnect="Other player diconnected"
            data-other-exit="Other player left the room"
          >
            Create a new game
          </button>
          <div class="game-menu__start-buttons__create__room-id" id="room-id">
            You haven't created a room yet
          </div>
        </div>
        <form
          class="game-menu__start-buttons__join"
          id="join-form"
          data-already-created="You have already created a room"
          data-invalid-id="Invalid ID"
          data-denial-not-found="Room not found"
          data-denial-full="Room is full"
          data-server-invalid-form="Server declined your jet customization"
        >
          <input type="submit" class="btn btn-menu" value="Join a game" />
          <input
            type="text"
            placeholder="Write room ID here"
            id="input-room-id"
            class="game-menu__start-buttons__create__join-id"
          />
        </form>
      </section>
      <section class="game-menu__customization">
        <h3 class="game-menu__customization__title">Customize your game</h3>
        <form
          class="game-menu__customization__form"
          id="form-game-customization"
        >
          <table>
            <tr>
              <td><label for="input-max-score">Max Score: </label></td>
              <td data-title="Allowed: 1-50" class="tooltip">
                <input
                  type="text"
                  value="${maxScore}"
                  id="input-max-score"
                  name="max-score"
                />
              </td>
            </tr>
            <tr>
              <td><label for="input-map-width">Map Width: </label></td>
              <td data-title="Allowed: 100-2000" class="tooltip">
                <input
                  type="text"
                  value="${mapWidth}"
                  id="input-map-width"
                  name="map-width"
                />
              </td>
            </tr>
            <tr>
              <td><label for="input-map-height">Map Height: </label></td>
              <td data-title="Allowed: 100-2000" class="tooltip">
                <input
                  type="text"
                  value="${mapHeight}"
                  id="input-map-height"
                  name="map-height"
                />
              </td>
            </tr>
          </table>

          <div class="game-menu__customization__jet">
            <div class="game-menu__customization__jet__type">
              <label for="select-jet-type">Jet:</label>
              <select name="jet-type" id="select-jet-type">
                <option ${
                  jetType === 'balanced' ? 'selected' : ''
                } value="balanced">Balanced</option>
                <option ${
                  jetType === 'speedy' ? 'selected' : ''
                } value="speedy">Speedy</option>
                <option ${
                  jetType === 'twitchy' ? 'selected' : ''
                } value="twitchy">Twitchy</option>
              </select>
            </div>
            <button
              class="btn btn-select-jet"
              id="btn-select-jet"
              data-jet-color="${color}"
            >
              <img src="img/${
                color === '#000' ? '000' : 'fff'
              }-jet.webp" alt="black jet" />
            </button>
            <div class="btn-select-jet__popup" id="btn-select-jet-popup">
              <button
                class="btn btn-select-jet"
                data-secondary="true"
                data-jet-color="#000"
              >
                <img src="img/000-jet.webp" alt="black jet" />
              </button>
              <button
                class="btn btn-select-jet"
                data-secondary="true"
                data-jet-color="#fff"
              >
                <img src="img/fff-jet.webp" alt="white jet" />
              </button>
            </div>
          </div>
        </form>
      </section>
    </article>
      `;
    }

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
      formGameCustomization = document.getElementById(
        'form-game-customization'
      );
      secondaryBtnsSelectJet = document.querySelectorAll(
        '[data-secondary="true"]'
      );

      joinForm.onsubmit = handleJoinFormSubmit;
      formGameCustomization.onsubmit = (e) => e.preventDefault();

      btnNewGame.onclick = handleBtnNewGameClick;
      btnQuestionControls.onclick = handeBtnQuestionControlsClick;
      btnSelectJet.onclick = handleBtnSelectJetClick;
      secondaryBtnsSelectJet.forEach(
        (btn) => (btn.onclick = handleSecondaryBtnSelectJetClick)
      );
      btnNewGame.disabled = '';
    });
  });

  function handleJoinFormSubmit(e) {
    e.preventDefault();

    // if player number already assigned
    if (getPlayerNumber()) {
      renderJoinFormPopup('already-created');
      return;
    }

    const { value: inputValue } = input;

    if (!isInputValid(inputValue, '^r[A-Za-z0-9]{5}$')) {
      renderJoinFormPopup('invalid-id');
      return;
    }

    const gameCustomization = getJetCustomization(inputValue);
    console.log('Jet Customization:');
    console.log(gameCustomization);
    sendToServer(gameCustomization);

    updateStoredGameCustomization(
      'gameCustomization',
      gameCustomization.gameSettings
    );
  }

  function handleBtnNewGameClick() {
    // if player number already assigned
    if (getPlayerNumber()) {
      renderBtnNewGamePopup('already-created');
      return;
    }

    clearInvalidInputsOutline();
    const invalidInputs = getInvalidInputs();

    if (invalidInputs.length) {
      invalidInputs.forEach((inputElement) => {
        inputElement.classList.add('red-outline');
      });

      renderBtnNewGamePopup('invalid-form');
      return;
    }

    renderBtnNewGamePopup();
    const gameCustomization = getGameCustomization();
    console.log('Game Customization:');
    console.log(gameCustomization);
    sendToServer(gameCustomization);

    updateStoredGameCustomization(
      'gameCustomization',
      gameCustomization.gameSettings
    );
  }

  // transition from display none and opacity 0
  // to display block and opacity 1 with proper animation
  function handeBtnQuestionControlsClick(e) {
    const { x, y, width, height } = e.target.getBoundingClientRect();
    const { width: widthPopup } = btnQuestionPopup.getBoundingClientRect();

    const xPopup = x - (widthPopup - width) / 2;
    const yPopup = y + height + window.pageYOffset - 20;

    btnQuestionPopup.style.top = `${yPopup}px`;
    btnQuestionPopup.style.left = `${xPopup}px`;

    requestAnimationFrame(() => {
      btnQuestionPopup.classList.toggle('fade-translate-down');
    });
  }
}

// for the popup to work you need a data-popupType html atribute with the text
// then in the css you stile the ::after based using a class name
// using js you add that class name
function renderBtnNewGamePopup(popupType) {
  if (popupType) {
    btnNewGame.className = `btn btn-menu btn-create__popup--${popupType}`;
    return;
  }
  btnNewGame.className = `btn btn-menu`;
}

function renderJoinFormPopup(popupType) {
  if (popupType) {
    joinForm.className =
      'game-menu__start-buttons__join ' +
      `game-menu__start-buttons__join--${popupType}`;
    return;
  }

  joinForm.className = 'game-menu__start-buttons__join';
}

function renderRoomId(id) {
  roomIdElement.textContent = `Room ID: ${id}`;
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
}

// ------------------------------------------
// -----Game Over Menu render/unrender-------
// ------------------------------------------

function renderGameOverMenu(winPlayer, playerNumber) {
  let color = '#000';
  let jetType = 'balanced';
  let maxScore = '10';
  let mapWidth = '800';
  let mapHeight = '600';
  let gameOverMessage;
  const storedGameSettings = JSON.parse(
    localStorage.getItem('gameCustomization')
  );

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
    root.innerHTML = `
    <div class="game-menu-container">
    <article class="game-menu game-menu--over">
      <h2 id="game-over-message">${gameOverMessage}</h2>
      <section class="game-menu__start-buttons">
        <div class="game-menu__start-buttons__create">
          <button
            class="btn btn-menu"
            id="btn-return-to-main-menu"
          >
            Return to main menu
          </button>
        </div>
        <div class="game-menu__start-buttons__join">
          <button
            class="btn btn-menu"
            id="btn-play-again"
            data-invalid-form="Invalid game customization"
            data-wait="Waiting for the other player..."
          >
            Request a rematch
          </button>
        </div>
      </section>
      <section class="game-menu__customization">
        <h3 class="game-menu__customization__title">Customize your game</h3>
        <form
          class="game-menu__customization__form"
          id="form-game-customization"
        >
          <table>
            <tr>
              <td><label for="input-max-score">Max Score: </label></td>
              <td data-title="Allowed: 1-50" class="tooltip">
                <input
                  type="text"
                  value="${maxScore}"
                  id="input-max-score"
                  name="max-score"
                />
              </td>
            </tr>
            <tr>
              <td><label for="input-map-width">Map Width: </label></td>
              <td data-title="Allowed: 100-2000" class="tooltip">
                <input
                  type="text"
                  value="${mapWidth}"
                  id="input-map-width"
                  name="map-width"
                />
              </td>
            </tr>
            <tr>
              <td><label for="input-map-height">Map Height: </label></td>
              <td data-title="Allowed: 100-2000" class="tooltip">
                <input
                  type="text"
                  value="${mapHeight}"
                  id="input-map-height"
                  name="map-height"
                />
              </td>
            </tr>
          </table>

          <div class="game-menu__customization__jet">
            <div class="game-menu__customization__jet__type">
              <label for="select-jet-type">Jet:</label>
              <select name="jet-type" id="select-jet-type">
              <option ${
                jetType === 'balanced' ? 'selected' : ''
              } value="balanced">Balanced</option>
              <option ${
                jetType === 'speedy' ? 'selected' : ''
              } value="speedy">Speedy</option>
              <option ${
                jetType === 'twitchy' ? 'selected' : ''
              } value="twitchy">Twitchy</option>
              </select>
            </div>
            <button
              class="btn btn-select-jet"
              id="btn-select-jet"
              data-jet-color="${color}"
            >
              <img src="img/${
                color === '#000' ? '000' : 'fff'
              }-jet.webp" alt="black jet" />
            </button>
            <div class="btn-select-jet__popup" id="btn-select-jet-popup">
              <button
                class="btn btn-select-jet"
                data-secondary="true"
                data-jet-color="#000"
              >
                <img src="img/000-jet.webp" alt="black jet" />
              </button>
              <button
                class="btn btn-select-jet"
                data-secondary="true"
                data-jet-color="#fff"
              >
                <img src="img/fff-jet.webp" alt="white jet" />
              </button>
            </div>
          </div>
        </form>
      </section>
    </article>
  </div>
    `;

    setTimeout(() => {
      // gameOverMenu = document.getElementById('game-over-menu');
      // gameOverMessage = document.getElementById('game-over-message');
      btnPlayAgain = document.getElementById('btn-play-again');
      btnReturnToMainMenu = document.getElementById('btn-return-to-main-menu');
      btnSelectJet = document.getElementById('btn-select-jet');
      btnSelectJetPopup = document.getElementById('btn-select-jet-popup');
      formGameCustomization = document.getElementById(
        'form-game-customization'
      );
      secondaryBtnsSelectJet = document.querySelectorAll(
        '[data-secondary="true"]'
      );

      btnSelectJet.onclick = handleBtnSelectJetClick;
      secondaryBtnsSelectJet.forEach(
        (btn) => (btn.onclick = handleSecondaryBtnSelectJetClick)
      );
      formGameCustomization.onsubmit = (e) => e.preventDefault();

      btnPlayAgain.onclick = handleBtnPlayAgainClick;
      btnReturnToMainMenu.onclick = handleBtnReturnToMainMenuClick;
    });
  });

  function handleBtnReturnToMainMenuClick() {
    sendToServer({
      eventFromClient: 'exitRoom',
    });
  }

  function handleBtnPlayAgainClick() {
    if (btnPlayAgain.classList.contains('btn-create__popup--wait')) {
      return;
    }

    clearInvalidInputsOutline();
    const invalidInputs = getInvalidInputs();

    if (invalidInputs.length) {
      invalidInputs.forEach((inputElement) => {
        inputElement.classList.add('red-outline');
      });

      renderBtnPlayAgainPopup('invalid-form');
      return;
    }

    const gameCustomization = getGameCustomization();
    gameCustomization.eventFromClient = 'requestPlayAgain';
    sendToServer(gameCustomization);

    updateStoredGameCustomization(
      'gameCustomization',
      gameCustomization.gameSettings
    );

    renderBtnPlayAgainPopup('wait');
  }
}

function renderBtnPlayAgainPopup(popupType) {
  if (popupType) {
    btnPlayAgain.className = `btn btn-menu btn-create__popup--${popupType}`;
    return;
  }
  btnPlayAgain.className = `btn btn-menu`;
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
  root.insertAdjacentHTML(
    'beforeend',
    `
    <div class="pop-up-message--rematch" id="message--rematch">
      <p>The other player asks for a rematch</p>
     <button class="btn btn-accept" id="btn-play-again-yes">Accept</button>
     <button class="btn btn-decline" id="btn-play-again-no">Decline</button>
    </div>
    `
  );

  requestAnimationFrame(() => {
    document.getElementById('message--rematch').classList.add('fade');

    setTimeout(() => {
      const btnYes = document.getElementById('btn-play-again-yes');
      const btnNo = document.getElementById('btn-play-again-no');

      btnYes.onclick = () => {
        const gameCustomization = getJetCustomization();

        gameCustomization.eventFromClient = 'responseAskPlayAgain';
        gameCustomization.acceptPlayAgain = true;

        sendToServer(gameCustomization);
        updateStoredGameCustomization(
          'gameCustomization',
          gameCustomization.gameSettings
        );

        btnNo.disabled = true;
      };

      btnNo.onclick = () => {
        sendToServer({
          eventFromClient: 'responseAskPlayAgain',
          acceptPlayAgain: false,
        });
        btnYes.disabled = true;
      };
    });
  });
}

// ------------------------------------------
// -------Preconnection loading screen-------
// ------------------------------------------

function renderWsPreonnectionLoadingScreen() {
  root.innerHTML = `
  <div class="lds-spinner">
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  </div>
  <div class="connection-message">Connecting to the server...</div>
  `;
}

function renderWsConnectionError() {
  root.innerHTML = `
  <div class="connection-message">Connection error, please try again.</div>
  `;
}

// ------------------------------------------
// --------------Shared functions------------
// ------------------------------------------

function getGameCustomization() {
  const { jetColor } = document.getElementById('btn-select-jet').dataset;

  const mapWidth = +formGameCustomization['map-width'].value;
  const mapHeight = +formGameCustomization['map-height'].value;
  const maxScore = +formGameCustomization['max-score'].value;

  const select = formGameCustomization['jet-type'];
  const jetType = select.options[select.selectedIndex].value;

  return {
    eventFromClient: 'requestNewRoom',
    gameSettings: {
      settings: { maxScore, mapWidth, mapHeight },
      jetCharacteristics: {
        color: jetColor,
        jetType,
      },
    },
  };
}

function getJetCustomization(joinId) {
  const { jetColor } = document.getElementById('btn-select-jet').dataset;

  const select = formGameCustomization['jet-type'];
  const jetType = select.options[select.selectedIndex].value;

  return {
    joinId,
    eventFromClient: 'requestJoinRoom',
    gameSettings: {
      jetCharacteristics: {
        color: jetColor,
        jetType,
      },
    },
  };
}

function getInvalidInputs() {
  const maxScore = +formGameCustomization['max-score'].value;
  const mapWidth = +formGameCustomization['map-width'].value;
  const mapHeight = +formGameCustomization['map-height'].value;

  const invalidInputs = [];

  if (Number.isNaN(maxScore) || maxScore < 1 || maxScore > 50)
    invalidInputs.push(formGameCustomization['max-score']);

  if (Number.isNaN(mapWidth) || mapWidth < 100 || mapWidth > 2000)
    invalidInputs.push(formGameCustomization['map-width']);

  if (Number.isNaN(mapHeight) || mapHeight < 100 || mapHeight > 2000)
    invalidInputs.push(formGameCustomization['map-height']);

  return invalidInputs;
}

function clearInvalidInputsOutline() {
  formGameCustomization['max-score'].classList.remove('red-outline');
  formGameCustomization['map-width'].classList.remove('red-outline');
  formGameCustomization['map-height'].classList.remove('red-outline');
}

function handleBtnSelectJetClick(e) {
  const { x, y, width } = e.currentTarget.getBoundingClientRect();
  const { height: heightPopup, width: widthPopup } =
    btnSelectJetPopup.getBoundingClientRect();

  const xPopup = x - (widthPopup - width) / 2;
  const yPopup = y - heightPopup + window.pageYOffset + 20;

  btnSelectJetPopup.style.top = `${yPopup}px`;
  btnSelectJetPopup.style.left = `${xPopup}px`;

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
  const storedSettings = localStorage.getItem(key);

  if (!storedSettings) {
    localStorage.setItem(key, JSON.stringify(obj));
    return;
  }

  const newObj = { ...JSON.parse(localStorage.getItem(key)), ...obj };

  localStorage.setItem(key, JSON.stringify(newObj));
}

export {
  renderGameOverMenu,
  unrenderGameOverMenu,
  renderAskPlayAgain,
  renderGame,
  renderGameScreen,
  unrenderGame,
  renderGameMenu,
  unrenderGameMenu,
  renderRoomId,
  renderWsPreonnectionLoadingScreen,
  renderWsConnectionError,
  renderJoinFormPopup,
  renderBtnNewGamePopup,
};
