/* eslint-disable no-use-before-define */
const WebSocket = require('ws');
const { createId } = require('./helpers');
const {
  createGameState,
  startGameLoop,
  updateServerGameState,
} = require('./game.js');

const server = new WebSocket.Server({ port: '3000' });

const allRooms = new Map();

server.on('connection', (ws) => {
  function sendToClient(obj) {
    ws.send(JSON.stringify(obj));
  }

  ws.on('message', (messageString) => {
    // const jsonFromFront = JSON.parse(messageString);
    const {
      eventFromClient,
      joinId,
      keysStatus,
      playerNumber,
      acceptPlayAgain,
      gameSettings,
    } = JSON.parse(messageString);

    // received newRoom event
    if (eventFromClient === 'requestNewRoom') {
      console.log(`requestNewRoom`);

      // const { gameSettings } = jsonFromFront;
      const roomId = `r${createId(5)}`;

      createRoom(roomId, gameSettings, ws);
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

        ws.connectionId = joinId; // received with join request

        joinRoom(joinId, gameSettings, ws);

        // eslint-disable-next-line no-shadow
        const copyGameSettings = { ...allRooms.get(joinId).gameSettings };
        const gameState = createGameState(copyGameSettings);

        const { ws1 } = allRooms.get(joinId);
        ws1.intervalId = startGameLoop(ws1, ws, gameState);
        ws.intervalId = ws1.intervalId;
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
      console.log(`room ${connectionId} destroyed`);

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
    console.log(`room ${connectionId} destroyed`);
  });
});

function createRoom(roomId, gameSettings, ws1) {
  gameSettings.settings.roomId = roomId;

  allRooms.set(roomId, {
    ws1,
    gameSettings: { ...gameSettings },
  });
  console.log('room created');
}

function joinRoom(roomId, additionalGameSettings, ws2) {
  const { ws1, gameSettings } = allRooms.get(roomId);

  allRooms.set(roomId, {
    ws1,
    ws2,
    gameSettings: { ...gameSettings, ...additionalGameSettings },
  });
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
    if (wsFromRoom && !wsFromRoom.p1JetCharacteristics) {
      wsFromRoom.send(
        JSON.stringify({
          eventFromServer: 'roomDestroyed',
          textMessage,
        })
      );
      wsFromRoom.connectionId = null;
    }
  }
}
