import { info } from './config.js';

export async function setupWebsocket() {
  const ws = new WebSocket(`ws://${info.hostname}${info.port}/`);

  ws.onopen = () => {
    console.log('Connection established');
    sendCanvasClicks(ws);
  };

  ws.onmessage = (message) => {
    console.log('Message received: ', message.data);
  };

  ws.onerror = () => {
    console.log('Connection error');
  };

  ws.onclose = () => {
    console.log('Connection close');
  };
}

function sendCanvasClicks(ws) {
  const canvas = document.getElementById('canvas');

  canvas.addEventListener('click', onClick);
  function onClick() {
    ws.send('canvas clicked');
  }
}
