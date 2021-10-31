const FPS = 60;
const { PI } = Math;
const imgW = 22;
const imgH = 16;

const bulletSpeed = 6;
const bulletLifeTime = 200;

const jetTypes = {
  speedy: {
    rotation: 3,
    speed: 4,
  },
  balanced: {
    rotation: 4.5,
    speed: 3,
  },
  twitchy: {
    rotation: 6,
    speed: 2,
  },
};

// needed for server-side validation
const supportedJetCollors = ['#000', '#fff'];
const supportedJetTypes = ['speedy', 'balanced', 'twitchy'];
const supportedMaxWidth = 2000;
const supportedMinWidth = 100;
const supportedMaxHeight = 2000;
const supportedMinHeight = 100;
const supportedMaxScore = 50;
const supportedMinScore = 1;

module.exports = {
  FPS,
  PI,
  imgW,
  imgH,
  bulletSpeed,
  bulletLifeTime,
  jetTypes,
  supportedJetCollors,
  supportedJetTypes,
  supportedMaxWidth,
  supportedMinWidth,
  supportedMaxHeight,
  supportedMinHeight,
  supportedMaxScore,
  supportedMinScore,
};
