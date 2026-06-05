const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const CONFIG = require('./config');
const roomManager = require('./roomManager');
const resolveAction = require('./actionHandler');
const deckManager = require('./deckManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CONFIG.CORS_ORIGIN } });

// ====================
const broadcastToRoom = (roomId, eventName, data) => {
  io.to(roomId).emit(eventName, data);
};

const sendToPlayer = (s, eventName, data) => {
  s.emit(eventName, data);
};

const sendGameInfos = (roomId, msg, action) => {
  const roomInfo = roomManager.getRoomInfo(roomId);
  broadcastToRoom(roomId, msg, {
      action: action,
      roomInfo: roomInfo
  });
};
// playerId를 입력받는 이유: 현재 턴이 아닌 플레이어에게 정보를 넘겨야 해서
const sendHandInfo = (playerId) => {
  const playerHand = deckManager.getPlayerCardInfo(playerId);
  io.to(playerId).emit('hand_info', playerHand);
};
// playerId를 입력받는 이유
const setTurn = (room, roomId, playerId) => { 
  if(!room || !room.isStarted || !playerId) return;
  console.log(`턴 변경: ${playerId} 차례`);

  room.currentPlayerId = playerId;
  deckManager.drawCards(playerId, CONFIG.STARTING_HAND_SIZE);
  deckManager.discoverCards(playerId);
  sendGameInfos(roomId, 'turn_changed', playerId);
  sendHandInfo(playerId);
};

// ====================
io.on('connection', (socket) => {
  console.log(`유저 접속: ${socket.id}`);

  // 방 입장
  socket.on('join_room', (roomId, nickname) => {
    roomManager.initRoom(roomId);
    const result = roomManager.addPlayer(roomId, socket.id, nickname);

    if (!result.success) {
      return sendToPlayer(socket, 'system_message', result.message);
    }

    socket.join(roomId);

    const room = roomManager.getRoom(roomId);
    const isHost = room.turnOrder[0] === socket.id;
    sendToPlayer(socket, 'init_client', { isHost });

    const player = roomManager.getPlayer(socket.id);
    broadcastToRoom(roomId, 'system_message', `${player.name} 님이 입장했습니다. (${room.turnOrder.length}명)`);
  });

  // 게임 시작
  socket.on('start_game', (roomId) => {
    const result = roomManager.startRoom(roomId, socket.id);

    if (!result.success) {
      return sendToPlayer(socket, 'system_message', result.message);
    }

    const room = roomManager.getRoom(roomId);
    broadcastToRoom(roomId, 'game_started');
    setTurn(room, roomId, room.currentPlayerId);
  });

  // 행동 처리
  socket.on('action', (roomId, actionPayload) => {
    const room = roomManager.getRoom(roomId);
    // 유효성 검사
    if (!room || !roomManager.isValidTurn(room, socket.id)) {
      return sendToPlayer(socket, 'system_message', '유효하지 않은 행동입니다.');
    }
    // 행동 처리
    const result = resolveAction(socket.id, actionPayload);

    if (result === null) {
      return sendToPlayer(socket, 'system_message', "유효하지 않은 행동입니다.");
    }
    // 결과 전달
    sendGameInfos(roomId, 'action_result', result);
    sendHandInfo(socket.id);
    // 턴 종료
    if (result.type === 'end_turn') {
      deckManager.endTurn(socket.id);
      const nextPlayerId = roomManager.advanceTurn(room);
      setTurn(room, roomId, nextPlayerId);
    }
  });

  // 연결 종료
  socket.on('disconnect', () => {
    console.log(`유저 퇴장: ${socket.id}`);
    const roomId = roomManager.getPlayer(socket.id)?.roomId;
    const nextPlayerId = roomManager.removePlayer(socket.id);
    deckManager.removePlayer(socket.id);
    broadcastToRoom(roomId, 'system_message', `${socket.id} 님이 퇴장했습니다.`);

    const room = roomManager.getRoom(roomId);
    setTurn(room, roomId, nextPlayerId);
  });
});

// ====================
server.listen(CONFIG.PORT, () => {
  console.log(`웹소켓 서버 작동 중 (Port ${CONFIG.PORT})`);
});