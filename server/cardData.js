// 카드 데이터 정의
const CARD_TYPES = {
  ATTACK: 'ATTACK',
  SKILL: 'SKILL'
};

const CARDS = {
  // 공격 카드
  'atk_1': { id: 'atk_1', name: '개머리판', type: CARD_TYPES.ATTACK, value: 5, description: '5의 피해를 줍니다' },
  'atk_suppress': { id: 'atk_suppress', name: '제압 사격', type: CARD_TYPES.ATTACK, value: 5, effect: { target_draw: -1, hit_only: true }, description: '5의 피해를 줍니다. 적중 시 대상은 다음 턴 카드를 1장 덜 뽑습니다.' },
  'atk_throw': { id: 'atk_throw', name: '집어던지기', type: CARD_TYPES.ATTACK, value: 5, effect: { actor_draw: 1 }, description: '5의 피해를 줍니다. 카드를 1장 뽑습니다.' },
  'atk_tracer': { id: 'atk_tracer', name: '예광탄', type: CARD_TYPES.ATTACK, value: 5, effect: { actor_range: 999 }, description: '5의 피해를 줍니다. 이번 턴에 사용하는 다음 공격 카드는 적중합니다.' },
  'atk_fire': { id: 'atk_fire', name: '사격', type: CARD_TYPES.ATTACK, value: 15, description: '15의 피해를 줍니다' },

  // 스킬 카드 1
  'def_1': { id: 'def_1', name: '숨기', type: CARD_TYPES.SKILL, effect: { actor_defense: 5 }, description: '5의 방어력을 얻습니다' },
  'def_2': { id: 'def_2', name: '방탄복', type: CARD_TYPES.SKILL, effect: { actor_defense: 10 }, description: '10의 방어력을 얻습니다' },
  'def_3': { id: 'def_3', name: 'k-mark1', type: CARD_TYPES.SKILL, effect: { actor_defense: 10, actor_heal: 10 }, description: '10의 방어력을 얻습니다. 체력을 10 회복합니다.' },
  'def_4': { id: 'def_4', name: '감자 포대', type: CARD_TYPES.SKILL, effect: { actor_defense: 15, actor_discard: 1 }, description: '15의 방어력을 얻습니다. 이다음 사용하는 카드를 무효화합니다.' },

  // 스킬 카드 2
  'draw': { id: 'draw', name: '공포탄', type: CARD_TYPES.SKILL, effect: { actor_draw: 2 }, description: '카드를 2장 뽑습니다.' }
};

const initialDeck = [
  CARDS['atk_1'], CARDS['atk_1'], CARDS['atk_1'],
  CARDS['def_1'], CARDS['def_1'], CARDS['def_1']
]

const getCardById = (cardId) => {
  return CARDS[cardId];
};

const getRandomCard = () => {
  const cardKeys = Object.keys(CARDS);
  const randomKey = cardKeys[Math.floor(Math.random() * cardKeys.length)];
  return CARDS[randomKey];
};

const getRandomCards = (count) => {
  const selected = [];
  for (let i = 0; i < count; i++) {
    selected.push(getRandomCard());
  }
  return selected;
};

module.exports = {
  initialDeck,
  getCardById,
  getRandomCard,
  getRandomCards
};
