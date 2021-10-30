/* eslint-disable no-use-before-define */
/* eslint-disable import/no-cycle */
import { sendToServer, getPlayerNumber } from './main.js';
import { isInputValid } from './helpers.js';
import { Jet } from './canvas-painting.js';

let wJet;
let bJet;

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
let gameOverMenu;
let btnPlayAgain;
let btnReturnToMainMenu;
let gameOverMenuMessage;

// ------------------------------------------
// -----------Game render/unrender-----------
// ------------------------------------------

const keysStatus = {
  leftArrowPressed: false,
  rightArrowPressed: false,
  spacePressed: false,
};

const jetTypes = {
  white: {
    rotation: 5,
    speed: 0,
    color: '#fff',
  },
  black: {
    rotation: 5,
    speed: 1,
    color: '#000',
  },
};

function renderGameScreen(gameState) {
  requestAnimationFrame(() => {
    // game.style.display = 'block';
    root.innerHTML = `
      <div class="game" id="game">
        <div class="game__score-p1">
          White<br /><span id="score-p1">0</span>
        </div>
        <div class="game__score-p2">
          Black<br /><span id="score-p2">0</span>
        </div>
        <canvas
          width="600px"
          height="300px"
          id="canvas"
          class="canvas"
        ></canvas>
      </div>
    `;

    setTimeout(() => {
      wJet = new Jet('img/white-jet.webp', gameState.p1);
      bJet = new Jet('img/black-jet.webp', gameState.p2);
      wJet.setScore(0);
      bJet.setScore(0);

      scoreP1 = document.getElementById('score-p1');
      scoreP2 = document.getElementById('score-p2');

      document.addEventListener('keydown', onkeydown);
      document.addEventListener('keyup', onKeyUp);
    });
  });
}

function renderGame(gameState) {
  wJet.clearCanvas();
  wJet.drawBullets(gameState);

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

function unrenderGame() {
  if (!scoreP1 && !scoreP2) return;
  requestAnimationFrame(() => {
    // game.style.display = 'block';
    root.innerHTML = '';
    scoreP1 = null;
    scoreP2 = null;

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

function renderGameMenu() {
  requestAnimationFrame(() => {
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
          class="btn btn-menu"
          id="btn-new-game"
          data-already-created="You have already created a room"
          data-invalid-form="Invalid game customization"
          data-wait="Waiting for the other player..."
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
      >
        <input type="submit" class="btn btn-menu" value="Join a game" />
        <input
          type="text"
          placeholder="Write room code here"
          id="input-room-id"
          class="game-menu__start-buttons__create__join-id"
        />
      </form>
    </section>
    <section class="game-menu__customization">
      <h3 class="game-menu__customization__title">Customize your game</h3>
      <div class="game-menu__customization__game">
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
                  value="2"
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
                  value="600"
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
                  value="300"
                  id="input-map-height"
                  name="map-height"
                />
              </td>
            </tr>
          </table>
        </form>
        <div class="game-menu__customization__jet">
          <h3>Selected Jet</h3>
          <button
            class="btn btn-select-jet"
            id="btn-select-jet"
            data-jet-type="black"
          >
            <img src="img/black-jet.webp" alt="black jet" />
          </button>
          <div class="btn-select-jet__popup" id="btn-select-jet-popup">
            <button
              class="btn btn-select-jet"
              data-secondary="true"
              data-jet-type="black"
            >
              <img src="img/black-jet.webp" alt="black jet" />
            </button>
            <button
              class="btn btn-select-jet"
              data-secondary="true"
              data-jet-type="white"
            >
              <img src="img/white-jet.webp" alt="white jet" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </article>
    `;

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
      joinForm.className =
        'game-menu__start-buttons__join ' +
        'game-menu__start-buttons__join--already-created';

      return;
    }

    const { value: inputValue } = input;

    if (!isInputValid(inputValue, '^r[A-Za-z0-9]{5}$')) {
      if (btnNewGame.classList.contains('btn-create__popup--already-created'))
        return;

      joinForm.className =
        'game-menu__start-buttons__join ' +
        'game-menu__start-buttons__join--invalid-id';
      return;
    }

    console.log(getJetCustomization(inputValue));
    sendToServer(getJetCustomization(inputValue));
  }

  function handleBtnNewGameClick() {
    // if player number already assigned
    if (getPlayerNumber()) {
      btnNewGame.className = 'btn btn-menu btn-create__popup--already-created';
      return;
    }

    clearInvalidInputsOutline();
    const invalidInputs = getInvalidInputs();

    if (invalidInputs.length) {
      invalidInputs.forEach((inputElement) => {
        inputElement.classList.add('red-outline');
      });

      if (btnNewGame.classList.contains('btn-create__popup--already-created'))
        return;

      btnNewGame.className = 'btn btn-menu btn-create__popup--invalid-form';

      return;
    }

    btnNewGame.className = 'btn btn-menu';
    console.log(getGameCustomization());
    sendToServer(getGameCustomization());
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

  function getGameCustomization() {
    const { jetType } = document.getElementById('btn-select-jet').dataset;

    const mapWidth = formGameCustomization['map-width'].value;
    const mapHeight = formGameCustomization['map-height'].value;
    const maxScore = formGameCustomization['max-score'].value;

    return {
      eventFromClient: 'requestNewRoom',
      gameSettings: {
        settings: { maxScore, mapWidth, mapHeight },
        p1JetCharacteristics: {
          ...jetTypes[jetType],
        },
      },
    };
  }

  function getJetCustomization(joinId) {
    const { jetType } = document.getElementById('btn-select-jet').dataset;
    return {
      eventFromClient: 'requestJoinRoom',
      joinId,
      gameSettings: {
        p2JetCharacteristics: {
          ...jetTypes[jetType],
        },
      },
    };
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
    btnSelectJet.setAttribute('data-jet-type', e.currentTarget.dataset.jetType);
    btnSelectJet.firstElementChild.src = e.currentTarget.firstElementChild.src;
    btnSelectJet.firstElementChild.alt = e.currentTarget.firstElementChild.alt;
  }
}

function renderRoomId(id) {
  roomIdElement.textContent = `Room Id: ${id}`;
  btnNewGame.className = 'btn btn-menu btn-create__popup--wait';
}

function renderJoinDenialMessage(reason) {
  switch (reason) {
    case 'notFound':
      joinForm.className =
        'game-menu__start-buttons__join ' +
        'game-menu__start-buttons__join--denial-not-found';
      return;
    case 'full':
      joinForm.className =
        'game-menu__start-buttons__join ' +
        'game-menu__start-buttons__join--denial-full';
      return;
    default:
      console.log('uknown denial reason');
  }
}

function unrenderGameMenu() {
  if (!gameMenu) return;
  requestAnimationFrame(() => {
    // game.style.display = 'block';
    root.innerHTML = '';
    gameMenu = null;
    joinForm = null;
    input = null;
    btnNewGame = null;
    roomIdElement = null;
  });
}

// ------------------------------------------
// -----Game Over Menu render/unrender-------
// ------------------------------------------

function renderGameOverMenu({ winPlayer }, playerNumber) {
  requestAnimationFrame(() => {
    root.innerHTML = `
      <div class="game-over-menu" id="game-over-menu">
        <h1>Game Over</h1>
        <p id="game-over-menu__message"></p>
        <button class="btn" id="btn-return-to-main-menu">Return to main menu</button>
        <button class="btn" id="btn-play-again">Play again</button>
      </div>
    `;

    setTimeout(() => {
      gameOverMenu = document.getElementById('game-over-menu');
      gameOverMenuMessage = document.getElementById('game-over-menu__message');
      btnPlayAgain = document.getElementById('btn-play-again');
      btnPlayAgain = document.getElementById('btn-play-again');
      btnReturnToMainMenu = document.getElementById('btn-return-to-main-menu');

      btnPlayAgain.onclick = handleBtnPlayAgainClick;
      btnReturnToMainMenu.onclick = handleBtnReturnToMainMenuClick;

      if (winPlayer === 'draw') {
        gameOverMenuMessage.textContent = 'It is a draw';
      } else if (winPlayer === playerNumber) {
        gameOverMenuMessage.textContent = 'You Won';
      } else {
        gameOverMenuMessage.textContent = 'You Lost';
      }
    }, 100);
  });

  function handleBtnReturnToMainMenuClick() {
    sendToServer({
      eventFromClient: 'responseAskPlayAgain',
      acceptPlayAgain: false,
    });
  }

  function handleBtnPlayAgainClick() {
    sendToServer({
      eventFromClient: 'requestPlayAgain',
      gameSettings: {
        settings: { maxScore: 2 },
        p1JetCharacteristics: {
          rotation: 3,
          speed: 0,
          color: '#fff',
        },
      },
    });
  }
}

function unrenderGameOverMenu() {
  if (!gameOverMenuMessage) return;
  requestAnimationFrame(() => {
    // game.style.display = 'block';
    root.innerHTML = '';
    gameOverMenu = null;
    gameOverMenuMessage = null;
    btnPlayAgain = null;
    btnPlayAgain = null;
    btnReturnToMainMenu = null;
  });
}

function renderAskPlayAgain() {
  gameOverMenu.insertAdjacentHTML(
    'beforeend',
    `
    <div class="game-over-menu__play-again-response">
      <p>Other player asks to play again, do you agree?</p>
      <button class="btn" id="btn-play-again-yes">Yes</button>
      <button class="btn" id="btn-play-again-no">No</button>
    </div>`
  );

  setTimeout(() => {
    const btnYes = document.getElementById('btn-play-again-yes');
    const btnNo = document.getElementById('btn-play-again-no');

    btnYes.onclick = () => {
      sendToServer({
        eventFromClient: 'responseAskPlayAgain',
        acceptPlayAgain: true,
        gameSettings: {
          p2JetCharacteristics: {
            rotation: 5,
            speed: 1,
            color: '#000',
          },
        },
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
  renderJoinDenialMessage,
};
