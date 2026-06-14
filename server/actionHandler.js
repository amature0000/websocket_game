// actionHandler.js
const CONFIG = require('./config');
const { getPlayer, getDistance, killPlayer } = require('./roomManager');
const deckManager = require('./deckManager');
// ============

const applyDamage = (player, amount) => {
  if (!player) return;
  const dmg = Math.max(amount - player.defense, 0);
  player.defense = Math.max(player.defense - amount, 0);
  player.hp = Math.max(player.hp - dmg, 0);
  if (player.hp === 0) killPlayer(player.id);
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

const applyEffects = (actor, target, effectObj, isHit) => {
  if (!effectObj) return;
  if (effectObj.hit_only && isHit) return;

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
    target.pendingEffects.draw = (target.pendingEffects.draw ?? 0) + effectObj.target_draw;
  }

  if (effectObj.actor_range != null) {
    actor.pendingEffects.range = effectObj.actor_range;
  }
  if (effectObj.target_range != null) {
    target.pendingEffects.range = effectObj.target_range;
  }

  if (effectObj.actor_discard != null) {
    actor.pendingEffects.discard = (actor.pendingEffects.discard ?? 0) + effectObj.actor_discard;
  }
};

// ============

const playCard = (actorId, handIndex, targetId) => {
  const actor = getPlayer(actorId);
  const target = getPlayer(targetId);
  if (!actor || !target) return null;
  if (actor.roomId !== target.roomId) return null;

  const playedCard = deckManager.playCard(actorId, handIndex);
  if (playedCard === null) return null;

  // pendingEffects 계산
  if (actor.pendingEffects.discard) {
    actor.pendingEffects.discard -= 1;
    return { success: true, type: 'discard_card', playedCard, actorId, targetId };
  }

  const result = { success: true, type: 'play_card', playedCard, actorId, targetId };

  if (playedCard.type === 'ATTACK') {
    if (!targetId) return null;
    if (!target) return null;

    const distance = getDistance(actorId, targetId);
    // pendingEffects 계산
    const actorRange = actor.range + (actor.pendingEffects.range ?? actor.range);
    if (actor.pendingEffects.range) {
      delete actor.pendingEffects.range;
    }
    // 명중률 계산
    let hitRate = 1.0;
    if (distance > actorRange) {
      hitRate = 1 - ((distance - actorRange) / (distance + 1));
    }
    // 명중 계산
    const isHit = Math.random() < hitRate;
    if (isHit) {
      applyDamage(target, playedCard.value);
    }
    result.success = isHit;
  }
  if (playedCard.effect) {
    applyEffects(actor, target, playedCard.effect, result.success);
  }

  return result;
};

const handleSelectCard = (actorId, action) => {
  const cardIndex = action.cardIndex;
  if (cardIndex === undefined || cardIndex === null) {
    return null;
  }

  const selectedCard = deckManager.selectDiscoveredCard(actorId, cardIndex);

  if (selectedCard === null) {
    return null;
  }

  return {
    success: true,
    type: 'select_card',
    actorId,
    card: selectedCard
  };
};

const resolveAction = (actorId, action) => {
  switch (action.type) {
    case 'play_card': {
      if (action.handIndex == null) return null;
      return playCard(actorId, action.handIndex, action.targetId);
    }
    case 'select_card':
      return handleSelectCard(actorId, action);
    default:
      return null;
  }
};

module.exports = resolveAction;