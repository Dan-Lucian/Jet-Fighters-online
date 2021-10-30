/* eslint-disable no-shadow */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-use-before-define */
module.exports = {
  startGameLoop,
  createGameState,
  updateServerGameState,
};

const { FPS, PI, imgW, imgH, canvasW, canvasH } = require('./constants.js');
const { getRandomInt } = require('./helpers.js');

const intervalDelay = 1000 / FPS;

// counts in FPS per second
const bulletLifeTime = 150;
// const bulletSpeed = 4.5;

const allGameStates = new Map();

const jetTypes = {
  speedy: {
    rotation: 3,
    speed: 2,
  },
  balanced: {
    rotation: 4.5,
    speed: 1.5,
  },
  twitchy: {
    rotation: 6,
    speed: 1,
  },
  colors: {
    white: '#fff',
    black: '#000',
  },
};

function createGameState(gameSettings) {
  const { color: p1Color, jetType: p1JetType } =
    gameSettings.p1JetCharacteristics;

  const { color: p2Color, jetType: p2JetType } =
    gameSettings.p2JetCharacteristics;

  const { maxScore, roomId, mapWidth, mapHeight } = gameSettings.settings;

  return {
    p1: {
      x: 20,
      y: 20,
      angle: 0,
      scale: 2,
      leftArrowPressed: false,
      rightArrowPressed: false,
      spacePressed: false,
      bullets: [],
      score: 0,
      playerNumber: 'p1',
      color: p1Color,
      ...jetTypes[p1JetType],
    },
    p2: {
      x: 50,
      y: 50,
      angle: 0,
      scale: 2,
      leftArrowPressed: false,
      rightArrowPressed: false,
      spacePressed: false,
      bullets: [],
      score: 0,
      playerNumber: 'p2',
      color: p2Color,
      ...jetTypes[p2JetType],
    },
    settings: {
      roomId,
      winPlayer: null,
      maxScore,
      mapWidth,
      mapHeight,
    },
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
    timeAlive: 0,
  };
}

// backdoor to the gamestate
function updateServerGameState(roomId, playerNumber, property, value) {
  allGameStates.get(roomId)[playerNumber][property] = value;
}

// change ws1, ws2 to allWs array
// 4 duplications
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
  resetJetsPosition([gameState.p1, gameState.p2]);

  const intervalId = setInterval(() => {
    sendGameState(ws1, ws2, gameState);

    const { p1, p2 } = gameState;
    let bulletLanded = false;

    goTheWayIsFacing(p1);
    goTheWayIsFacing(p2);

    if (isOutOfBounds(p1)) teleportToOppositeSide(p1);
    if (isOutOfBounds(p2)) teleportToOppositeSide(p2);

    createNewBulletsIfSpaceWasPressed(p1, p2);

    // first player is whose bullets will be updated
    bulletLanded = updateBulletsState(p1, p2);
    if (bulletLanded) {
      bulletLanded = false;
      incrementScore([p1], 1);
      resetJetsPosition([p2]);
    }

    bulletLanded = updateBulletsState(p2, p1);
    if (bulletLanded) {
      bulletLanded = false;
      incrementScore([p2], 1);
      resetJetsPosition([p1]);
    }

    if (didJetsCollide(p1, p2)) {
      resetJetsPosition([p1, p2]);
      incrementScore([p1, p2], 1);
    }

    const winner = getWinner([p1, p2], gameState.settings.maxScore);
    if (winner) {
      clearInterval(intervalId);
      sendGameOver(ws1, ws2, winner);
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

    player1.bullets[i].timeAlive += 1;
    if (player1.bullets[i].timeAlive > bulletLifeTime) {
      player1.bullets.splice(i, 1);
      return false;
    }

    if (isOutOfBounds(player1.bullets[i]))
      teleportToOppositeSide(player1.bullets[i]);
  }
}

function didBulletLand(stateEnemyJet, stateBullet) {
  const { x: xJet, y: yJet, scale } = stateEnemyJet;
  const { x: xBullet, y: yBullet } = stateBullet;

  const left = xJet - (imgW * scale) / 2;
  const right = xJet + (imgW * scale) / 2;
  const top = yJet - (imgH * scale) / 2 - 4;
  const bottom = yJet + (imgH * scale) / 2 + 4;

  if (xBullet > left && xBullet < right && yBullet > top && yBullet < bottom)
    return true;
}

function resetJetsPosition(jetStates) {
  for (let i = 0; i < jetStates.length; i += 1) {
    jetStates[i].x = getRandomInt(50, canvasW - 50);
    jetStates[i].y = getRandomInt(50, canvasH - 50);

    jetStates[i].angle = getRandomInt(0, 360);
  }
}

function isOutOfBounds(state) {
  if (!state) return;

  const { x, y } = state;
  if (x < 0 || x > canvasW || y < 0 || y > canvasH) return true;
}

function teleportToOppositeSide(state) {
  if (!state) return;

  const { x, y } = state;
  if (x < 0) state.x = canvasW;
  if (x > canvasW) state.x = 0;
  if (y < 0) state.y = canvasH;
  if (y > canvasH) state.y = 0;
}

function didJetsCollide(stateJet1, stateJet2) {
  const { x: x1, y: y1, scale: scale1 } = stateJet1;
  const { x: x2, y: y2, scale: scale2 } = stateJet2;

  const left1 = x1 - (imgW * scale1) / 2;
  const right1 = x1 + (imgW * scale1) / 2;
  const top1 = y1 - (imgH * scale1) / 2 - 4;
  const bottom1 = y1 + (imgH * scale1) / 2 + 4;

  // get 4 sides
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
  }
}

function getWinner(players, maxScore) {
  const winners = [];
  for (let i = 0; i < players.length; i += 1) {
    if (players[i].score === maxScore) winners.push(players[i].playerNumber);
  }

  if (winners.length === 1) return winners[0];
  if (winners.length > 1) return 'draw';
  return null;
}
