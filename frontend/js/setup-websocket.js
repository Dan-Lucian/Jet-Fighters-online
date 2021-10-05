import { info } from './config.js';

export class Ws {
  constructor(url) {
    this.ws = new WebSocket(url);
  }

  setupWsEvents() {
    this.ws.onopen = () => {
      console.log('Connection established');
    };

    this.ws.onmessage = (message) => {
      const jsonMessage = JSON.parse(message.data);
      console.log('Message from server received: ');

      if (jsonMessage.newRoomId) {
        console.log('new room created');
        console.log(jsonMessage.newRoomId);
      }
    };

    this.ws.onerror = () => {
      console.log('Connection error');
    };

    this.ws.onclose = () => {
      console.log('Connection close');
    };
  }

  requestNewRoom() {
    console.log(JSON.stringify({ event: 'newRoom' }));
    this.ws.send(JSON.stringify({ event: 'newRoom' }));
  }
}

export const ws = new Ws(`ws://${info.hostname}${info.port}/`);
