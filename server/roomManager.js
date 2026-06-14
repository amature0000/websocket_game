const CONFIG = require('./config');

const rooms = new Map();
const globalUsers = new Map();

/**
 * 방 초기화
 */
const initRoom = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      playersId: [], // 접속중인 플레이어 ID
      turnOrder: [], // 접속중인 플레이어 ID (alive)
      currentPlayerId: null, // 현재 턴인 플레이어 ID
      isStarted: false
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
  pendingEffects: {}
});

/***
 * 방에 플레이어 추가
 */
const addPlayer = (roomId, playerId, nickname) => {
  const room = rooms.get(roomId);
  if (!room) return { success: false, message: 'NO_ROOM' };
  if (room.isStarted) return { success: false, message: 'LATE' };
  if (room.playersId.length >= CONFIG.MAX_PLAYERS) return { success: false, message: 'MAX_ROOM' };

  if (globalUsers.has(playerId)) {
    return { success: false, message: 'DUP_CHK' };
  }
  if (!nickname || nickname.trim() === '') return { success: false, message: 'NO_NICK' };

  const newPlayer = createPlayer(playerId, nickname, roomId);
  globalUsers.set(playerId, newPlayer);

  room.playersId.push(playerId);
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
  if (room.playersId.length < CONFIG.MIN_PLAYERS) {
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

/***
 * id로 방 조회
 */
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
const getNextTurnPlayerId = (room) => {
  if (!room || room.turnOrder.length === 0) return null;

  const startIndex = room.turnOrder.indexOf(room.currentPlayerId);
  if (startIndex === -1) return null;
  return room.turnOrder[(startIndex + 1) % room.turnOrder.length];
};

/**
 * 턴 유효성 검사
 */
const isValidTurn = (room, playerId) => {
  if (!room || !room.isStarted || !playerId) return false;
  return room.currentPlayerId === playerId && room.turnOrder.includes(playerId);
};

/***
 * 게임 정보 조회 - 플레이어 체력 등
 */
const getRoomInfo = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return null;

  const playersInfo = room.playersId.map(playerId => {
      const player = globalUsers.get(playerId);
      if (!player) return null;

      const { id, name, hp, maxHp, defense } = player;
      return { id, name, hp, maxHp, defense };
    }).filter(Boolean);

  return {
    roomId,
    players: playersInfo,
    currentPlayerId: room.currentPlayerId,
    isStarted: room.isStarted,
    turnOrder: room.turnOrder
  };
};

const killPlayer = (playerId) => {
  const player = globalUsers.get(playerId);
  if (!player) return;

  const room = rooms.get(player.roomId);
  if (!room) return;
  // turnOrder에서 제거
  room.turnOrder = room.turnOrder.filter(id => id !== playerId);
  console.log(`[방 ${room.roomId}] 플레이어 사망: ${playerId}`);
}

const removePlayer = (playerId) => {
  const player = globalUsers.get(playerId);
  if (!player) return null;

  const room = rooms.get(player.roomId);
  if (!room) {
    globalUsers.delete(playerId);
    return null;
  }
  // 플레이어 제거 전 턴 처리
  let nextPlayerId = null;
  if (room.currentPlayerId === playerId) {
    room.currentPlayerId = getNextTurnPlayerId(room);
  }
  // 플레이어 제거
  globalUsers.delete(playerId);
  if (room.turnOrder.includes(playerId)) {
    room.turnOrder = room.turnOrder.filter(id => id !== playerId);
  }
  room.playersId = room.playersId.filter(id => id !== playerId);

  console.log(`[방 ${player.roomId}] 플레이어 제거: ${playerId}`);
  // 플레이어가 없으면 방 삭제
  console.log(rooms);
  if (room.turnOrder.length < 1) {
    rooms.delete(player.roomId);
    console.log(`[방 ${player.roomId}] 삭제됨`);
    return null;
  }
  return nextPlayerId;
};

const resetRoom = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.turnOrder = room.playersId.slice();
  room.currentPlayerId = room.turnOrder[0];
  room.isStarted = false;
  room.playersId.forEach(playerId => {
    const player = globalUsers.get(playerId);
    if (player) {
      player.hp = CONFIG.BASE_HP;
      player.defense = 0;
      player.range = 0;
      player.pendingEffects = {};
    }
  });
}

module.exports = {
  initRoom,
  addPlayer,
  startRoom,
  getPlayer,
  getRoom,
  getDistance,
  getNextTurnPlayerId,
  isValidTurn,
  getRoomInfo,
  removePlayer,
  killPlayer,
  resetRoom
};