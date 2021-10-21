/* eslint-disable no-use-before-define */
const WebSocket = require('ws');
const {
  createGameState,
  startGameLoop,
  updateServerGameState,
} = require('./game.js');
const { createId } = require('./helpers');

const server = new WebSocket.Server({ port: '3000' });

const allRooms = new Map();

server.on('connection', (ws) => {
  ws.on('message', (messageString) => {
    const { eventFromClient, joinId, keysStatus, playerNumber } =
      JSON.parse(messageString);

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

      const { roomStatus } = getRoomStatus(joinId, ws);

      if (roomStatus === 'notFound') {
        console.log('notFound');
        ws.send(
          JSON.stringify({
            eventFromServer: 'joinRoomResponse',
            textMessage: 'Room not found',
          })
        );
        return;
      }

      if (roomStatus === 'full') {
        console.log('full');
        ws.send(
          JSON.stringify({
            eventFromServer: 'joinRoomResponse',
            textMessage: 'Full room',
          })
        );
        return;
      }

      if (roomStatus === 'joinable') {
        console.log('joinable');
        const { ws1 } = allRooms.get(joinId);
        const ws2 = ws;

        ws2.connectionId = joinId; // received with join request
        createRoom(joinId, ws1, ws2);

        const gameState = createGameState({ roomId: joinId });
        ws1.intervalId = startGameLoop(ws1, ws2, gameState);
        ws2.intervalId = ws1.intervalId;
      }
    }

    if (eventFromClient === 'keyPressed') {
      const jsonKeysStatus = JSON.parse(keysStatus);
      Object.keys(jsonKeysStatus).forEach((prop) => {
        updateServerGameState(
          ws.connectionId,
          playerNumber,
          prop,
          jsonKeysStatus[prop]
        );
      });
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
    // add game state here??
  });
  console.log('room created');
}

function getRoomStatus(id) {
  if (!id) {
    console.log('no id passed');
    return;
  }

  const room = allRooms.get(id);

  if (!room.ws1) return { status: 'notFound' };
  if (room.ws2) return { status: 'full' };
  return { roomStatus: 'joinable' };
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
