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

  if (effectObj.actor_defense != null) {
    applyDefense(actor, effectObj.actor_defense);
  }
  if (effectObj.target_defense != null) {
    applyDefense(target, effectObj.target_defense);
  }

  if (effectObj.actor_heal != null) {
    applyHeal(actor, effectObj.actor_heal);
  }
  if (effectObj.target_heal != null) {
    applyHeal(target, effectObj.target_heal);
  }

  if (effectObj.actor_draw != null) {
    deckManager.drawCards(actor.id, effectObj.actor_draw);
  }
  if (effectObj.target_draw != null) {
    target.pendingEffects.draw += effectObj.target_draw;
  }

  if (effectObj.actor_range != null) {
    actor.pendingEffects.range = effectObj.actor_range;
  }
  if (effectObj.target_range != null) {
    target.pendingEffects.range = effectObj.target_range;
  }

  if (effectObj.actor_discard != null) {
    actor.pendingEffects.discard += effectObj.actor_discard;
  }
};

// ============

const playCardEffect = (actorId, playedCard, targetId) => {
  const actor = getPlayer(actorId);
  const target = getPlayer(targetId);
  if (!actor || !target) return null;

  const result = { success: true, type: 'play_card', playedCard, actorId, targetId };

  if (playedCard.type === 'ATTACK') {
    if (!targetId) return null;
    if (!target) return null;

    // TODO: 명중률 보정 필요
    // TODO: pendingEffects 계산
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
    return null;
  }

  const result = deckManager.selectDiscoveredCard(actorId, cardIndex);

  if (result === null) {
    return null;
  }

  return {
    success: true,
    type: 'select_card',
    actorId,
    card: result.card
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
      if (handIndex == null) {
        return null;
      }
      const playedCardResult = deckManager.playCard(actorId, handIndex);
      if (playedCardResult === null) {
        return null;
      }
      return playCardEffect(actorId, playedCardResult.card, action.targetId);
    }
    case 'select_card':
      return handleSelectCard(actorId, action);
    case 'end_turn':
      return { success: true, type: 'end_turn', actorId };
    default:
      return null;
  }
};

module.exports = { normalizeAction, resolveAction };