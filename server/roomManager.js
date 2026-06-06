const CONFIG = require('./config');

const rooms = new Map();
const globalUsers = new Map();

/**
 * 방 초기화
 */
const initRoom = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: {},
      turnOrder: [],
      currentPlayerId: null,
      isStarted: false,
      alive: true,
      pendingEffects: {}
    });
  }
};

/**
 * 플레이어 초기화
 */
const createPlayer = (id, nickname, roomId) => ({
  id,
  roomId,
  name: nickname,
  hp: CONFIG.BASE_HP,
  maxHp: CONFIG.BASE_HP,
  defense: 0,
  range: 0,
  alive: true,
  pendingEffects: {}
});

/***
 * 방에 플레이어 추가
 */
const addPlayer = (roomId, playerId, nickname) => {
  const room = rooms.get(roomId);
  if (!room) return { success: false, message: 'NO_ROOM' };
  if (room.turnOrder.length >= CONFIG.MAX_PLAYERS) return { success: false, message: 'MAX_ROOM' };
  
  if (globalUsers.has(playerId)) {
    return { success: false, message: 'DUP_CHK' };
  }
  if (!nickname || nickname.trim() === '') return { success: false, message: 'NO_NICK' };
  
  const newPlayer = createPlayer(playerId, nickname, roomId);
  room.players[playerId] = newPlayer;
  globalUsers.set(playerId, newPlayer);
  
  room.turnOrder.push(playerId);
  console.log(`[방 ${roomId}] 플레이어 등록: ${playerId} (닉네임: ${nickname})`);

  return { success: true };
};
/***
 * 게임 시작
 */
const startRoom = (roomId, hostId) => {
  const room = rooms.get(roomId);
  if (!room) return { success: false, message: 'NO_ROOM' };
  if (room.isStarted) return { success: false, message: 'DUP_START' };
  if (room.turnOrder.length < CONFIG.MIN_PLAYERS) {
    return { success: false, message: `MIN_PLAYERS` };
  }
  if (room.turnOrder[0] !== hostId) {
    return { success: false, message: 'HOST_ONLY' };
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
  return globalUsers.get(playerId) || null;
};

const getRoom = (roomId) => {
  return rooms.get(roomId) || null;
}

/**
 * 플레이어 거리 정보 반환
 */
const getDistance = (playerId1, playerId2) => {
  const player1 = getPlayer(playerId1);
  if (!player1) return null;
  
  const room = rooms.get(player1.roomId);
  if (!room) return null;

  const idx1 = room.turnOrder.indexOf(playerId1);
  const idx2 = room.turnOrder.indexOf(playerId2);
  if (idx1 === -1 || idx2 === -1) return null;

  return Math.abs(idx1 - idx2);
};

/**
 * 다음 턴 플레이어 아이디 조회
 */
const getNextTurnPlayerId = (room, fromPlayerId) => {
  if (!room || room.turnOrder.length === 0) return null;

  const startIndex = room.turnOrder.indexOf(fromPlayerId);
  if (startIndex === -1) return null;
  const total = room.turnOrder.length;
  return room.turnOrder[(startIndex + 1) % total];
};

/**
 * 턴 진행
 */
const advanceTurn = (room) => {
  if (!room || room.turnOrder.length === 0) return null;
  const currentPlayerId = room.currentPlayerId;
  const nextPlayerId = getNextTurnPlayerId(room, currentPlayerId);
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
 * 플레이어 거리 정보 반환
 */
const getDistance = (playerId1, playerId2) => {
  const room = rooms.get(getPlayer(playerId1)?.roomId);
  if (!room) return null;

  let idx1 = room.turnOrder.indexOf(playerId1);
  let idx2 = room.turnOrder.indexOf(playerId2);
  if (idx1 === -1 || idx2 === -1) return null;

  const dist = Math.abs(idx1 - idx2);
  return dist;
};

/***
 * 게임 정보 조회 - 플레이어 체력 등
 */
const getRoomInfo = (roomId) => {
  const room = rooms.get(roomId);
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

const removePlayer = (playerId) => {
  const player = globalUsers.get(playerId);
  if (!player) return null;
  
  const roomId = player.roomId;
  const room = rooms.get(roomId);
  // 방이 없으면 유저 정보 삭제
  if (!room) {
    globalUsers.delete(playerId);
    return null;
  }
  // 플레이어가 한 명 남았다면 방 삭제
  // TODO: 게임 종료 로직 관련 구현, 관전 플레이어를 위해 turnOrder 대신 새로운 방법 추가
  if (room.turnOrder.length <= 1) {
    globalUsers.delete(playerId);
    rooms.delete(roomId);
    console.log(`[방 ${roomId}] 삭제됨`);
    return null;
  }
  // 플레이어 제거 전 턴 처리
  const removedCurrent = room.currentPlayerId === playerId;
  let nextPlayerId = null;
  if (removedCurrent) {
    nextPlayerId = getNextTurnPlayerId(room, playerId);
    room.currentPlayerId = nextPlayerId;
  }
  // 플레이어 제거
  console.log(`[방 ${roomId}] 플레이어 제거: ${playerId} (현재 인원: ${room.turnOrder.length})`);
  room.turnOrder = room.turnOrder.filter(id => id !== playerId);
  delete room.players[playerId];
  globalUsers.delete(playerId);

  return nextPlayerId;
};

module.exports = {
  initRoom,
  addPlayer,
  startRoom,
  getPlayer,
  getRoom,
  getDistance,
  advanceTurn,
  isValidTurn,
  getRoomInfo,
  removePlayer
};