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
  function sendToClient(obj) {
    ws.send(JSON.stringify(obj));
  }

  ws.on('message', (messageString) => {
    const {
      eventFromClient,
      joinId,
      keysStatus,
      playerNumber,
      acceptPlayAgain,
    } = JSON.parse(messageString);

    // received newRoom event
    if (eventFromClient === 'requestNewRoom') {
      console.log(`requestNewRoom`);

      const roomId = `r${createId(5)}`;
      createRoom(roomId, ws);
      ws.connectionId = roomId;

      sendToClient({
        eventFromServer: 'responseNewRoom',
        roomId,
      });
      return;
    }

    // received joinRoom
    if (eventFromClient === 'requestJoinRoom') {
      console.log('requestJoinRoom');

      const { roomStatus } = getRoomStatus(joinId);

      if (roomStatus === 'notFound') {
        console.log('notFound');
        sendToClient({
          eventFromServer: 'denialJoinRoom',
          textMessage: 'Room not found',
        });
        return;
      }

      if (roomStatus === 'full') {
        console.log('full');
        sendToClient({
          eventFromServer: 'denialJoinRoom',
          textMessage: 'Full room',
        });
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
        return;
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
      return;
    }

    if (eventFromClient === 'requestPlayAgain') {
      const { ws1, ws2 } = allRooms.get(ws.connectionId);
      const otherWs = ws === ws1 ? ws2 : ws1;

      otherWs.send(
        JSON.stringify({
          eventFromServer: 'askPlayAgain',
        })
      );
      return;
    }

    if (eventFromClient === 'responseAskPlayAgain') {
      const { ws1, ws2 } = allRooms.get(ws.connectionId);

      if (acceptPlayAgain) {
        // eslint-disable-next-line no-shadow
        const gameState = createGameState({ roomId: ws.connectionId });
        ws1.intervalId = startGameLoop(ws1, ws2, gameState);
        ws2.intervalId = ws1.intervalId;
        return;
      }

      // saved here because sendRoom... will destroy it
      const { connectionId } = ws;
      sendRoomDestroyedAndRemoveIds(
        connectionId,
        'Room destroyed because a player denied to play again'
      );
      allRooms.delete(connectionId);

      return;
    }

    console.log(`unknown client request received: ${eventFromClient}`);
  });

  ws.on('close', () => {
    console.log('connection closed');
    if (!ws.connectionId) return;

    // saved here because sendRoom... will remove it
    const { connectionId } = ws;
    sendRoomDestroyedAndRemoveIds(connectionId, 'Other player disconnected');
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

  if (!room) return { roomStatus: 'notFound' };
  if (room.ws2) return { roomStatus: 'full' };
  return { roomStatus: 'joinable' };
}

function sendRoomDestroyedAndRemoveIds(roomId, textMessage) {
  for (const wsFromRoom of Object.values(allRooms.get(roomId))) {
    wsFromRoom.send(
      JSON.stringify({
        eventFromServer: 'roomDestroyed',
        textMessage,
      })
    );
    wsFromRoom.connectionId = null;
  }
}
