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

const applyEffects = (actor, target, effectObj) => {
  if (!effectObj) return;

  if (effectObj.actor_defense) {
    applyDefense(actor, effectObj.actor_defense);
  }
  if (effectObj.target_defense) {
    applyDefense(target, effectObj.target_defense);
  }

  if (effectObj.actor_heal) {
    applyHeal(actor, effectObj.actor_heal);
  }
  if (effectObj.target_heal) {
    applyHeal(target, effectObj.target_heal);
  }

  if (effectObj.actor_draw) {
    // TODO: 이번 턴에 적용으로 변경
    actor.pendingEffects.draw = (actor.pendingEffects.draw || 0) + effectObj.actor_draw;
  }
  if (effectObj.target_draw) {
    target.pendingEffects.draw = (target.pendingEffects.draw || 0) + effectObj.target_draw;
  }


  if (effectObj.actor_range) {
    // TODO: 이번 턴에 적용으로 변경
    actor.pendingEffects.range = effectObj.actor_range;
  }
  if (effectObj.target_range) {
    target.pendingEffects.range = effectObj.target_range;
  }

  if (effectObj.actor_discard) {
    actor.pendingEffects.discard = (actor.pendingEffects.discard || 0) + effectObj.actor_discard;
  }
};

// ============

const playCardEffect = (actorId, playedCard, targetId) => {
  const actor = getPlayer(actorId);
  const target = getPlayer(targetId);
  if (!actor || !target) return { success: false, message: '플레이어를 찾을 수 없습니다.' };

  const result = { success: true, type: 'play_card', playedCard, actorId, targetId };

  if (playedCard.type === 'ATTACK') {
    if (!targetId) return { success: false, message: '공격 대상을 지정해야 합니다.' };
    if (!target) return { success: false, message: '공격 대상을 찾을 수 없습니다.' };

    // TODO: 명중률 보정 필요
    const damage = playedCard.value;
    applyDamage(target, damage);
  }
  if (playedCard.effect) {
    applyEffects(actor, target, playedCard.effect);
  }

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