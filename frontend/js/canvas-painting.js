/* eslint-disable max-classes-per-file */
/* eslint-disable no-use-before-define */

// const imgW = 22;
// const imgH = 16;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const { PI } = Math;

export class Jet {
  constructor(url) {
    this.img = new Image();
    this.img.addEventListener('load', () => {
      this.loaded = true;
    });
    this.img.src = url;
  }

  draw(state) {
    const { scale, x, y } = state;
    const rad = -((state.angle * PI) / 180 + PI); // just works

    ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin
    ctx.rotate(rad);
    ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
  }
}

export function clearCanvas() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height); // front
}

export function drawBullets(gameState) {
  const { p1, p2 } = gameState;

  for (let i = 0; i < p1.bullets.length; i += 1) {
    ctx.fillStyle = p1.bullets[i].color;
    ctx.fillRect(p1.bullets[i].x, p1.bullets[i].y, 3, 3);
  }

  for (let i = 0; i < p2.bullets.length; i += 1) {
    ctx.fillStyle = p2.bullets[i].color;
    ctx.fillRect(p2.bullets[i].x, p2.bullets[i].y, 3, 3);
  }
}
