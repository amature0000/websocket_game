const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const CONFIG = require('./config');
const roomManager = require('./roomManager');
const { normalizeAction, resolveAction } = require('./actionHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CONFIG.CORS_ORIGIN } });

const broadcastToRoom = (roomId, eventName, data) => {
  io.to(roomId).emit(eventName, data);
};

io.on('connection', (socket) => {
  console.log(`유저 접속: ${socket.id}`);

  // 방 입장
  socket.on('join_room', (roomId) => {
    if (roomManager.users[socket.id])
      return socket.emit('system_message', '이미 다른 방에 참가 중입니다.');

    roomManager.users[socket.id] = roomId;
    if (!roomManager.rooms[roomId]) {
      roomManager.rooms[roomId] = { 
        players: [], 
        currentPlayerId: null, 
        isStarted: false 
      };
    }

    const room = roomManager.rooms[roomId];
    if (roomManager.getPlayer(socket.id))
      return socket.emit('system_message', '이미 이 방에 참가 중입니다.');
    if (room.players.length >= CONFIG.MAX_PLAYERS) 
      return socket.emit('system_message', `방이 가득 찼습니다. (최대 ${CONFIG.MAX_PLAYERS}명)`);

    socket.join(roomId);
    room.players.push(roomManager.createPlayer(socket.id));
    console.log(`[방 ${roomId}] 플레이어 등록: ${socket.id}`);

    const isHost = room.players[0].id === socket.id;
    socket.emit('init_client', { isHost });

    broadcastToRoom(roomId, 'system_message', `${socket.id} 님이 입장했습니다. (${room.players.length})`);
  });

  // 게임 시작
  socket.on('start_game', (roomId) => {
    const room = roomManager.rooms[roomId];
    if (!room) return;

    if (room.players.length < CONFIG.MIN_PLAYERS) {
      return socket.emit('system_message', `게임은 적어도 ${CONFIG.MIN_PLAYERS}명이 모여야 시작할 수 있습니다.`);
    }

    room.isStarted = true;
    room.currentPlayerId = room.players[0]?.id || null;

    broadcastToRoom(roomId, 'game_started', room.currentPlayerId);
    broadcastToRoom(roomId, 'system_message', '게임이 시작되었습니다!');
  });

  // 행동 처리
  socket.on('action', (roomId, actionPayload) => {
    const room = roomManager.rooms[roomId];
    console.log(roomManager.users, room.currentPlayerId, room?.players?.length);
    if (!room || !roomManager.isValidTurn(room, socket.id)) {
      return socket.emit('system_message', '유효하지 않은 행동입니다.');
    }

    const action = normalizeAction(actionPayload);
    const result = resolveAction(socket.id, action);

    if (!result.success) {
      return socket.emit('system_message', result.message);
    }

    const nextPlayerId = roomManager.advanceTurn(room);

    broadcastToRoom(roomId, 'action_result', result);
    if (nextPlayerId) {
      broadcastToRoom(roomId, 'turn_changed', nextPlayerId);
      room.currentPlayerId = nextPlayerId;
    }

    if (result.message) {
      broadcastToRoom(roomId, 'system_message', result.message);
    }
  });

  // 연결 종료
  socket.on('disconnect', () => {
    console.log(`유저 퇴장: ${socket.id}`);
    const roomId = roomManager.users[socket.id];
    const nextPlayerId = roomManager.removePlayer(socket.id);
    broadcastToRoom(roomId, 'system_message', `${socket.id} 님이 퇴장했습니다.`);

    const room = roomManager.rooms[roomId];
    if (room?.isStarted && nextPlayerId) {
      broadcastToRoom(roomId, 'turn_changed', nextPlayerId);
    }
  });
});

server.listen(CONFIG.PORT, () => {
  console.log(`웹소켓 서버 작동 중 (Port ${CONFIG.PORT})`);
});