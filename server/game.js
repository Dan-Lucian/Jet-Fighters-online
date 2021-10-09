/* eslint-disable no-use-before-define */
const { FPS } = require('./constants.js');

module.exports = {
  createGameState,
};

function createGameState() {
  return {
    player: {
      x: 10,
      y: 10,
    },
  };
}
