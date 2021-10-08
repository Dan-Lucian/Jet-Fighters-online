/* eslint-disable no-use-before-define */
const WebSocket = require('ws');
const { createId } = require('./helpers');

const server = new WebSocket.Server({ port: '3000' });

const allRooms = new Map();

server.on('connection', (ws) => {
  ws.on('message', (messageString) => {
    const { eventFromClient, joinId } = JSON.parse(messageString);

    // received newRoom event
    if (eventFromClient === 'newRoomRequest') {
      console.log('newRoomRequest');
      const roomId = `r${createId(5)}`;
      const connection1Id = `c1${createId(10)}`;
      createRoom(roomId, connection1Id);
      ws.send(
        JSON.stringify({
          eventFromServer: 'newRoomResponse',
          roomId,
          connection1Id,
        })
      );
    }

    // received joinRoom
    if (eventFromClient === 'joinRoomRequest') {
      console.log('joinRoomRequest');
      const { status, connection2Id } = getRoomStatus(joinId);

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
            connection2Id,
            roomId: joinId,
          })
        );
      }
    }
  });

  ws.on('close', () => {
    console.log('connection closed');
  });
});

function createRoom(roomId, connection1Id) {
  allRooms.set(roomId, {
    connection1Id,
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
  return { status: 'joinable', connection2Id: room.connection2Id };
}
