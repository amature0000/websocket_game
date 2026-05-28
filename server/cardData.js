// 카드 데이터 정의
const CARD_TYPES = {
  ATTACK: 'ATTACK',
  SKILL: 'SKILL'
};

const CARDS = {
  // 공격 카드
  'atk_1': { name: '개머리판', type: CARD_TYPES.ATTACK, value: 5, description: '5의 피해를 줍니다' },
  'atk_suppress': { name: '제압 사격', type: CARD_TYPES.ATTACK, value: 5, description: '5의 피해를 줍니다. 적중 시 대상은 다음 턴 카드를 1장 덜 뽑습니다.' },
  'atk_throw': { name: '집어던지기', type: CARD_TYPES.ATTACK, value: 5, description: '5의 피해를 줍니다. 카드를 1장 뽑습니다.' },
  'atk_tracer': { name: '예광탄', type: CARD_TYPES.ATTACK, value: 5, description: '5의 피해를 줍니다. 이번 턴에 사용하는 다음 공격 카드는 대응할 수 없습니다.' },
  'atk_fire': { name: '사격', type: CARD_TYPES.ATTACK, value: 15, description: '15의 피해를 줍니다' },

  // 방어 카드
  'def_1': { name: '숨기', type: CARD_TYPES.SKILL, value: 5, description: '5의 방어력을 얻습니다' },
  'def_2': { name: '방탄복', type: CARD_TYPES.SKILL, value: 10, description: '10의 방어력을 얻습니다' },
  'def_3': { name: 'k-mark1', type: CARD_TYPES.SKILL, value: 10, description: '5의 방어력을 얻습니다. 체력을 10 회복합니다.' },
  'def_4': { name: '감자 포대', type: CARD_TYPES.SKILL, value: 5, description: '15의 방어력을 얻습니다. 카드를 한 장 버립니다.' },

  // 스킬 카드
  'draw': { name: '공포탄', type: CARD_TYPES.SKILL, value: 2, description: '카드를 2장 뽑습니다.' }
};

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
  CARD_TYPES,
  CARDS,
  getCardById,
  getRandomCard,
  getRandomCards
};
