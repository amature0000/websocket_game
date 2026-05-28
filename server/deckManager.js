const { CARDS, getRandomCards, getCardById } = require('./cardData');

const playerDeck = {};
const playerCurrentHand = {};
const playerDiscoveringCards = {};

/**
 * 플레이어 초기화
 */
const initializePlayer = (playerId) => {
    if (!playerDeck[playerId]) {
        playerDeck[playerId] = [CARDS.atk_1, CARDS.def_1, CARDS.atk_1, CARDS.def_1, CARDS.atk_1, CARDS.def_1];
    }
    if (!playerCurrentHand[playerId]) {
        playerCurrentHand[playerId] = [];
    }
};

/**
 * 플레이어의 보유 카드 풀 조회
 */
const getPlayerCardPool = (playerId) => {
    return playerDeck[playerId] || [];
};

/**
 * 플레이어의 현재 손패
 */
const getCurrentHand = (playerId) => {
    return playerCurrentHand[playerId] || [];
};

/**
 * 카드 풀에서 랜덤하게 n장을 드로우해서 손패로 저장
 */
const drawCards = (playerId, amount) => {
    initializePlayer(playerId);

    const newHand = getRandomCards(amount);
    playerCurrentHand[playerId] = newHand;

    return newHand;
};

/**
 * 카드 발견: 3장의 랜덤 카드를 플레이어에게 제시
 */
const discoverCards = (playerId) => {
    const discoveredCards = getRandomCards(3);
    playerDiscoveringCards[playerId] = discoveredCards;

    return discoveredCards;
};

/**
 * 발견한 카드 중 하나를 선택하여 자신의 카드 풀에 추가
 */
const selectDiscoveredCard = (playerId, cardIndex) => {
    if (!playerDiscoveringCards[playerId] || playerDiscoveringCards[playerId].length === 0) {
        return { success: false, message: '유효하지 않은 행동 - selectDiscoveredCard 1' };
    }

    if (cardIndex < 0 || cardIndex >= playerDiscoveringCards[playerId].length) {
        return { success: false, message: '유효하지 않은 행동 - selectDiscoveredCard 2' };
    }

    const selectedCard = playerDiscoveringCards[playerId][cardIndex];

    playerDeck[playerId].push(selectedCard);
    delete playerDiscoveringCards[playerId];

    return {
        success: true,
        message: `카드 "${selectedCard.name}"을(를) 획득했습니다!`,
        card: selectedCard
    };
};

/**
 * 현재 손패에서 카드를 선택하여 플레이
 */
const playCard = (playerId, handIndex) => {
    const hand = playerCurrentHand[playerId];

    if (handIndex < 0 || handIndex >= hand.length) {
        return { success: false, message: '유효하지 않은 행동 - playCard' };
    }

    const playedCard = hand[handIndex];

    // 손패에서 제거
    hand.splice(handIndex, 1);

    return {
        success: true,
        card: playedCard,
        message: `카드 "${playedCard.name}"을(를) 플레이했습니다!`
    };
};

/**
 * 손패 초기화
 */
const endTurn = (playerId) => {
    playerCurrentHand[playerId] = [];
};

/**
 * 플레이어 제거
 */
const removePlayer = (playerId) => {
    delete playerDeck[playerId];
    delete playerCurrentHand[playerId];
    delete playerDiscoveringCards[playerId];
};

/**
 * 플레이어의 전체 카드 정보 조회
 */
const getPlayerCardInfo = (playerId) => {
    return {
        cardPool: getPlayerCardPool(playerId),
        currentHand: getCurrentHand(playerId),
        discoveringCards: playerDiscoveringCards[playerId] || null
    };
};

module.exports = {
    getPlayerCardPool,
    getCurrentHand,
    drawCards,
    discoverCards,
    selectDiscoveredCard,
    playCard,
    endTurn,
    removePlayer,
    getPlayerCardInfo
};
