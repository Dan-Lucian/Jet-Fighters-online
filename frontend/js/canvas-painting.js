/* eslint-disable max-classes-per-file */
/* eslint-disable no-use-before-define */

// export class Bullet {
//   constructor(gameState, image) {
//     this.x = gameState.x;
//     this.y = gameState.y;
//     this.angle = gameState.angle;
//     this.speed = gameState.speed;
//     this.image = image;
//   }

//   draw() {
//     drawImage(this.image, this.x, this.y); // how do I do this?
//   }
// }

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
    console.log('drawing');
    const { scale, x, y, rightArrowPressed, leftArrowPressed, rotation } =
      state;

    // if (rightArrowPressed) state.angle -= rotation;
    // if (leftArrowPressed) state.angle += rotation;

    ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin

    const rad = (state.angle * PI) / 180 + PI;
    ctx.rotate(-rad); // "-"just works
    ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
  }
}

export function clearCanvas() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height); // front
}
