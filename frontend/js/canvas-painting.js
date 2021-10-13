/* eslint-disable max-classes-per-file */
/* eslint-disable no-use-before-define */

export class Bullet {
  constructor(gameState, image) {
    this.x = gameState.x;
    this.y = gameState.y;
    this.angle = gameState.angle;
    this.speed = gameState.speed;
    this.image = image;
  }

  draw() {
    drawImage(this.image, this.x, this.y); // how do I do this?
  }
}

export class Jet {
  constructor(gameState, image) {
    this.x = gameState.x;
    this.y = gameState.y;
    this.angle = gameState.angle;
    this.speed = gameState.speed;
    this.image = image;
  }

  draw() {
    drawImage(this.image, this.x, this.y); // how do I do this?
  }
}
