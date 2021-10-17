/* eslint-disable no-inner-declarations */
/* eslint-disable no-use-before-define */
/* eslint-disable no-bitwise */
/* eslint-disable no-throw-literal */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
module.exports = {
  startGameLoop,
  createGameState,
};

const { FPS } = require('./constants.js');
const { getRandomInt } = require('./helpers.js');

const { PI } = Math;
const imgW = 22;
const imgH = 16;
const canvasW = 700;
const canvasH = 300;
const intervalDelay = 1000 / FPS;
// const bulletSpeed = 4.5;

function createGameState() {
  return {
    p1: {
      x: 20,
      y: 20,
      angle: 90,
      rotation: 2,
      speed: 2,
      scale: 1.5,
      leftArrowPressed: false,
      rightArrowPressed: false,
      bullets: [],
    },
    p2: {
      x: 100,
      y: 20,
      angle: 0,
      rotation: 5,
      speed: 0,
      scale: 1.5,
      leftArrowPressed: false,
      rightArrowPressed: false,
      bullets: [],
    },
  };
}

function sendGameState(ws1, ws2, gameState) {
  const stringGameState = JSON.stringify(gameState);
  ws1.send(
    JSON.stringify({
      eventFromServer: 'gameState',
      gameState: stringGameState,
    })
  );
  ws2.send(
    JSON.stringify({
      eventFromServer: 'gameState',
      gameState: stringGameState,
      joinable: true, // needed for the joinable check
    })
  );
}

function startGameLoop(ws1, ws2, gameState) {
  return setInterval(() => {
    sendGameState(ws1, ws2, gameState);

    const { p1, p2 } = gameState;

    goTheWayIsFacing(p1);
    goTheWayIsFacing(p2);
  }, intervalDelay);
}

// function animate() {
//   ctx.clearRect(0, 0, canvas.width, canvas.height); // front

//   const { p1, p2 } = gameState;

//   goTheWayIsFacing(p1);
//   goTheWayIsFacing(p2);
//   wJet.draw(p1); // front
//   bJet.draw(p2); // front

//   ctx.setTransform(1, 0, 0, 1, 0, 0);

//   if (didJetsCollide(p1, p2)) {
//     resetJetPosition(p2);
//     resetJetPosition(p1);
//     incrementScoreW();
//     incrementScoreB();
//     // resetPositionW();
//     // resetPositionB();
//   }

//   for (let i = 0; i < p1.bullets.length; i += 1) {
//     goTheWayIsFacing(p1.bullets[i]);
//     if (didBulletLand(p2, p1.bullets[i])) {
//       p1.bullets.splice(i, 1);
//       incrementScoreW();
//       resetJetPosition(p2);
//     } else {
//       drawBullet(p1.bullets[i]);
//     }

//     if (isOutOfBounds(p1.bullets[i])) p1.bullets.splice(i, 1);
//   }

//   for (let i = 0; i < p2.bullets.length; i += 1) {
//     goTheWayIsFacing(p2.bullets[i]);
//     drawBullet(p2.bullets[i]);
//   }

//   requestAnimationFrame(animate);
// }

// -----------------------------------------------
// ----------game logic demo----------------------
// -----------------------------------------------

// const scoreW = document.getElementById('score-white'); // front
// const scoreB = document.getElementById('score-black'); // front

// front
// function incrementScoreB() {
//   scoreB.innerHTML = `${parseInt(scoreB.innerHTML) + 1} Black`;
// }

// // front
// function incrementScoreW() {
//   scoreW.innerHTML = `${parseInt(scoreW.innerHTML) + 1} White`;
// }

// front
// document.addEventListener('keydown', onKeyDown);
// document.addEventListener('keyup', onKeyUp);
// function onKeyDown(e) {
//   e.preventDefault();
//   if (
//     (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== ' ') ||
//     e.repeat
//   )
//     return;

//   if (e.key === 'ArrowRight') {
//     gameState.p1.rightArrowPressed = true;
//   }

//   if (e.key === 'ArrowLeft') {
//     gameState.p1.leftArrowPressed = true;
//   }

//   if (e.key === ' ') {
//     const { x, y, angle, speed } = gameState.p1;
//     gameState.p1.bullets.push({
//       // x, y => precision relative to jet model
//       x: x - 1,
//       y: y - 1,
//       angle,
//       speed: speed * 2,
//       color: '#fff',
//     });
//   }
// }

// function onKeyUp(e) {
//   if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

//   if (e.key === 'ArrowRight') {
//     gameState.p1.rightArrowPressed = false;
//   }

//   if (e.key === 'ArrowLeft') {
//     gameState.p1.leftArrowPressed = false;
//   }
// }

// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');

// class Jet {
//   constructor(url) {
//     this.img = new Image();
//     this.img.addEventListener('load', () => {
//       this.loaded = true;
//     });
//     this.img.src = url;
//   }

//   draw(state) {
//     const { scale, x, y, rightArrowPressed, leftArrowPressed, rotation } =
//       state;

//     if (rightArrowPressed) state.angle -= rotation;
//     if (leftArrowPressed) state.angle += rotation;

//     ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin

//     const rad = (state.angle * PI) / 180 + PI;
//     ctx.rotate(-rad); // "-"just works
//     ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
//   }
// }

// imgH and imgW declared here
// function drawBullet(bulletState) {
//   console.log(imgW);
//   ctx.fillStyle = bulletState.color;
//   ctx.fillRect(bulletState.x, bulletState.y, 3, 3);
// }

// function pixelColorUnder(x, y, backgroundColor) {
//   const c = ctx.getImageData(x, y, 1, 1).data;
//   const hex = `#${`000000${rgbToHex(c[0], c[1], c[2])}`.slice(-6)}`;

//   if (hex === backgroundColor) return;
//   return hex;

//   function rgbToHex(r, g, b) {
//     if (r > 255 || g > 255 || b > 255) throw 'Invalid color component';
//     return ((r << 16) | (g << 8) | b).toString(16);
//   }
// }

// function didBulletLand(stateJet, stateEnemyBullet) {
//   const { x: xJet, y: yJet, scale } = stateJet;
//   const { x: xBullet, y: yBullet } = stateEnemyBullet;

//   const left = xJet - (imgW * scale) / 2;
//   const right = xJet + (imgW * scale) / 2;
//   const top = yJet - (imgH * scale) / 2 - 4;
//   const bottom = yJet + (imgH * scale) / 2 + 4;

//   if (xBullet > left && xBullet < right && yBullet > top && yBullet < bottom) {
//     if (pixelColorUnder(xBullet, yBullet, '#000000')) return true;
//   }
// }

// function isOutOfBounds(state) {
//   if (!state) return;

//   const { x, y } = state;
//   if (x < 0 || x > canvasW || y < 0 || y > canvasH) return true;
// }

// function didJetsCollide(stateJet1, stateJet2) {
//   const { x: x1, y: y1, scale: scale1 } = stateJet1;
//   const { x: x2, y: y2, scale: scale2 } = stateJet2;

//   const left1 = x1 - (imgW * scale1) / 2;
//   const right1 = x1 + (imgW * scale1) / 2;
//   const top1 = y1 - (imgH * scale1) / 2 - 4;
//   const bottom1 = y1 + (imgH * scale1) / 2 + 4;

//   const left2 = x2 - (imgW * scale2) / 2;
//   const right2 = x2 + (imgW * scale2) / 2;
//   const top2 = y2 - (imgH * scale2) / 2 - 4;
//   const bottom2 = y2 + (imgH * scale2) / 2 + 4;

//   // drawRegion(left1, top1, right1, bottom1);
//   // drawRegion(left2, top2, right2, bottom2);

//   if (
//     (left1 > left2 && left1 < right2 && top1 > top2 && top1 < bottom2) ||
//     (right1 > left2 && right1 < right2 && top1 > top2 && top1 < bottom2) ||
//     (right1 > left2 &&
//       right1 < right2 &&
//       bottom1 > top2 &&
//       bottom1 < bottom2) ||
//     (left1 > left2 && left1 < right2 && bottom1 > top2 && bottom1 < bottom2)
//   ) {
//     return true;
//   }

//   function drawRegion(left, top, right, bottom) {
//     ctx.fillStyle = 'rgb(200, 0 ,0)';
//     ctx.beginPath();
//     ctx.moveTo(left, top);
//     ctx.lineTo(left, bottom);
//     ctx.lineTo(right, bottom);
//     ctx.lineTo(right, top);
//     ctx.lineTo(left, top);
//     ctx.fill();
//   }
// }

// back end
function goTheWayIsFacing(state) {
  const rad = (state.angle * PI) / 180;
  state.x += state.speed * Math.sin(rad);
  state.y += state.speed * Math.cos(rad);
}

function resetJetPosition(state) {
  state.x = getRandomInt(50, 650);
  state.y = getRandomInt(50, 250);
}

// const wJet = new Jet('img/white-jet.webp', gameState.p1);
// const bJet = new Jet('img/black-jet.webp', gameState.p2);

// animate();
