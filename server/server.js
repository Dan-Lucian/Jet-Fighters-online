/* eslint-disable no-use-before-define */
const WebSocket = require('ws');
const { createGameState, startGameLoop } = require('./game.js');
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
      ws.connectionId = roomId;

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
        const { ws1 } = { ...allRooms.get(joinId) }; // copy, not mutate
        const ws2 = ws;

        ws2.connectionId = joinId; // unique socket id
        createRoom(joinId, ws1, ws2);

        const gameState = createGameState();
        ws1.intervalId = startGameLoop(ws1, ws2, gameState);
        ws2.intervalId = ws1.intervalId;
      }
    }
  });

  ws.on('close', () => {
    console.log('connection closed');
    if (!ws.connectionId) return;

    const { connectionId } = ws;
    sendDisconnectAndRemoveIds(connectionId);
    clearInterval(ws.intervalId);
    allRooms.delete(connectionId);
  });
});

function createRoom(roomId, ws1, ws2 = null) {
  allRooms.set(roomId, {
    ws1,
    ws2,
  });
  console.log('room created');
}

function getRoomStatus(id) {
  if (!id) console.log('id empty');

  const room = { ...allRooms.get(id) }; // copy not mutate

  if (!room.ws1) return { status: 'notFound' };
  if (room.ws2) return { status: 'full' };

  // allRooms.set(id, room);
  return { status: 'joinable' };
}

function sendDisconnectAndRemoveIds(roomId) {
  for (const ws of Object.values(allRooms.get(roomId))) {
    ws.send(
      JSON.stringify({
        eventFromServer: 'otherPlayerDisconnected',
      })
    );
    ws.connectionId = null;
  }
}
