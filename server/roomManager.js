const CONFIG = require('./config');

const rooms = {};
const users = {};

/**
 * 방 초기화
 */
const initRoom = (roomId) => {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      players: {},
      turnOrder: [],
      currentPlayerId: null,
      isStarted: false
    };
  }
};

/**
 * 플레이어 초기화
 */
const createPlayer = (id, nickname) => ({
  id,
  name: nickname,
  hp: CONFIG.BASE_HP,
  maxHp: CONFIG.BASE_HP,
  defense: 0,
  alive: true
});

/***
 * 방에 플레이어 추가
 */
const addPlayer = (roomId, playerId, nickname) => {
  const room = rooms[roomId];
  if (room.turnOrder.length >= CONFIG.MAX_PLAYERS) {
    return { success: false, message: `방이 가득 찼습니다. (최대 ${CONFIG.MAX_PLAYERS}명)` };
  }
  if (users[playerId]) {
    return { success: false, message: '이미 방에 참가 중입니다.' };
  }
  if (!nickname || nickname.trim() === '') {
    return { success: false, message: '닉네임을 입력해주세요.' };
  }
  
  users[playerId] = roomId;
  room.players[playerId] = createPlayer(playerId, nickname);
  room.turnOrder.push(playerId);
  console.log(`[방 ${roomId}] 플레이어 등록: ${playerId} (닉네임: ${nickname})`);

  return { success: true};
};

/***
 * 게임 시작
 */
const startRoom = (roomId, hostId) => {
  const room = rooms[roomId];
  if (!room) return { success: false, message: '방이 존재하지 않습니다.' };
  if (room.isStarted) return { success: false, message: '이미 시작된 방입니다.' };
  if (room.turnOrder.length < CONFIG.MIN_PLAYERS) {
    return { success: false, message: `게임은 적어도 ${CONFIG.MIN_PLAYERS}명이 모여야 시작할 수 있습니다.` };
  }
  if (room.turnOrder[0] !== hostId) {
    return { success: false, message: '방장만 게임을 시작할 수 있습니다.' };
  }

  room.isStarted = true;
  room.currentPlayerId = room.turnOrder[0];
  console.log(`[방 ${roomId}] 게임 시작: 현재 턴 - ${room.currentPlayerId}`);
  return { success: true };
};

/**
 * id로 플레이어 조회
 */
const getPlayer = (playerId) => {
  const roomId = users[playerId];
  if (!roomId) return null;
  const room = rooms[roomId];
  if (!room) return null;
  return room.players[playerId] || null;
};

/**
 * 다음 살아있는 플레이어 아이디 조회
 */
const getNextAlivePlayerId = (room, fromPlayerId) => {
  if (!room || !room.players || room.players.length === 0) return null;

  const startIndex = room.turnOrder.findIndex((id) => id === fromPlayerId);
  const total = room.turnOrder.length;
  const baseIndex = startIndex >= 0 ? startIndex : 0;

  for (let i = 1; i <= total; i += 1) {
    const nextIndex = (baseIndex + i) % total;
    const nextPlayerId = room.turnOrder[nextIndex];
    
    const nextPlayer = room.players[nextPlayerId];
    if (nextPlayer && nextPlayer.alive) {
      return nextPlayer.id;
    }
  }

  return null;
};

/**
 * 턴 진행
 */
const advanceTurn = (room) => {
  if (!room || !room.players || room.players.length === 0) return null;
  const currentPlayerId = room.currentPlayerId;
  const nextPlayerId = getNextAlivePlayerId(room, currentPlayerId);
  return nextPlayerId;
};

/**
 * 턴 유효성 검사
 */
const isValidTurn = (room, playerId) => {
  if (!room || !room.isStarted || !playerId) return false;
  const currentId = room.currentPlayerId;
  if (!currentId) return false;
  const player = getPlayer(playerId);
  return currentId === playerId && player?.alive;
};

/***
 * 게임 정보 조회 - 플레이어 체력 등
 */
const getRoomInfo = (roomId) => {
  const room = rooms[roomId];
  if (!room) return null;
  
  const playersInfo = room.turnOrder.map(playerId => {
    const player = room.players[playerId];
    return {
      id: player.id,
      name: player.name,
      hp: player.hp,
      maxHp: player.maxHp,
      defense: player.defense,
      alive: player.alive
    };
  });

  return {
    roomId,
    players: playersInfo,
    currentPlayerId: room.currentPlayerId,
    isStarted: room.isStarted,
    turnOrder: room.turnOrder
  };
};

/**
 * 방에서 플레이어 제거
 */
const removePlayer = (playerId) => {
  const roomId = users[playerId];
  if (!roomId) return null;
  const room = rooms[roomId];
  if (!room) return null;

  const index = room.turnOrder.findIndex((id) => id === playerId);
  let nextPlayerId = null;

  if (index > -1) {
    const removedCurrent = room.currentPlayerId === playerId;
    console.log(`[방 ${roomId}] 플레이어 제거: ${playerId} (현재 인원: ${room.players.length})`);

    // 방이 빈 경우
    if (room.players.length === 1) {
      delete rooms[roomId];
      delete users[playerId];
      console.log(`[방 ${roomId}] 방 삭제됨`);
      return null;
    }
    // 현재 턴일 때 종료한 경우
    if (removedCurrent) {
      nextPlayerId = getNextAlivePlayerId(room, playerId);
      room.currentPlayerId = nextPlayerId;
    }
    
    delete room.players[playerId];
    room.turnOrder.splice(index, 1);
  }

  delete users[playerId];
  return nextPlayerId;
};

module.exports = {
  rooms,
  users,
  initRoom,
  addPlayer,
  startRoom,
  getPlayer,
  advanceTurn,
  isValidTurn,
  getRoomInfo,
  removePlayer
};