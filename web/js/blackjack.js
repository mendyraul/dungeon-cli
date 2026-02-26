const dealerCardsEl = document.getElementById("dealerCards");
const dealerScoreEl = document.getElementById("dealerScore");
const playerHandsEl = document.getElementById("playerHands");
const splitIndicatorEl = document.getElementById("splitIndicator");
const hitBtn = document.getElementById("hitBtn");
const stayBtn = document.getElementById("stayBtn");
const doubleBtn = document.getElementById("doubleBtn");
const splitBtn = document.getElementById("splitBtn");
const surrenderBtn = document.getElementById("surrenderBtn");
const addChipsBtn = document.getElementById("addChipsBtn");
const bankAmountEl = document.getElementById("bankAmount");
const betInput = document.getElementById("betInput");
const dealBtn = document.getElementById("dealBtn");
const roundStatusEl = document.getElementById("roundStatus");
const currentBetEl = document.getElementById("currentBet");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const tableStageEl = document.querySelector(".table-stage");
const shoeEl = document.getElementById("cardShoe");
const shoeMouthEl = document.querySelector(".shoe-mouth");
const shoeLinesEl = document.getElementById("shoeLines");

const SUITS = ["♠", "♥", "♦", "♣"];
const COLORS = {
  "♠": "black",
  "♣": "black",
  "♥": "red",
  "♦": "red",
};
const RANK_LABELS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SHOES = 8;

const TOTAL_CARDS = SHOES * RANK_LABELS.length * SUITS.length;
const MAX_SHELF_LINES = 80;
let lastLineCount = 0;

const state = {
  deckMatrix: buildDeckMatrix(),
  dealerHand: [],
  playerHands: [],
  activeHandIndex: 0,
  bank: 100,
  roundActive: false,
  dealerRevealed: false,
  history: [],
  animating: false,
};

function buildDeckMatrix() {
  const matrix = {};
  const cardsPerSuit = SHOES * RANK_LABELS.length;
  for (const suit of SUITS) {
    matrix[suit] = [];
    for (let idx = 0; idx < cardsPerSuit; idx += 1) {
      matrix[suit].push(idx);
    }
  }
  return matrix;
}

function cardsRemaining() {
  return SUITS.reduce((sum, suit) => sum + state.deckMatrix[suit].length, 0);
}

function updateShoeDisplay() {
  const remaining = cardsRemaining();
  if (shoeEl) {
    const ratio = Math.max(0, Math.min(1, remaining / TOTAL_CARDS));
    shoeEl.style.setProperty("--shoe-fill", ratio.toFixed(2));
  }
  if (!shoeLinesEl) return;
  const desired = remaining === 0 ? 0 : Math.max(1, Math.round((remaining / TOTAL_CARDS) * MAX_SHELF_LINES));
  if (desired === lastLineCount) return;
  lastLineCount = desired;
  shoeLinesEl.innerHTML = "";
  for (let i = 0; i < desired; i += 1) {
    const span = document.createElement("span");
    shoeLinesEl.appendChild(span);
  }
}

function drawCard() {
  if (!cardsRemaining()) {
    state.deckMatrix = buildDeckMatrix();
    updateShoeDisplay();
  }
  const availableSuits = SUITS.filter((suit) => state.deckMatrix[suit].length);
  const suit = availableSuits[Math.floor(Math.random() * availableSuits.length)];
  const stack = state.deckMatrix[suit];
  const pickIndex = Math.floor(Math.random() * stack.length);
  const rawValue = stack.splice(pickIndex, 1)[0];
  const rankIndex = rawValue % RANK_LABELS.length;
  updateShoeDisplay();
  return {
    suit,
    rankIndex,
    rank: RANK_LABELS[rankIndex],
    value: getCardValue(rankIndex),
  };
}

function getCardValue(rankIndex) {
  if (rankIndex === 0) return 11;
  if (rankIndex >= 10) return 10;
  return rankIndex + 1;
}

function calculateScore(cards) {
  let total = 0;
  let aceCount = 0;
  for (const card of cards) {
    total += card.value;
    if (card.rank === "A") aceCount += 1;
  }
  while (total > 21 && aceCount > 0) {
    total -= 10;
    aceCount -= 1;
  }
  return { total, isSoft: aceCount > 0 };
}

function isBlackjack(cards) {
  return cards.length === 2 && calculateScore(cards).total === 21;
}

function createPlayerHand(bet) {
  return {
    cards: [],
    bet,
    doubled: false,
    finished: false,
    resolved: false,
    outcome: null,
    message: "",
  };
}

function getActiveHand() {
  return state.playerHands[state.activeHandIndex];
}

function getHandLabel(index) {
  return state.playerHands.length > 1 ? `Hand ${index + 1}` : "Hand";
}

function updateBankDisplay() {
  bankAmountEl.textContent = `Chips: ${state.bank}`;
  betInput.max = state.bank;
  if (Number(betInput.value) > state.bank) {
    betInput.value = Math.max(state.bank, 0);
  }
  currentBetEl.textContent = `Current Bet: ${getActiveBetAmount()}`;
}

function getActiveBetAmount() {
  const hand = getActiveHand();
  return hand ? hand.bet : 0;
}

function renderHands() {
  renderDealerHand();
  renderPlayerHands();
}

function renderDealerHand() {
  dealerCardsEl.innerHTML = "";
  state.dealerHand.forEach((card, index) => {
    const hidden = !state.dealerRevealed && index === 1;
    dealerCardsEl.appendChild(createCardEl(card, hidden));
  });
  dealerScoreEl.textContent = state.dealerRevealed
    ? `Score: ${calculateScore(state.dealerHand).total}`
    : "Score: --";
}

function renderPlayerHands() {
  if (!playerHandsEl) {
    console.warn("playerHands element missing from DOM.");
    return;
  }
  playerHandsEl.innerHTML = "";
  state.playerHands.forEach((hand, index) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("player-subhand");
    if (index === state.activeHandIndex && state.roundActive) {
      wrapper.classList.add("active");
    }

    const label = document.createElement("div");
    label.classList.add("hand-label");
    label.textContent = getHandLabel(index);
    wrapper.appendChild(label);

    const cardsEl = document.createElement("div");
    cardsEl.classList.add("cards");
    cardsEl.dataset.handIndex = index;
    hand.cards.forEach((card) => {
      cardsEl.appendChild(createCardEl(card));
    });
    wrapper.appendChild(cardsEl);

    const scoreEl = document.createElement("div");
    scoreEl.classList.add("score");
    const score = calculateScore(hand.cards).total;
    scoreEl.textContent = `Score: ${hand.cards.length ? score : "--"}`;
    wrapper.appendChild(scoreEl);

    playerHandsEl.appendChild(wrapper);
  });

  if (splitIndicatorEl) {
    splitIndicatorEl.textContent = state.playerHands.length > 1
      ? `Playing Hand ${state.activeHandIndex + 1}/${state.playerHands.length}`
      : "Hand 1";
  }
}

function createCardEl(card, hidden = false) {
  const cardEl = document.createElement("div");
  cardEl.classList.add("card");
  if (hidden) {
    cardEl.classList.add("back");
    return cardEl;
  }
  if (COLORS[card.suit] === "red") cardEl.classList.add("red");
  const rankEl = document.createElement("div");
  rankEl.textContent = card.rank;
  const suitEl = document.createElement("div");
  suitEl.classList.add("suit");
  suitEl.textContent = card.suit;
  cardEl.appendChild(rankEl);
  cardEl.appendChild(suitEl);
  return cardEl;
}

function getPlayerCardsContainer(index) {
  if (!playerHandsEl) return null;
  return playerHandsEl.querySelector(`.cards[data-hand-index="${index}"]`);
}

async function dealCardToHand(hand, owner, handIndex = state.activeHandIndex) {
  if (owner !== "dealer") {
    renderPlayerHands();
  }
  let targetEl = owner === "dealer" ? dealerCardsEl : getPlayerCardsContainer(handIndex);
  if (!targetEl) {
    renderPlayerHands();
    targetEl = owner === "dealer" ? dealerCardsEl : getPlayerCardsContainer(handIndex) || playerHandsEl;
  }
  const card = drawCard();
  await animateDealTo(targetEl, owner);
  hand.cards.push(card);
  renderHands();
  return card;
}

function animateDealTo(targetEl, owner = "player") {
  return new Promise((resolve) => {
    const sourceNode = shoeMouthEl || shoeEl;
    if (!tableStageEl || !sourceNode || !targetEl) {
      resolve();
      return;
    }
    const stageRect = tableStageEl.getBoundingClientRect();
    const sourceRect = sourceNode.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const remainingRatio = Math.max(0, cardsRemaining() / TOTAL_CARDS);
    const sizeScale = 0.6 + 0.4 * remainingRatio;
    const cardWidth = 70 * sizeScale;
    const cardHeight = 100 * sizeScale;

    const cardEl = document.createElement("div");
    cardEl.classList.add("card", "back", "card-flight");
    if (owner === "dealer") cardEl.classList.add("dealer-flight");
    cardEl.style.width = `${cardWidth}px`;
    cardEl.style.height = `${cardHeight}px`;
    const mouthX =
      sourceRect.left - stageRect.left + sourceRect.width / 2 - cardWidth / 2;
    const mouthY =
      sourceRect.top - stageRect.top + sourceRect.height / 2 - cardHeight / 2;
    const targetX =
      targetRect.left - stageRect.left + targetRect.width / 2 - cardWidth / 2;
    const targetY =
      targetRect.top - stageRect.top + targetRect.height / 2 - cardHeight / 2;
    cardEl.style.left = `${mouthX}px`;
    cardEl.style.top = `${mouthY}px`;
    tableStageEl.appendChild(cardEl);

    const deltaX = targetX - mouthX;
    const deltaY = targetY - mouthY;

    state.animating = true;
    updateControls();

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cardEl.remove();
      state.animating = false;
      updateControls();
      resolve();
    };

    requestAnimationFrame(() => {
      cardEl.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${(Math.random() * 16) - 8}deg)`;
      cardEl.style.opacity = "0";
    });

    cardEl.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 750);
  });
}

async function dealHand() {
  const bet = Number(betInput.value);
  if (state.roundActive || state.animating) return;
  if (!bet || bet < 1) {
    roundStatusEl.textContent = "Enter a bet to start.";
    return;
  }
  if (bet > state.bank) {
    roundStatusEl.textContent = "Not enough chips in the bank.";
    return;
  }

  state.playerHands = [createPlayerHand(bet)];
  state.activeHandIndex = 0;
  state.dealerHand = [];
  state.bank -= bet;
  state.roundActive = true;
  state.dealerRevealed = false;

  roundStatusEl.textContent = "Your move...";
  updateBankDisplay();
  renderHands();
  updateControls();

  await dealCardToHand(state.playerHands[0], "player", 0);
  await dealCardToHand({ cards: state.dealerHand }, "dealer");
  await dealCardToHand(state.playerHands[0], "player", 0);
  await dealCardToHand({ cards: state.dealerHand }, "dealer");

  updateControls();
  checkOpeningBlackjack();
}

function checkOpeningBlackjack() {
  const playerHand = getActiveHand();
  if (!playerHand) return;
  const playerBJ = isBlackjack(playerHand.cards);
  const dealerBJ = isBlackjack(state.dealerHand);
  if (!playerBJ && !dealerBJ) return;

  state.dealerRevealed = true;
  renderHands();
  if (playerBJ && dealerBJ) {
    finishHand(playerHand, 0, "push", "Both hit blackjack. Push.", { blackjack: true });
  } else if (playerBJ) {
    finishHand(playerHand, 0, "win", "Blackjack! Paid 3:2.", { blackjack: true });
  } else {
    finishHand(playerHand, 0, "lose", "Dealer blackjack. You lose.", { blackjack: true });
  }
  state.roundActive = false;
  updateBankDisplay();
  updateControls();
}

async function handleHit() {
  if (!state.roundActive || state.animating) return;
  const hand = getActiveHand();
  if (!hand || hand.finished) return;

  roundStatusEl.textContent = "You drew a card.";
  await dealCardToHand(hand, "player", state.activeHandIndex);
  updateControls();
  const score = calculateScore(hand.cards).total;
  if (score > 21) {
    roundStatusEl.textContent = "Hand busted.";
    hand.finished = true;
    finishHand(hand, state.activeHandIndex, "lose", "You busted. House wins.");
    await advanceHandOrDealer();
  }
}

async function handleStay({ silent = false } = {}) {
  if (!state.roundActive || state.animating) return;
  const hand = getActiveHand();
  if (!hand || hand.finished) return;
  hand.finished = true;
  if (!silent) roundStatusEl.textContent = "You stay.";
  await advanceHandOrDealer();
}

async function handleDouble() {
  if (!state.roundActive || state.animating) return;
  const hand = getActiveHand();
  if (!canDoubleActiveHand()) return;
  state.bank -= hand.bet;
  hand.bet *= 2;
  hand.doubled = true;
  updateBankDisplay();
  roundStatusEl.textContent = "You doubled down.";
  await dealCardToHand(hand, "player", state.activeHandIndex);
  const score = calculateScore(hand.cards).total;
  hand.finished = true;
  if (score > 21) {
    finishHand(hand, state.activeHandIndex, "lose", "You busted after doubling.");
  }
  await advanceHandOrDealer();
}

async function handleSplit() {
  if (!state.roundActive || state.animating) return;
  const hand = getActiveHand();
  if (!canSplitActiveHand()) return;

  const [first, second] = hand.cards;
  const newHand = createPlayerHand(hand.bet);
  newHand.cards.push(second);
  hand.cards = [first];
  state.bank -= hand.bet;
  state.playerHands.splice(state.activeHandIndex + 1, 0, newHand);
  updateBankDisplay();
  renderHands();
  roundStatusEl.textContent = "Hands split.";

  await dealCardToHand(hand, "player", state.activeHandIndex);
  await dealCardToHand(newHand, "player", state.activeHandIndex + 1);
  updateControls();
}

async function handleSurrender() {
  if (!canSurrenderActiveHand()) return;
  const hand = getActiveHand();
  if (!hand) return;

  const returned = Math.ceil(hand.bet / 2);
  hand.finished = true;
  finishHand(hand, state.activeHandIndex, "lose", `Surrendered. ${returned} chips returned.`);
  state.bank += returned;
  state.roundActive = false;
  state.activeHandIndex = 0;
  state.dealerRevealed = true;
  renderHands();
  updateBankDisplay();
  updateControls();
}

function canSplitActiveHand() {
  if (!state.roundActive || state.animating) return false;
  if (state.playerHands.length >= 2) return false;
  const hand = getActiveHand();
  if (!hand || hand.cards.length !== 2) return false;
  if (state.bank < hand.bet) return false;
  const [a, b] = hand.cards;
  return a.rank === b.rank;
}

function canDoubleActiveHand() {
  const hand = getActiveHand();
  if (!hand || hand.finished) return false;
  if (hand.cards.length !== 2 || hand.doubled) return false;
  return state.bank >= hand.bet;
}

function canSurrenderActiveHand() {
  if (!state.roundActive || state.animating) return false;
  const hand = getActiveHand();
  if (!hand || hand.finished) return false;
  // Only as first decision on an unsplit two-card hand.
  if (state.playerHands.length > 1) return false;
  return hand.cards.length === 2;
}

async function advanceHandOrDealer() {
  const nextIndex = state.playerHands.findIndex((hand, idx) => idx > state.activeHandIndex && !hand.finished);
  if (nextIndex !== -1) {
    state.activeHandIndex = nextIndex;
    renderHands();
    updateBankDisplay();
    updateControls();
    roundStatusEl.textContent = `Play Hand ${nextIndex + 1}/${state.playerHands.length}`;
    return;
  }
  if (state.playerHands.every((hand) => hand.resolved)) {
    state.roundActive = false;
    state.activeHandIndex = 0;
    updateBankDisplay();
    renderHands();
    updateControls();
    return;
  }
  state.dealerRevealed = true;
  renderHands();
  await dealerPlay();
  settleRound();
}

async function dealerPlay() {
  let dealerScore = calculateScore(state.dealerHand).total;
  while (dealerScore < 17) {
    await dealCardToHand({ cards: state.dealerHand }, "dealer");
    dealerScore = calculateScore(state.dealerHand).total;
  }
}

function settleRound() {
  const dealerScore = calculateScore(state.dealerHand).total;
  const dealerBust = dealerScore > 21;
  state.playerHands.forEach((hand, index) => {
    if (hand.resolved) return;
    const playerScore = calculateScore(hand.cards).total;
    if (dealerBust) {
      finishHand(hand, index, "win", "Dealer busts. You win!");
      return;
    }
    if (playerScore > 21) {
      finishHand(hand, index, "lose", "You busted.");
    } else if (playerScore > dealerScore) {
      finishHand(hand, index, "win", "You beat the dealer!");
    } else if (playerScore < dealerScore) {
      finishHand(hand, index, "lose", "Dealer tops your hand.");
    } else {
      finishHand(hand, index, "push", "Push. Bet returned.");
    }
  });
  state.roundActive = false;
  state.activeHandIndex = 0;
  updateBankDisplay();
  renderHands();
  updateControls();
}

function finishHand(hand, index, outcome, message, opts = {}) {
  if (hand.resolved) return;
  hand.finished = true;
  hand.resolved = true;
  hand.outcome = outcome;
  hand.message = message;
  const { blackjack = false } = opts;
  let payout = 0;
  if (outcome === "win") {
    payout = blackjack ? Math.floor(hand.bet * 2.5) : hand.bet * 2;
  } else if (outcome === "push") {
    payout = hand.bet;
  }
  state.bank += payout;
  roundStatusEl.textContent = message;
  addHistoryEntry(hand, index, outcome, message);
  updateBankDisplay();
}

function addHistoryEntry(hand, index, outcome, message) {
  const entry = {
    outcome,
    message,
    handLabel: getHandLabel(index),
    bet: hand.bet,
    playerCards: [...hand.cards],
    dealerCards: [...state.dealerHand],
    playerScore: calculateScore(hand.cards).total,
    dealerScore: calculateScore(state.dealerHand).total,
    timestamp: new Date(),
  };
  state.history.unshift(entry);
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  state.history.forEach((entry) => {
    const li = document.createElement("li");
    const outcomeText = entry.outcome === "win" ? "Win" : entry.outcome === "lose" ? "Lose" : "Push";
    const resultSpan = document.createElement("span");
    resultSpan.classList.add("history-outcome");
    resultSpan.textContent = `${entry.handLabel}: ${outcomeText} — ${entry.message}`;

    const details = document.createElement("span");
    details.textContent = `Bet ${entry.bet} | You: ${entry.playerScore} (${handToString(entry.playerCards)}) vs Dealer: ${entry.dealerScore} (${handToString(entry.dealerCards)})`;
    details.classList.add("history-meta");

    li.appendChild(resultSpan);
    li.appendChild(details);
    historyList.appendChild(li);
  });
}

function handToString(cards) {
  return cards.map((card) => `${card.rank}${card.suit}`).join(", ");
}

function updateControls() {
  const hand = getActiveHand();
  const lock = !state.roundActive || state.animating || !hand || hand.finished;
  hitBtn.disabled = lock;
  stayBtn.disabled = lock;
  doubleBtn.disabled = lock || !canDoubleActiveHand();
  splitBtn.disabled = lock || !canSplitActiveHand();
  if (surrenderBtn) surrenderBtn.disabled = lock || !canSurrenderActiveHand();
  dealBtn.disabled = state.roundActive || state.animating;
}

function clearHistory() {
  state.history = [];
  renderHistory();
}

function init() {
  updateBankDisplay();
  renderHands();
  updateControls();
  updateShoeDisplay();
}

dealBtn.addEventListener("click", dealHand);
hitBtn.addEventListener("click", handleHit);
stayBtn.addEventListener("click", () => handleStay());
doubleBtn.addEventListener("click", handleDouble);
splitBtn.addEventListener("click", handleSplit);
if (surrenderBtn) surrenderBtn.addEventListener("click", handleSurrender);
addChipsBtn.addEventListener("click", () => {
  state.bank += 10;
  updateBankDisplay();
});
clearHistoryBtn.addEventListener("click", clearHistory);

document.addEventListener("keydown", (event) => {
  if (!state.roundActive || state.animating) return;
  if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

  const key = event.key.toLowerCase();
  if (key === "h") handleHit();
  else if (key === "s") handleStay();
  else if (key === "d") handleDouble();
  else if (key === "p") handleSplit();
});

init();
