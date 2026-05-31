const { CARDS, getRandomCards, getCardById } = require('./cardData');
const { getPlayer } = require('./roomManager');

const playerDeck = {}; // 플레이어 덱
const playerDeckThisRound = {}; // 플레이어 덱(드로우한 카드 제외)
const playerCurrentHand = {}; // 플레이어 손패
const playerDiscoveringCards = {}; // 카드 발견 제시

/**
 * 플레이어 초기화
 */
const initializePlayer = (playerId) => {
    if (!playerDeck[playerId]) {
        playerDeck[playerId] = [CARDS['atk_1'], CARDS['def_1'], CARDS['atk_1'], CARDS['def_1'], CARDS['atk_1'], CARDS['def_1']];
    }
    if (!playerCurrentHand[playerId]) {
        playerCurrentHand[playerId] = [];
    }
    if (!playerDeckThisRound[playerId]) {
        playerDeckThisRound[playerId] = [...playerDeck[playerId]];
    }
};

/**
 * 덱에서 랜덤하게 n장을 드로우해서 손패로 저장
 */
const drawCards = (playerId, amount) => {
    initializePlayer(playerId);

    const player = getPlayer(playerId);
    if (!player) return [];
    
    // pendingEffects 계산
    let drawAmount = amount + (player.pendingEffects?.draw || 0);
    if (player.pendingEffects?.draw) {
        delete player.pendingEffects.draw;
    }

    const deck = playerDeckThisRound[playerId];
    const finalDrawAmount = Math.min(drawAmount, deck.length);
    if (finalDrawAmount <= 0) return [];

    const newHand = new Array(finalDrawAmount);
    for (let i = 0; i < finalDrawAmount; i++) {
        const lastIndex = deck.length - 1;
        const randomIndex = Math.floor(Math.random() * deck.length);

        newHand[i] = deck[randomIndex];
        deck[randomIndex] = deck[lastIndex];
        deck.pop();
    }

    const currentHand = playerCurrentHand[playerId];
    playerCurrentHand[playerId] = [...currentHand, ...newHand];

    return newHand;
};

/**
 * 카드 발견: 카드 풀에서 3장의 랜덤 카드를 플레이어에게 제시
 */
const discoverCards = (playerId) => {
    const discoveredCards = getRandomCards(3);
    playerDiscoveringCards[playerId] = discoveredCards;

    return discoveredCards;
};

/**
 * 발견한 카드 중 하나를 선택하여 자신의 덱에 추가
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
    playerDeckThisRound[playerId].push(selectedCard);
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
        card: playedCard
    };
};

/**
 * 손패 초기화
 */
const endTurn = (playerId) => {
    playerCurrentHand[playerId] = [];
    playerDeckThisRound[playerId] = [...playerDeck[playerId]];
    
    const { getPlayer } = require('./roomManager');
    const player = getPlayer(playerId);
    if (player) {
        player.pendingEffects = {};
    }
};

/**
 * 플레이어 제거
 */
const removePlayer = (playerId) => {
    delete playerDeck[playerId];
    delete playerCurrentHand[playerId];
    delete playerDiscoveringCards[playerId];
    delete playerDeckThisRound[playerId];
};

/**
 * 플레이어의 전체 카드 정보 조회
 */
const getPlayerCardInfo = (playerId) => {
    return {
        cardPool: playerDeck[playerId],
        currentHand: playerCurrentHand[playerId],
        discoveringCards: playerDiscoveringCards[playerId] || null
    };
};

module.exports = {
    drawCards,
    discoverCards,
    selectDiscoveredCard,
    playCard,
    endTurn,
    removePlayer,
    getPlayerCardInfo
};
