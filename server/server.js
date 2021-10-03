const WebSocket = require('ws');
const server = new WebSocket.Server({ port: '3000' });

const clients = new Map();

server.on('connection', (ws) => {
  console.log('connection established');
  ws.send('Server speaking: Connection successful');

  ws.on('message', (messageString) => {
    // const message = JSON.parse(messageString);
    console.log('Received message: ', messageString);
  });

  ws.on('close', () => {
    console.log('connection closed');
  });
});
