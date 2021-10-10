/* eslint-disable no-use-before-define */
const WebSocket = require('ws');
const { createGameState } = require('./game.js');
const { FPS } = require('./constants.js');
const { createId } = require('./helpers');

const server = new WebSocket.Server({ port: '3000' });

const allRooms = new Map();

server.on('connection', (ws) => {
  ws.on('message', (messageString) => {
    const { eventFromClient, joinId } = JSON.parse(messageString);

    // const state = createGameState();

    // startGameInterval();

    // received newRoom event
    if (eventFromClient === 'newRoomRequest') {
      console.log(`newRoomRequest`);

      const roomId = `r${createId(5)}`;
      createRoom(roomId, ws);

      ws.send(
        JSON.stringify({
          eventFromServer: 'newRoomResponse',
          roomId,
        })
      );
    }

    // received joinRoom
    if (eventFromClient === 'joinRoomRequest') {
      console.log('joinRoomRequest');

      const { status } = getRoomStatus(joinId, ws);

      if (status === 'notFound') {
        console.log('notFound');
        ws.send(
          JSON.stringify({
            eventFromServer: 'joinRoomResponse',
            textMessage: 'Room not found',
          })
        );
        return;
      }

      if (status === 'full') {
        console.log('full');
        ws.send(
          JSON.stringify({
            eventFromServer: 'joinRoomResponse',
            textMessage: 'Full room',
          })
        );
        return;
      }

      if (status === 'joinable') {
        console.log('joinable');
        allRooms.get(joinId).ws2 = ws;
        ws.send(
          JSON.stringify({
            eventFromServer: 'joinRoomResponse',
            roomId: joinId,
            joinable: true,
          })
        );
        // initialize the game here
      }
    }
  });

  ws.on('close', () => {
    console.log('connection closed');
  });
});

function createRoom(roomId, ws) {
  allRooms.set(roomId, {
    ws1: ws,
    ws2: null,
  });
  console.log('room created');
}

function getRoomStatus(id, ws) {
  if (!id) console.log('id empty');

  const room = { ...allRooms.get(id) };

  if (!room.ws1) return { status: 'notFound' };
  if (room.ws2) return { status: 'full' };

  // allRooms.set(id, room);
  return { status: 'joinable' };
}
