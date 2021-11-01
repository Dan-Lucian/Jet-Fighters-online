const WebSocket=require("ws");const{createId}=require("./helpers");const{supportedJetCollors,supportedJetTypes,supportedMaxWidth,supportedMinWidth,supportedMaxHeight,supportedMinHeight,supportedMaxScore,supportedMinScore}=require("./constants.js");const{createGameState,startGameLoop,updatePlayerServerGameState,getPlayerValueFromGameState}=require("./game.js");const server=new WebSocket.Server({port:process.env.PORT||"3000"});const allRooms=new Map;server.on("connection",ws=>{function sendToClient(objectData){ws.send(JSON.stringify(objectData))}ws.on("message",messageString=>{const jsonFromFront=JSON.parse(messageString);const{eventFromClient}=jsonFromFront;if(eventFromClient==="keyPressed"){const{keysStatus,playerNumber}=jsonFromFront;const jsonKeysStatus=JSON.parse(keysStatus);Object.keys(jsonKeysStatus).forEach(prop=>{updatePlayerServerGameState(ws.connectionId,playerNumber,prop,jsonKeysStatus[prop])});return}if(eventFromClient==="countdownFinished"){const p1ActualSpeed=getPlayerValueFromGameState(ws.connectionId,"p1","actualSpeed");updatePlayerServerGameState(ws.connectionId,"p1","speed",p1ActualSpeed);const p2ActualSpeed=getPlayerValueFromGameState(ws.connectionId,"p2","actualSpeed");updatePlayerServerGameState(ws.connectionId,"p2","speed",p2ActualSpeed);return}if(eventFromClient==="requestNewRoom"){console.log(`requestNewRoom`);const{gameSettings}=jsonFromFront;if(!isNewGameDataValid(gameSettings)){sendToClient({eventFromServer:"invalidNewGameForm"});return}const roomId=`r${createId(5)}`;gameSettings.p1JetCharacteristics=gameSettings.jetCharacteristics;delete gameSettings.jetCharacteristics;createRoom(roomId,gameSettings,ws);ws.connectionId=roomId;sendToClient({eventFromServer:"responseNewRoom",roomId:roomId});return}if(eventFromClient==="requestJoinRoom"){console.log("requestJoinRoom");const{joinId}=jsonFromFront;const{roomStatus}=getRoomStatus(joinId);if(roomStatus==="notFound"){console.log("Room notFound");sendToClient({eventFromServer:"denialJoinRoom",reason:"denial-not-found"});return}if(roomStatus==="full"){console.log("full");sendToClient({eventFromServer:"denialJoinRoom",reason:"denial-full"});return}if(roomStatus==="joinable"){console.log("joinable");const{gameSettings}=jsonFromFront;if(!isJoinGameDataValid(gameSettings)){sendToClient({eventFromServer:"invalidJoinGameForm"});return}ws.connectionId=joinId;gameSettings.p2JetCharacteristics=gameSettings.jetCharacteristics;delete gameSettings.jetCharacteristics;joinRoom(joinId,gameSettings,ws);const copyGameSettings=JSON.parse(JSON.stringify(allRooms.get(joinId).gameSettings));const gameState=createGameState(copyGameSettings);const{ws1}=allRooms.get(joinId);ws1.intervalId=startGameLoop(ws1,ws,gameState);ws.intervalId=ws1.intervalId;return}}if(eventFromClient==="requestPlayAgain"){const{gameSettings}=jsonFromFront;const{ws1,ws2}=allRooms.get(ws.connectionId);const otherWs=ws===ws1?ws2:ws1;otherWs.send(JSON.stringify({eventFromServer:"askPlayAgain"}));gameSettings.p1JetCharacteristics=gameSettings.jetCharacteristics;delete gameSettings.jetCharacteristics;createRoom(ws.connectionId,gameSettings,ws,otherWs);return}if(eventFromClient==="responseAskPlayAgain"){const{acceptPlayAgain}=jsonFromFront;if(acceptPlayAgain){const{gameSettings}=jsonFromFront;gameSettings.p2JetCharacteristics=gameSettings.jetCharacteristics;delete gameSettings.jetCharacteristics;joinRoom(ws.connectionId,gameSettings,ws);const copyGameSettings={...allRooms.get(ws.connectionId).gameSettings};const gameState=createGameState(copyGameSettings);const{ws1}=allRooms.get(ws.connectionId);ws1.intervalId=startGameLoop(ws1,ws,gameState);ws.intervalId=ws1.intervalId;return}const{connectionId}=ws;sendRoomDestroyedAndRemoveIds(connectionId,"rematch-declined");allRooms.delete(connectionId);console.log(`room ${connectionId} destroyed`);return}if(eventFromClient==="exitRoom"){sendToClient({eventFromServer:"roomDestroyed"});const{ws1,ws2}=allRooms.get(ws.connectionId);const otherWs=ws===ws1?ws2:ws1;otherWs.send(JSON.stringify({eventFromServer:"roomDestroyed",reason:"other-exit"}));const{connectionId}=ws;removeIds(connectionId);allRooms.delete(connectionId);console.log(`room ${connectionId} destroyed`);return}console.log(`unknown client request received: ${eventFromClient}`)});ws.on("close",()=>{console.log("connection closed");if(!ws.connectionId)return;const{connectionId}=ws;sendRoomDestroyedAndRemoveIds(connectionId,"disconnect");clearInterval(ws.intervalId);allRooms.delete(connectionId);console.log(`room ${connectionId} destroyed`)})});function createRoom(roomId,gameSettings,ws1,ws2=null){gameSettings.settings.roomId=roomId;allRooms.set(roomId,{ws1:ws1,ws2:ws2,gameSettings:{...gameSettings}});console.log("room created")}function joinRoom(roomId,additionalGameSettings,ws2){const{ws1,gameSettings}=allRooms.get(roomId);allRooms.set(roomId,{ws1:ws1,ws2:ws2,gameSettings:{...gameSettings,...additionalGameSettings}})}function getRoomStatus(id){if(!id){console.log("No ID provided for checking the room status");return}const room=allRooms.get(id);if(!room)return{roomStatus:"notFound"};if(room.ws2)return{roomStatus:"full"};return{roomStatus:"joinable"}}function sendRoomDestroyedAndRemoveIds(roomId,reason){if(!allRooms.get(roomId)){console.log("attempted to destroy a non existent room");return}for(const wsFromRoom of Object.values(allRooms.get(roomId))){if(wsFromRoom&&!wsFromRoom.p1JetCharacteristics){wsFromRoom.send(JSON.stringify({eventFromServer:"roomDestroyed",reason:reason}));wsFromRoom.connectionId=null}}}function removeIds(roomId){for(const wsFromRoom of Object.values(allRooms.get(roomId))){console.log(`connection id: ${wsFromRoom.connectionId}`);wsFromRoom.connectionId=null}}function isNewGameDataValid(gameState){if(!gameState)return false;if(!gameState.settings||!gameState.jetCharacteristics)return false;if(!gameState.settings.maxScore||!gameState.settings.mapWidth||!gameState.settings.mapHeight||!gameState.jetCharacteristics.color||!gameState.jetCharacteristics.jetType)return false;const{maxScore,mapWidth,mapHeight}=gameState.settings;const{color,jetType}=gameState.jetCharacteristics;if(Number.isNaN(maxScore)||maxScore<supportedMinScore||maxScore>supportedMaxScore)return false;if(Number.isNaN(mapWidth)||mapWidth<supportedMinWidth||mapWidth>supportedMaxWidth)return false;if(Number.isNaN(mapHeight)||mapHeight<supportedMinHeight||mapHeight>supportedMaxHeight)return false;if(!supportedJetCollors.includes(color))return false;if(!supportedJetTypes.includes(jetType))return false;return true}function isJoinGameDataValid(gameState){if(!gameState)return false;if(!gameState.jetCharacteristics)return false;if(!gameState.jetCharacteristics.color||!gameState.jetCharacteristics.jetType)return false;const{color,jetType}=gameState.jetCharacteristics;if(!supportedJetCollors.includes(color))return false;if(!supportedJetTypes.includes(jetType))return false;return true}