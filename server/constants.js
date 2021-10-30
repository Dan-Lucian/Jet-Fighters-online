const FPS = 60;
const { PI } = Math;
const imgW = 22;
const imgH = 16;
const canvasW = 600;
const canvasH = 300;

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
  canvasW,
  canvasH,
  supportedJetCollors,
  supportedJetTypes,
  supportedMaxWidth,
  supportedMinWidth,
  supportedMaxHeight,
  supportedMinHeight,
  supportedMaxScore,
  supportedMinScore,
};
