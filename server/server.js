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
      console.log('newRoomRequest');

      const roomId = `r${createId(5)}`;
      const connectionId = `c1${createId(10)}`;
      createRoom(roomId, connectionId);

      ws.send(
        JSON.stringify({
          eventFromServer: 'newRoomResponse',
          roomId,
          connectionId,
        })
      );
    }

    // received joinRoom
    if (eventFromClient === 'joinRoomRequest') {
      console.log('joinRoomRequest');

      const { status, connectionId } = getRoomStatus(joinId);

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
        ws.send(
          JSON.stringify({
            eventFromServer: 'joinRoomResponse',
            connectionId,
            roomId: joinId,
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

function createRoom(roomId, connectionId) {
  allRooms.set(roomId, {
    connection1Id: connectionId,
    connection2Id: null,
  });
  console.log('room created');
}

function getRoomStatus(id) {
  if (!id) console.log('id empty');

  const room = { ...allRooms.get(id) };

  if (!room.connection1Id) return { status: 'notFound' };
  if (room.connection2Id) return { status: 'full' };

  room.connection2Id = `c2${createId(10)}`;
  allRooms.set(id, room);
  return { status: 'joinable', connectionId: room.connection2Id };
}
