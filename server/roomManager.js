const CONFIG = require('./config');

const rooms = {};
const users = {};

const getPlayer = (playerId) => {
  const roomId = users[playerId];
  if (!roomId) return null;
  const room = rooms[roomId];
  if (!room) return null;
  return room.players.find((player) => player.id === playerId);
};

const createPlayer = (id) => ({
  id,
  hp: CONFIG.BASE_HP,
  maxHp: CONFIG.BASE_HP,
  defense: 0,
  alive: true
});

const getNextAlivePlayerId = (room, fromPlayerId) => {
  if (!room || !room.players || room.players.length === 0) return null;

  const startIndex = room.players.findIndex((player) => player.id === fromPlayerId);
  const total = room.players.length;
  const baseIndex = startIndex >= 0 ? startIndex : 0;

  for (let i = 1; i <= total; i += 1) {
    const nextIndex = (baseIndex + i) % total;
    const nextPlayer = room.players[nextIndex];
    if (nextPlayer && nextPlayer.alive) {
      return nextPlayer.id;
    }
  }

  return null;
};

const advanceTurn = (room) => {
  if (!room || !room.players || room.players.length === 0) return null;
  const currentPlayerId = room.currentPlayerId;
  const nextPlayerId = getNextAlivePlayerId(room, currentPlayerId);
  return nextPlayerId;
};

const isValidTurn = (room, playerId) => {
  if (!room || !room.isStarted || !playerId) return false;
  const currentId = room.currentPlayerId;
  if (!currentId) return false;
  const player = getPlayer(playerId);
  return currentId === playerId && player?.alive;
};

const removePlayer = (playerId) => {
  const roomId = users[playerId];
  if (!roomId) return null;
  const room = rooms[roomId];
  if (!room) return null;

  const index = room.players.findIndex((player) => player.id === playerId);
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
    } else {
      nextPlayerId = room.currentPlayerId;
    }
    
    room.players.splice(index, 1);
  }

  delete users[playerId];
  return nextPlayerId;
};

module.exports = {
  rooms,
  users,
  getPlayer,
  createPlayer,
  advanceTurn,
  isValidTurn,
  removePlayer
};