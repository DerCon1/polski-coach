// ---- GLOBAL STATE ----
let currentDeck = "core";
let cards = [];
let currentIndex = 0;
let showingTranslation = false;

// ---- HTML ELEMENTS ----
const polishEl = document.getElementById("polish");
const englishEl = document.getElementById("english");

// ---- LOAD JSON FILE ----
async function loadDeck(deckName) {
  let file = "";

  if (deckName === "core") file = "data/core_words.json";
  if (deckName === "verbs") file = "data/verbs.json";
  if (deckName === "sentences") file = "data/sentences.json";

  const res = await fetch(file);
  cards = await res.json();

  currentDeck = deckName;
  showRandomCard();
}

// ---- DISPLAY LOGIC ----
function showRandomCard() {
  if (cards.length === 0) return;

  showingTranslation = false;
  englishEl.textContent = "";

  currentIndex = Math.floor(Math.random() * cards.length);
  const card = cards[currentIndex];

  // handle different deck structures
  if (currentDeck === "core") {
    polishEl.textContent = card.pl;
  }

  if (currentDeck === "verbs") {
    polishEl.textContent = card.pl_imp + " / " + card.pl_perf;
  }

  if (currentDeck === "sentences") {
    polishEl.textContent = card.en; // show English first
  }
}

function showTranslation() {
  const card = cards[currentIndex];
  if (!card) return;

  if (currentDeck === "core") {
    englishEl.textContent = card.en;
  }

  if (currentDeck === "verbs") {
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
  }

  if (currentDeck === "sentences") {
    englishEl.textContent = card.pl;
  }
}

// ---- BUTTON WIRES ----
document.getElementById("next-btn").addEventListener("click", showRandomCard);
document.getElementById("show-btn").addEventListener("click", showTranslation);

// ---- NEW: DECK SELECTORS ----
document.getElementById("deck-core").addEventListener("click", () => loadDeck("core"));
document.getElementById("deck-verbs").addEventListener("click", () => loadDeck("verbs"));
document.getElementById("deck-sentences").addEventListener("click", () => loadDeck("sentences"));

// ---- INITIAL LOAD ----
loadDeck("core");
