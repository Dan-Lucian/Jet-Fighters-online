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
    const jsonFromFront = JSON.parse(messageString);
    const { eventFromClient } = jsonFromFront;

    // received newRoom event
    if (eventFromClient === 'requestNewRoom') {
      const { gameSettings } = jsonFromFront;
      console.log(`requestNewRoom`);

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
      const { joinId } = jsonFromFront;
      console.log('requestJoinRoom');

      const { roomStatus } = getRoomStatus(joinId);

      if (roomStatus === 'notFound') {
        console.log('notFound');
        sendToClient({
          eventFromServer: 'denialJoinRoom',
          textMessage: 'notFound',
        });
        return;
      }

      if (roomStatus === 'full') {
        console.log('full');
        sendToClient({
          eventFromServer: 'denialJoinRoom',
          textMessage: 'full',
        });
        return;
      }

      if (roomStatus === 'joinable') {
        const { gameSettings } = jsonFromFront;
        console.log('joinable');

        ws.connectionId = joinId; // received with join request

        joinRoom(joinId, gameSettings, ws);

        const copyGameSettings = { ...allRooms.get(joinId).gameSettings };
        const gameState = createGameState(copyGameSettings);

        const { ws1 } = allRooms.get(joinId);
        ws1.intervalId = startGameLoop(ws1, ws, gameState);
        ws.intervalId = ws1.intervalId;
        return;
      }
    }

    if (eventFromClient === 'keyPressed') {
      const { keysStatus, playerNumber } = jsonFromFront;
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
      const { gameSettings } = jsonFromFront;
      const { ws1, ws2 } = allRooms.get(ws.connectionId);
      const otherWs = ws === ws1 ? ws2 : ws1;

      otherWs.send(
        JSON.stringify({
          eventFromServer: 'askPlayAgain',
        })
      );

      createRoom(ws.connectionId, gameSettings, ws, otherWs);
      return;
    }

    if (eventFromClient === 'responseAskPlayAgain') {
      const { acceptPlayAgain } = jsonFromFront;
      if (acceptPlayAgain) {
        const { gameSettings } = jsonFromFront;
        joinRoom(ws.connectionId, gameSettings, ws);

        const copyGameSettings = {
          ...allRooms.get(ws.connectionId).gameSettings,
        };
        const gameState = createGameState(copyGameSettings);

        const { ws1 } = allRooms.get(ws.connectionId);
        ws1.intervalId = startGameLoop(ws1, ws, gameState);
        ws.intervalId = ws1.intervalId;
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

function createRoom(roomId, gameSettings, ws1, ws2 = null) {
  gameSettings.settings.roomId = roomId;

  allRooms.set(roomId, {
    ws1,
    ws2,
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
  if (!allRooms.get(roomId)) {
    console.log('attempted to destroy a non existent room');
    return;
  }
  for (const wsFromRoom of Object.values(allRooms.get(roomId))) {
    // 2nd bc not to include game settings
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
