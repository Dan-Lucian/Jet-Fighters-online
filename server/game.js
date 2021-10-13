/* eslint-disable no-use-before-define */
const { FPS } = require('./constants.js');

module.exports = {
  createGameState,
  startGameLoop,
};

function createGameState() {
  return {
    player: {
      x: 10,
      y: 10,
    },
  };
}

function startGameLoop(ws1, ws2) {
  const gameState = { x: 10, y: 20, angle: 0, speed: 0.7 };
  return setInterval(() => {
    ws1.send(
      JSON.stringify({
        eventFromServer: 'gameState',
        gameState: JSON.stringify(gameState),
      })
    );

    ws2.send(
      JSON.stringify({
        eventFromServer: 'gameState',
        gameState: JSON.stringify(gameState),
        joinable: true, // needed for the joinable check
      })
    );
  }, 1000);
}

{
  // game logic demo

  const { PI } = Math;

  const gameState = {
    p1: {
      x: 10,
      y: 10,
      angle: 90,
      speed: 2,
      scale: 1,
      leftArrowPressed: false,
      rightArrowPressed: false,
    },
    p2: {
      x: 50,
      y: 10,
      angle: 90,
      speed: 1,
      scale: 1,
      leftArrowPressed: false,
      rightArrowPressed: false,
    },
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  function onKeyDown(e) {
    e.preventDefault();
    if (
      (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== ' ') ||
      e.repeat
    )
      return;

    if (e.key === 'ArrowRight') {
      gameState.p1.rightArrowPressed = true;
    }

    if (e.key === 'ArrowLeft') {
      gameState.p1.leftArrowPressed = true;
    }

    if (e.key === ' ') {
      console.log('pew pew');
    }
  }

  function onKeyUp(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

    if (e.key === 'ArrowRight') {
      gameState.p1.rightArrowPressed = false;
    }

    if (e.key === 'ArrowLeft') {
      gameState.p1.leftArrowPressed = false;
    }
  }

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  class Jet {
    constructor(url) {
      this.img = new Image();
      this.img.addEventListener('load', () => {
        this.loaded = true;
      });
      this.img.src = url;
    }

    draw(state) {
      const { scale, x, y, rightArrowPressed, leftArrowPressed } = state;

      if (rightArrowPressed) state.angle -= 5;
      if (leftArrowPressed) state.angle += 5;

      ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin

      const rad = (state.angle * PI) / 180 + PI;
      ctx.rotate(-rad); // "-"just works
      ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
    }
  }

  function goTheWayIsFacing(state) {
    const rad = (state.angle * PI) / 180;
    state.x += state.speed * Math.sin(rad);
    state.y += state.speed * Math.cos(rad);
  }

  const wJet = new Jet('img/white-jet.webp', gameState.p1);
  const bJet = new Jet('img/black-jet.webp', gameState.p2);

  function animate() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    goTheWayIsFacing(gameState.p1);
    goTheWayIsFacing(gameState.p2);

    wJet.draw(gameState.p1);
    bJet.draw(gameState.p2);
    requestAnimationFrame(animate);
  }

  animate();
}
