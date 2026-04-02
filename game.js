// =============================
// ⚡ JAPANESE APP (VOCAB + GRAMMAR FULL IN ONE FILE)
// =============================

let data = [];
let grammarData = [];

let progress = {};
let history = [];
let wrongList = {};

let selectedLessons = [];
let queue = [];
let current = null;

let score = 0;
let total = 0;
let combo = 0;

let mode = "vocab"; // vocab | grammar_lesson | grammar_ex
let stage = "hira";

// ===================== LOAD DATA
const DATA_URL = "https://raw.githubusercontent.com/popeem/jlpt-game/main/data.json";
const GRAMMAR_URL = "https://raw.githubusercontent.com/popeem/jlpt-game/main/grammar.json";

async function loadData() {
  const res = await fetch(DATA_URL);
  data = await res.json();

  const g = await fetch(GRAMMAR_URL);
  grammarData = await g.json();

  progress = JSON.parse(localStorage.getItem("progress") || "{}");
  history = JSON.parse(localStorage.getItem("history") || "[]");

  data.forEach(w => {
    if (!progress[w.kanji]) {
      progress[w.kanji] = { level: 0, wrong: 0 };
    }
  });
}

function save() {
  localStorage.setItem("progress", JSON.stringify(progress));
  localStorage.setItem("history", JSON.stringify(history));
}

// ===================== MENU
function openGrammarMenu() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("grammarMenu").style.display = "block";
}

function goMenu() {
  document.getElementById("menu").style.display = "block";
  document.getElementById("game").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("grammarMenu").style.display = "none";
}

// ===================== VOCAB GAME
function startGame() {
  mode = "vocab";
  wrongList = {};
  queue = shuffle([...data]);

  score = 0;
  total = 0;
  combo = 0;

  document.getElementById("game").style.display = "block";
  nextQuestion();
}

function nextQuestion() {
  if (queue.length === 0) return showDashboard();

  current = queue.shift();
  stage = "hira";

  document.getElementById("question").innerText = current.kanji;
  document.getElementById("status").innerText = "";

  renderHira();
}

function renderHira() {
  const div = document.getElementById("choices");
  div.innerHTML = "<h3>เลือก Hiragana</h3>";

  getChoices("hira").forEach(c => {
    let btn = document.createElement("button");
    btn.innerText = c;
    btn.onclick = () => selectHira(c);
    div.appendChild(btn);
  });
}

function selectHira(choice) {
  total++;

  if (choice !== current.hira) {
    handleWrong();
    return next();
  }

  stage = "thai";
  renderThai();
}

function renderThai() {
  const div = document.getElementById("choices");
  div.innerHTML = "<h3>เลือกคำแปล</h3>";

  getChoices("thai").forEach(c => {
    let btn = document.createElement("button");
    btn.innerText = c;
    btn.onclick = () => selectThai(c);
    div.appendChild(btn);
  });
}

function selectThai(choice) {
  if (choice === current.thai) handleCorrect();
  else handleWrong();

  next();
}

// ===================== GRAMMAR LESSON
let grammarQueue = [];
let grammarCurrent = null;

function startGrammarLesson() {
  mode = "grammar_lesson";
  grammarQueue = shuffle([...grammarData]);

  document.getElementById("grammarMenu").style.display = "none";
  document.getElementById("game").style.display = "block";

  nextGrammar();
}

function nextGrammar() {
  if (grammarQueue.length === 0) return goMenu();

  grammarCurrent = grammarQueue.shift();

  document.getElementById("question").innerText = grammarCurrent.pattern;
  document.getElementById("choices").innerHTML = `
    <p>${grammarCurrent.meaning}</p>
    <p>${grammarCurrent.structure}</p>
    <p>${grammarCurrent.example}</p>
    <button onclick="nextGrammar()">➡ ต่อไป</button>
  `;
}

// ===================== GRAMMAR EXERCISE
function startGrammarExercise() {
  mode = "grammar_ex";
  grammarQueue = shuffle([...grammarData]);

  document.getElementById("grammarMenu").style.display = "none";
  document.getElementById("game").style.display = "block";

  nextGrammarExercise();
}

function nextGrammarExercise() {
  if (grammarQueue.length === 0) return goMenu();

  grammarCurrent = grammarQueue.shift();

  document.getElementById("question").innerText = grammarCurrent.question;

  const div = document.getElementById("choices");
  div.innerHTML = "<h3>เลือกคำช่วย</h3>";

  grammarCurrent.choices.forEach(c => {
    let btn = document.createElement("button");
    btn.innerText = c;
    btn.onclick = () => checkGrammar(c);
    div.appendChild(btn);
  });
}

function checkGrammar(choice) {
  if (choice === grammarCurrent.answer) {
    document.getElementById("status").innerText = "✅ ถูก";
  } else {
    document.getElementById("status").innerText = "❌ ผิด";
  }

  setTimeout(nextGrammarExercise, 500);
}

// ===================== LOGIC
function handleCorrect() {
  score++;
  combo++;

  let p = progress[current.kanji];
  p.level = Math.min(p.level + 1, 5);
  p.wrong = 0;
}

function handleWrong() {
  combo = 0;

  let p = progress[current.kanji];
  p.level = Math.max(p.level - 1, 0);
  p.wrong++;

  queue.push(current);
}

function next() {
  updateUI();
  save();
  setTimeout(nextQuestion, 500);
}

// ===================== UI
function updateUI() {
  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("combo").innerText = "🔥 Combo: " + combo;

  let acc = total > 0 ? Math.round((score / total) * 100) : 0;
  document.getElementById("accuracy").innerText = "Accuracy: " + acc + "%";
}

function showDashboard() {
  document.getElementById("game").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  let acc = total > 0 ? Math.round((score / total) * 100) : 0;

  document.getElementById("finalScore").innerText = score + "/" + total;
  document.getElementById("finalAcc").innerText = acc + "%";

  history.push(acc);
  save();
}

// ===================== RANDOM
function getChoices(type) {
  let arr = [current[type]];
  while (arr.length < 4) {
    let r = data[Math.floor(Math.random() * data.length)][type];
    if (!arr.includes(r)) arr.push(r);
  }
  return shuffle(arr);
}

function shuffle(a) {
  return a.sort(() => Math.random() - 0.5);
}

// ===================== INIT
async function init() {
  await loadData();
}

init();
