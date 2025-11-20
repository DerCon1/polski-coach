let words = [];
let currentIndex = 0;
let translationVisible = false;

const polishEl = document.getElementById("polish");
const englishEl = document.getElementById("english");
const showBtn = document.getElementById("show-btn");
const nextBtn = document.getElementById("next-btn");

async function loadWords() {
  try {
    const res = await fetch("data/words.json");
    words = await res.json();
    if (!Array.isArray(words) || words.length === 0) {
      polishEl.textContent = "No words found.";
      return;
    }
    showRandomWord();
  } catch (err) {
    console.error(err);
    polishEl.textContent = "Error loading words.";
  }
}

function showRandomWord() {
  if (words.length === 0) return;
  translationVisible = false;
  englishEl.textContent = "";
  currentIndex = Math.floor(Math.random() * words.length);
  const word = words[currentIndex];
  polishEl.textContent = word.pl;
}

function showTranslation() {
  if (!words[currentIndex]) return;
  if (!translationVisible) {
    englishEl.textContent = words[currentIndex].en;
    translationVisible = true;
  } else {
    // hide again if you press a second time
    englishEl.textContent = "";
    translationVisible = false;
  }
}

showBtn.addEventListener("click", showTranslation);
nextBtn.addEventListener("click", showRandomWord);

loadWords();
