/* eslint-disable no-shadow */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-use-before-define */
module.exports = {
  startGameLoop,
  createGameState,
  updateServerGameState,
};

const { FPS } = require('./constants.js');
const { getRandomInt } = require('./helpers.js');

const { PI } = Math;
const imgW = 22;
const imgH = 16;
const canvasW = 600;
const canvasH = 300;
const intervalDelay = 1000 / FPS;
const maxScore = 2;
// const bulletSpeed = 4.5;

const allGameStates = new Map();

// can use this functio to create a user defined game config
function createGameState({ roomId }) {
  return {
    p1: {
      x: 20,
      y: 21,
      angle: 90,
      rotation: 2,
      speed: 0,
      scale: 1.5,
      leftArrowPressed: false,
      rightArrowPressed: false,
      spacePressed: false,
      bullets: [],
      score: 0,
      playerNumber: 'p1',
      color: '#fff',
    },
    p2: {
      x: 200,
      y: 20,
      angle: 0,
      rotation: 5,
      speed: 0,
      scale: 1.5,
      leftArrowPressed: false,
      rightArrowPressed: false,
      spacePressed: false,
      bullets: [],
      score: 0,
      playerNumber: 'p2',
      color: '#000',
    },
    roomId,
    winPlayer: null,
  };
}

// idea to cut the code in half
// function createPlayer(params) {

// }

function createBulletFor(player) {
  return {
    // x, y => precision relative to jet model
    x: player.x - 1,
    y: player.y - 1,
    angle: player.angle,
    // speed: player.speed * 2,
    speed: 3,
    color: player.color,
  };
}

// backdoor to the gamestate
function updateServerGameState(roomId, playerNumber, property, value) {
  allGameStates.get(roomId)[playerNumber][property] = value;
}

// change ws1, ws2 to allWs array
function sendGameState(ws1, ws2, gameState) {
  const stringGameState = JSON.stringify(gameState);
  ws1.send(
    JSON.stringify({
      eventFromServer: 'gameState',
      gameState: stringGameState,
      playerNumber: 'p1',
    })
  );
  ws2.send(
    JSON.stringify({
      eventFromServer: 'gameState',
      gameState: stringGameState,
      joinable: true, // needed for the joinable check
      playerNumber: 'p2',
    })
  );
}

// also change to array
function sendGameOver(ws1, ws2, winPlayer) {
  const stringGameState = JSON.stringify({ winPlayer });
  ws1.send(
    JSON.stringify({
      eventFromServer: 'gameOver',
      gameState: stringGameState,
      playerNumber: 'p1',
    })
  );
  ws2.send(
    JSON.stringify({
      eventFromServer: 'gameOver',
      gameState: stringGameState,
      joinable: true, // needed for the joinable check
      playerNumber: 'p2',
    })
  );
}

function startGameLoop(ws1, ws2, gameState) {
  allGameStates.set(ws1.connectionId, gameState);

  const intervalId = setInterval(() => {
    sendGameState(ws1, ws2, gameState);

    const { p1, p2 } = gameState;
    let winPlayer = null;
    let bulletLanded = false;

    goTheWayIsFacing(p1);
    goTheWayIsFacing(p2);

    createNewBulletsIfSpaceWasPressed(p1, p2);

    // first player is whose bullets will be updated
    bulletLanded = updateBulletsState(p1, p2);
    if (bulletLanded) {
      bulletLanded = false;
      winPlayer = incrementScore([p1], 1);
    }

    bulletLanded = updateBulletsState(p2, p1);
    if (bulletLanded) {
      bulletLanded = false;
      winPlayer = incrementScore([p2], 1);
    }
    // winPlayer = updateBulletsState(p1, p2);

    if (didJetsCollide(p1, p2)) {
      resetJetPosition(p1, p2);
      winPlayer = incrementScore([p1, p2], 1);
    }

    if (winPlayer) {
      clearInterval(intervalId);
      sendGameOver(ws1, ws2, winPlayer);
    }
  }, intervalDelay);

  return intervalId;
}

function goTheWayIsFacing(state) {
  const { rightArrowPressed, leftArrowPressed, rotation } = state;

  if (rightArrowPressed) state.angle -= rotation;
  if (leftArrowPressed) state.angle += rotation;

  const rad = (state.angle * PI) / 180;
  state.x += state.speed * Math.sin(rad);
  state.y += state.speed * Math.cos(rad);
}

// easy to scale, transform to receive array
function createNewBulletsIfSpaceWasPressed(p1, p2) {
  if (p1.spacePressed) {
    p1.spacePressed = false;
    p1.bullets.push(createBulletFor(p1));
  }
  if (p2.spacePressed) {
    p2.spacePressed = false;
    p2.bullets.push(createBulletFor(p2));
  }
}

function updateBulletsState(player1, player2) {
  for (let i = 0; i < player1.bullets.length; i += 1) {
    goTheWayIsFacing(player1.bullets[i]);

    if (didBulletLand(player2, player1.bullets[i])) {
      player1.bullets.splice(i, 1);
      return true;
    }

    if (isOutOfBounds(player1.bullets[i])) player1.bullets.splice(i, 1);
  }
}

function didBulletLand(stateJet, stateEnemyBullet) {
  const { x: xJet, y: yJet, scale } = stateJet;
  const { x: xBullet, y: yBullet } = stateEnemyBullet;

  const left = xJet - (imgW * scale) / 2;
  const right = xJet + (imgW * scale) / 2;
  const top = yJet - (imgH * scale) / 2 - 4;
  const bottom = yJet + (imgH * scale) / 2 + 4;

  if (xBullet > left && xBullet < right && yBullet > top && yBullet < bottom) {
    // if (pixelColorUnder(xBullet, yBullet, '#000000')) return true;
    return true;
  }
}

function resetJetPosition(jetState1, jetState2 = null) {
  jetState1.x = getRandomInt(50, 550);
  jetState1.y = getRandomInt(50, 250);

  if (jetState2 === null) return;
  jetState1.x = getRandomInt(50, 550);
  jetState2.y = getRandomInt(50, 250);
}

function isOutOfBounds(state) {
  if (!state) return;

  const { x, y } = state;
  if (x < 0 || x > canvasW || y < 0 || y > canvasH) return true;
}

function didJetsCollide(stateJet1, stateJet2) {
  const { x: x1, y: y1, scale: scale1 } = stateJet1;
  const { x: x2, y: y2, scale: scale2 } = stateJet2;

  const left1 = x1 - (imgW * scale1) / 2;
  const right1 = x1 + (imgW * scale1) / 2;
  const top1 = y1 - (imgH * scale1) / 2 - 4;
  const bottom1 = y1 + (imgH * scale1) / 2 + 4;

  // get 4 corners
  const left2 = x2 - (imgW * scale2) / 2;
  const right2 = x2 + (imgW * scale2) / 2;
  const top2 = y2 - (imgH * scale2) / 2 - 4;
  const bottom2 = y2 + (imgH * scale2) / 2 + 4;

  // check for any corner entering another jet square area
  if (
    (left1 > left2 && left1 < right2 && top1 > top2 && top1 < bottom2) ||
    (right1 > left2 && right1 < right2 && top1 > top2 && top1 < bottom2) ||
    (right1 > left2 &&
      right1 < right2 &&
      bottom1 > top2 &&
      bottom1 < bottom2) ||
    (left1 > left2 && left1 < right2 && bottom1 > top2 && bottom1 < bottom2)
  ) {
    console.log('passed');
    return true;
  }
}

function incrementScore(players, amount) {
  for (let i = 0; i < players.length; i += 1) {
    players[i].score += amount;
    console.log(
      `score incremented for ${players[i].playerNumber} by 1 ` +
        `, now it is ${players[i].score}`
    );
    if (players[i].score === maxScore) return players[i].playerNumber;
  }
}
