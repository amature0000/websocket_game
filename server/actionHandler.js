// actionHandler.js
const CONFIG = require('./config');
const { getPlayer } = require('./roomManager');
const deckManager = require('./deckManager');
// ============

const applyDamage = (player, amount) => {
  if (!player) return;
  const dmg = Math.max(amount - player.defense, 0);
  player.defense = Math.max(player.defense - amount, 0);
  player.hp = Math.max(player.hp - dmg, 0);

  if (player.hp === 0) {
    player.alive = false;
  }
};

const applyDefense = (player, amount) => {
  if (!player) return;
  player.defense += amount;
};

const applyHeal = (player, amount) => {
  if (!player) return;
  const previousHp = player.hp;
  player.hp = Math.min(player.hp + amount, player.maxHp);
};

// ============

const playCardEffect = (actorId, playedCard, targetId) => {
  const actor = getPlayer(actorId);
  if (!actor) return { success: false, message: '플레이어를 찾을 수 없습니다.' };

  const cardId = playedCard.id;

  const result = { success: true, type: 'play_card', playedCard, targetId };
  const effects = {};

  if (playedCard.type === 'ATTACK') {
    if (!targetId) return { success: false, message: '공격 대상을 지정해야 합니다.' };
    const target = getPlayer(targetId);
    if (!target) return { success: false, message: '공격 대상을 찾을 수 없습니다.' };

    // TODO: 명중률 보정 필요
    const damage = playedCard.value;
    applyDamage(target, damage);
  }
  // TODO: switch문으로 판별하지 말고, cardData.CARDS의 effect 필드 사용
  switch (cardId) {
    case 'atk_suppress':
      // 대상이 다음 턴 카드 드로우 -1
      effects.target_draw += -1;
      break;
    case 'atk_throw':
      // 액터가 카드 1장 추가 드로우
      effects.actor_draw += 1;
      break;
    case 'atk_tracer':
      // 액터의 다음 공격 카드 명중
      effects.actor_range = 999;
      break;
  }
  result.effects = Object.entries(effects);
  return result;
};

const handleSelectCard = (actorId, action) => {
  const cardIndex = action.cardIndex;
  if (cardIndex === undefined || cardIndex === null) {
    return { success: false, message: '카드 인덱스가 지정되지 않았습니다.' };
  }

  const result = deckManager.selectDiscoveredCard(actorId, cardIndex);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    type: 'select_card',
    actorId,
    card: result.card,
    message: result.message
  };
};

const normalizeAction = (payload) => {
  if (typeof payload === 'string') return { type: payload };
  return {
    type: payload.type,
    targetId: payload.targetId,
    amount: payload.amount,
    cardIndex: payload.cardIndex, // 카드 선택 인덱스
    handIndex: payload.handIndex // 카드 플레이 인덱스
  };
};

const resolveAction = (actorId, action) => {
  switch (action.type) {
    case 'play_card': {
      const handIndex = action.handIndex;
      if (handIndex === undefined || handIndex === null) {
        return { success: false, message: '카드 인덱스가 지정되지 않았습니다.' };
      }
      const playedCardResult = deckManager.playCard(actorId, handIndex);
      if (!playedCardResult.success) {
        return playedCardResult;
      }
      return playCardEffect(actorId, playedCardResult.card, action.targetId);
    }
    case 'select_card':
      return handleSelectCard(actorId, action);
    case 'end_turn':
      return { success: true, type: 'end_turn', actorId, message: `${actorId} 턴 종료` };
    default:
      return { success: false, message: '알 수 없는 행동입니다.' };
  }
};

module.exports = { normalizeAction, resolveAction };