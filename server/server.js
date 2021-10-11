/* eslint-disable no-use-before-define */
const WebSocket = require('ws');
const { createGameState } = require('./game.js');
const { FPS } = require('./constants.js');
const { createId } = require('./helpers');

const gameState = { x: 20, y: 10 };

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
        ws2.send(
          JSON.stringify({
            eventFromServer: 'gameState',
            gameState: JSON.stringify(gameState),
            joinable: true, // needed for the joinable check
          })
        );

        ws1.send(
          JSON.stringify({
            eventFromServer: 'gameState',
            gameState: JSON.stringify(gameState),
          })
        );

        createRoom(joinId, ws1, ws2);
      }
    }
  });

  ws.on('close', () => {
    console.log('connection closed');
    if (!ws.connectionId) return;
    console.log(`test = ${ws.connectionId}`);

    const stillConnectedWs = closeRoom(ws.connectionId);
    stillConnectedWs.connectionId = null;
    stillConnectedWs.send(
      JSON.stringify({
        eventFromServer: 'otherPlayerDisconnected',
      })
    );
  });
}); // error when the person who started the game disconnects

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

function closeRoom(roomId) {
  if (!roomId) return;

  const room = allRooms.get(roomId);
  allRooms.delete(roomId);

  return room.ws1 || room.ws2;
}
