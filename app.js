// ---- GLOBAL STATE ----
let currentDeck = "core";
let cards = [];
let currentIndex = 0;
let showingTranslation = false;

// basic spaced-repetition scores stored in localStorage
// structure: { core: { "ja": {correct: X, wrong: Y}, ... }, verbs: {...}, sentences: {...} }
let scores = {};

// ---- HTML ELEMENTS ----
const polishEl = document.getElementById("polish");
const englishEl = document.getElementById("english");
const deckLabelEl = document.getElementById("deck-label");
const statsCorrectEl = document.getElementById("stats-correct");
const statsWrongEl = document.getElementById("stats-wrong");

// ---- SCORE STORAGE ----
function loadScores() {
  try {
    const raw = localStorage.getItem("polskiCoachScores_v1");
    scores = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Score parse error", e);
    scores = {};
  }
}

function saveScores() {
  try {
    localStorage.setItem("polskiCoachScores_v1", JSON.stringify(scores));
  } catch (e) {
    console.error("Score save error", e);
  }
}

function ensureDeckScores(deckName) {
  if (!scores[deckName]) {
    scores[deckName] = {};
  }
}

function getCardKey(card, deckName = currentDeck) {
  if (deckName === "core") return card.pl;
  if (deckName === "verbs") return card.pl_imp + "|" + card.pl_perf;
  if (deckName === "sentences") return card.en;
  return JSON.stringify(card);
}

function getCardStats(card) {
  ensureDeckScores(currentDeck);
  const key = getCardKey(card);
  const deckScores = scores[currentDeck];
  if (!deckScores[key]) {
    deckScores[key] = { correct: 0, wrong: 0 };
  }
  return deckScores[key];
}

function getDeckTotals() {
  ensureDeckScores(currentDeck);
  const deckScores = scores[currentDeck];
  let correct = 0;
  let wrong = 0;
  for (const key in deckScores) {
    correct += deckScores[key].correct || 0;
    wrong += deckScores[key].wrong || 0;
  }
  return { correct, wrong };
}

function updateStatsDisplay() {
  const { correct, wrong } = getDeckTotals();
  statsCorrectEl.textContent = "✓ " + correct;
  statsWrongEl.textContent = "✗ " + wrong;
  deckLabelEl.textContent = "Deck: " + currentDeck;
}

// ---- LOAD JSON FILE ----
async function loadDeck(deckName) {
  let file = "";

  if (deckName === "core") file = "data/words.json";
  if (deckName === "verbs") file = "data/verbs.json";
  if (deckName === "sentences") file = "data/sentences.json";

  try {
    const res = await fetch(file);
    if (!res.ok) {
      throw new Error("HTTP " + res.status + " for " + file);
    }
    cards = await res.json();

    currentDeck = deckName;
    highlightActiveDeckButton();
    showRandomCard(true);
  } catch (err) {
    console.error("Fetch error:", err);
    polishEl.textContent = "Error loading deck.";
    englishEl.textContent = "";
    cards = [];
  }
}

function highlightActiveDeckButton() {
  document.querySelectorAll(".deck-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  if (currentDeck === "core") {
    document.getElementById("deck-core").classList.add("active");
  } else if (currentDeck === "verbs") {
    document.getElementById("deck-verbs").classList.add("active");
  } else if (currentDeck === "sentences") {
    document.getElementById("deck-sentences").classList.add("active");
  }
}

// ---- CARD SELECTION (weighted by difficulty) ----
function pickCardIndex() {
  if (cards.length === 0) return 0;

  ensureDeckScores(currentDeck);
  const deckScores = scores[currentDeck];

  const weights = cards.map((card) => {
    const key = getCardKey(card);
    const stat = deckScores[key] || { correct: 0, wrong: 0 };
    // base 1, +2 per wrong, -1 per correct, floored at 0.5
    const weight = Math.max(0.5, 1 + 2 * stat.wrong - stat.correct);
    return weight;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;

  for (let i = 0; i < cards.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return cards.length - 1;
}

// ---- DISPLAY LOGIC ----
function showRandomCard(forceNew = false) {
  if (cards.length === 0) return;

  showingTranslation = false;
  englishEl.textContent = "";

  if (forceNew || cards.length === 1) {
    currentIndex = pickCardIndex();
  }

  const card = cards[currentIndex];

  if (currentDeck === "core") {
    polishEl.textContent = card.pl;
  } else if (currentDeck === "verbs") {
    polishEl.textContent = card.pl_imp + " / " + card.pl_perf;
  } else if (currentDeck === "sentences") {
    polishEl.textContent = card.en; // show English first
  }

  updateStatsDisplay();
}

function showTranslation() {
  const card = cards[currentIndex];
  if (!card) return;

  if (currentDeck === "core") {
    englishEl.textContent = card.en;
  } else if (currentDeck === "verbs") {
    englishEl.textContent =
      card.en +
      "\n\nPresent:\n" +
      JSON.stringify(card.conj_present, null, 2) +
      "\n\nPast (m/f): " +
      card.past_masc +
      " / " +
      card.past_fem +
      "\n\nFuture:\n" +
      card.future;
  } else if (currentDeck === "sentences") {
    englishEl.textContent = card.pl;
  }

  showingTranslation = true;
}

// ---- RATING ----
function rateCard(knewIt) {
  const card = cards[currentIndex];
  if (!card) return;

  const stat = getCardStats(card);
  if (knewIt) {
    stat.correct += 1;
  } else {
    stat.wrong += 1;
  }
  saveScores();
  showRandomCard(true);
}

// ---- BUTTON WIRES ----
document.getElementById("next-btn").addEventListener("click", () => {
  showRandomCard(true);
});

document.getElementById("show-btn").addEventListener("click", () => {
  showTranslation();
});

document.getElementById("know-btn").addEventListener("click", () => {
  rateCard(true);
});

document.getElementById("dontknow-btn").addEventListener("click", () => {
  rateCard(false);
});

// ---- DECK SELECTORS ----
document
  .getElementById("deck-core")
  .addEventListener("click", () => loadDeck("core"));
document
  .getElementById("deck-verbs")
  .addEventListener("click", () => loadDeck("verbs"));
document
  .getElementById("deck-sentences")
  .addEventListener("click", () => loadDeck("sentences"));

// ---- INITIAL LOAD ----
loadScores();
loadDeck("core");
updateStatsDisplay();
