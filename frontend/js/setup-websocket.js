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
      const {
        eventFromServer,
        roomId,
        connection1Id,
        connection2Id,
        textMessage,
      } = jsonMessage;

      if (eventFromServer === 'newRoomResponse') {
        console.log(`   New room created: ${roomId}`);
        console.log(`   Connection Id: ${connection1Id}`);
      }

      if (eventFromServer === 'joinRoomResponse') {
        if (!connection2Id) {
          console.log(`Join denial because: ${textMessage}`);
          return;
        }
        console.log(`   Joining: ${roomId}`);
        console.log(`   Connection Id2: ${connection2Id}`);
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
    this.ws.send(JSON.stringify({ eventFromClient: 'newRoomRequest' }));
  }

  requestJoin(joinId) {
    this.ws.send(
      JSON.stringify({ eventFromClient: 'joinRoomRequest', joinId })
    );
  }
}

export const ws = new Ws(`ws://${info.hostname}${info.port}/`);
