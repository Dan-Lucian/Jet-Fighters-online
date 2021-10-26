/* eslint-disable no-use-before-define */
/* eslint-disable import/no-cycle */

import { sendToServer, getPlayerNumber } from './main.js';
import { renderMessage, isInputValid } from './helpers.js';
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
    <div class="game-menu" id="game-menu">
      <h1>Jet Fighters Online</h1>
      <div class="game-menu__buttons">
        <div class="game-menu__buttons__new-game">
          <div id="room-id" class="room-id">288eud</div>
          <button type="submit" class="btn" id="btn-new-game">
            Create a new game
          </button>
        </div>
        <form class="form" id="form">
          <input
            type="text"
            class="game-menu__input"
            placeholder="Enter Room Code"
            id="input-room-code"
          />
          <button class="btn" type="submit" id="btn-join-game">
            Join Game
          </button>
        </form>
      </div>
    </div>
    `;

    setTimeout(() => {
      gameMenu = document.getElementById('game-menu');
      joinForm = document.getElementById('form');
      input = document.getElementById('input-room-code');
      btnNewGame = document.getElementById('btn-new-game');
      roomIdElement = document.getElementById('room-id');

      joinForm.onsubmit = onJoinFormSubmit;
      btnNewGame.onclick = handleBtnNewGameClick;
      btnNewGame.disabled = '';
      roomIdElement.style.display = 'none';
    });
  });

  function onJoinFormSubmit(e) {
    e.preventDefault();

    // if room id code already displayed then ignore submit
    if (roomIdElement.offsetHeight !== 0) {
      requestAnimationFrame(() =>
        renderMessage('You should wait for the other player')
      );
      return;
    }

    const { value: inputValue } = input;

    if (!isInputValid(inputValue, '^r[A-Za-z0-9]{5}$')) {
      requestAnimationFrame(() => renderMessage('Invalid room ID'));
      return;
    }

    sendToServer({ eventFromClient: 'requestJoinRoom', joinId: inputValue });
  }

  async function handleBtnNewGameClick() {
    if (roomIdElement.offsetHeight !== 0) {
      requestAnimationFrame(() =>
        renderMessage('You have already created a room')
      );
      return;
    }
    sendToServer({ eventFromClient: 'requestNewRoom' });
  }
}

function renderRoomId(id) {
  roomIdElement.textContent = `Room Id: ${id}`;
  roomIdElement.style.display = 'block';
  requestAnimationFrame(() =>
    renderMessage('The game will start when the 2nd player will join this room')
  );
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
    sendToServer({ eventFromClient: 'requestPlayAgain' });
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
};
