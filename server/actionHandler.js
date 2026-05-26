// actionHandler.js
const CONFIG = require('./config');
const { getPlayer } = require('./roomManager');

const applyDamage = (player, amount) => {
  if (!player) return;
  const effective = Math.max(amount - player.defense, 0);
  player.defense = 0;
  player.hp = Math.max(player.hp - effective, 0);

  if (player.hp === 0) {
    player.alive = false;
  }
};

const handleAttack = (actorId, action) => {
  const targetId = action.targetId;
  if (!targetId) return { success: false, message: '공격할 대상을 지정해야 합니다.' };

  const target = getPlayer(targetId);
  if (!target) return { success: false, message: '공격 대상을 찾을 수 없습니다.' };

  const damage = action.amount || CONFIG.ATTACK_DAMAGE;
  applyDamage(target, damage);

  return {
    success: true,
    type: 'attack',
    actorId,
    targetId: target.id,
    damage,
    targetHp: target.hp,
    targetAlive: target.alive,
    message: `${actorId}님이 ${target.id}님에게 ${damage}만큼 공격했습니다.`
  };
};

const handleDefend = (actorId, action) => {
  const actor = getPlayer(actorId);
  if (!actor) return { success: false, message: '플레이어를 찾을 수 없습니다.' };
  
  actor.defense = CONFIG.DEFEND_AMOUNT;
  return {
    success: true,
    type: 'defend',
    actorId: actor.id,
    defense: actor.defense,
    message: `${actor.id}님이 방어 태세를 갖췄습니다. 다음 공격 피해가 ${actor.defense}만큼 감소합니다.`
  };
};

const handleHeal = (actorId, action) => {
  const actor = getPlayer(actorId);
  if (!actor) return { success: false, message: '플레이어를 찾을 수 없습니다.' };

  const previousHp = actor.hp;
  actor.hp = Math.min(actor.hp + CONFIG.HEAL_AMOUNT, actor.maxHp);
  return {
    success: true,
    type: 'heal',
    actorId: actor.id,
    healedAmount: actor.hp - previousHp,
    currentHp: actor.hp,
    message: `${actor.id}님이 ${actor.hp - previousHp}만큼 회복했습니다. 현재 체력 ${actor.hp}/${actor.maxHp}`
  };
};

const normalizeAction = (payload) => {
  if (typeof payload === 'string') return { type: payload };
  return { type: payload.type, targetId: payload.targetId, amount: payload.amount };
};

const resolveAction = (actorId, action) => {
  switch (action.type) {
    case 'attack': return handleAttack(actorId, action);
    case 'defend': return handleDefend(actorId, action);
    case 'heal': return handleHeal(actorId, action);
    default: return { success: false, message: '알 수 없는 행동입니다.' };
  }
};

module.exports = { normalizeAction, resolveAction };