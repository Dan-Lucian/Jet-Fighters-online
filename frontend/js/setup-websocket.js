import { info } from './config.js';

export async function setupWebsocket() {
  const ws = new WebSocket(`ws://${info.hostname}${info.port}/`);

  ws.onopen = () => {
    console.log('Connection established');
  };

  ws.onmessage = () => {
    console.log('Message received');
  };

  ws.onerror = () => {
    console.log('Connection error');
  };

  ws.onclose = () => {
    console.log('Connection close');
  };
}
