const { createId } = require('./helpers');
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: '3000' });

const clients = new Map();

server.on('connection', (ws) => {
  console.log('connection established');
  ws.send(JSON.stringify({ message: 'server here' }));

  ws.on('message', (messageString) => {
    const message = JSON.parse(messageString);
    console.log('Received message: ', JSON.stringify(message));

    // received newRoom event
    if (message.event === 'newRoom') {
      const roomId = createId(10);
      ws.send(JSON.stringify({ newRoomId: roomId }));
    }
  });

  ws.on('close', () => {
    console.log('connection closed');
  });
});

function createRoom() {}
