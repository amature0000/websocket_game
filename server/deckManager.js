const { initialDeck, getRandomCards, getCardById } = require('./cardData');
const { getPlayer } = require('./roomManager');

// [player] => { mainDeck, toDraw, hand, discovering }
const playerDeckState = new Map();

/**
 * 플레이어 초기화
 */
const initializePlayerDeck = (playerId) => {
    if (!playerDeckState.has(playerId)) {
        playerDeckState.set(playerId, {
            mainDeck: [...initialDeck], 
            toDraw: [...initialDeck],   
            hand: [],                     
            discovering: null,            
        });
    }
};

/**
 * 덱에서 랜덤하게 n장을 드로우해서 손패로 저장
 */
const drawCards = (playerId, amount) => {
    initializePlayerDeck(playerId);

    const player = getPlayer(playerId);
    if (!player) return [];

    // pendingEffects 계산
    let drawAmount = amount + (player.pendingEffects.target_draw ?? 0);
    if (player.pendingEffects.target_draw) {
        delete player.pendingEffects.target_draw;
    }

    const state = playerDeckState.get(playerId);
    const toDraw = state.toDraw;
    const finalDrawAmount = Math.min(drawAmount, toDraw.length);
    if (finalDrawAmount <= 0) return [];

    const newHand = new Array(finalDrawAmount);
    for (let i = 0; i < finalDrawAmount; i++) {
        const lastIndex = toDraw.length - 1;
        const randomIndex = Math.floor(Math.random() * toDraw.length);

        newHand[i] = toDraw[randomIndex];
        toDraw[randomIndex] = toDraw[lastIndex];
        toDraw.pop();
    }

    state.hand.push(...newHand);
    return newHand;
};

/**
 * 카드 발견: 카드 풀에서 3장의 랜덤 카드를 플레이어에게 제시
 */
const discoverCards = (playerId) => {
    initializePlayerDeck(playerId);

    const discoveredCards = getRandomCards(3);
    playerDeckState.get(playerId).discovering = discoveredCards;

    return discoveredCards;
};

/**
 * 발견한 카드 중 하나를 선택하여 자신의 덱에 추가
 */
const selectDiscoveredCard = (playerId, cardIndex) => {
    const state = playerDeckState.get(playerId);
    if (!state) return null;
    // 유효성 검사
    const discovering = state.discovering;
    if (!discovering || cardIndex < 0 || cardIndex >= discovering.length) {
        return null;
    }
    // 카드 추가
    const selectedCard = discovering[cardIndex];
    state.mainDeck.push(selectedCard);
    state.toDraw.push(selectedCard);
    
    state.discovering = null;
    return {
        success: true,
        card: selectedCard
    };
};

/**
 * 현재 손패에서 카드를 선택하여 플레이
 */
const playCard = (playerId, handIndex) => {
    const state = playerDeckState.get(playerId);
    if (!state) return null;
    // 유효성 검사
    const hand = state.hand;
    if (handIndex < 0 || handIndex >= hand.length) {
        return null;
    }
    // 손패에서 제거
    const playedCard = hand[handIndex];
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
    const state = playerDeckState.get(playerId);
    if (!state) return;
    state.hand = [];
    state.toDraw = [...state.mainDeck];

    const player = getPlayer(playerId);
    if (player) {
        player.pendingEffects = {};
    }
};

/**
 * 플레이어 제거
 */
const removePlayer = (playerId) => {
    playerDeckState.delete(playerId);
};

/**
 * 플레이어의 전체 카드 정보 조회
 */
const getPlayerCardInfo = (playerId) => {
    const state = playerDeckState.get(playerId);
    if (!state) return null;

    return {
        mainDeck: state.mainDeck, 
        toDraw: state.toDraw,
        currentHand: state.hand,
        discoveringCards: state.discovering
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
