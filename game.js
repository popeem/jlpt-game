let data = [];
let progress = {};
let wrongList = {};
let history = [];

let selectedLessons = [];

let queue = [];
let current = null;

let score = 0;
let total = 0;
let combo = 0;

let mode = "normal";
let maxTime = 20;
let timeLeft = 20;
let timerInterval = null;

let stage = "hira";

// ===================== DATA URL
const DATA_URL = "https://raw.githubusercontent.com/popeem/jlpt-game/main/data.json";

// ===================== LOAD
async function loadData() {
  const res = await fetch(DATA_URL);
  data = await res.json();

  progress = JSON.parse(localStorage.getItem("progress") || "{}");
  history = JSON.parse(localStorage.getItem("history") || "[]");

  data.forEach(w => {
    if (!progress[w.kanji]) {
      progress[w.kanji] = { level: 0, wrong: 0 };
    }
  });

  console.log("DATA:", data);
}

function save() {
  localStorage.setItem("progress", JSON.stringify(progress));
  localStorage.setItem("history", JSON.stringify(history));
}

// ===================== LESSON MENU
function buildLessonMenu() {
  let lessons = [...new Set(data.map(d => d.lesson))];

  const div = document.getElementById("lessonList");
  div.innerHTML = "";

  lessons.forEach(l => {
    let btn = document.createElement("button");
    btn.innerText = l;

    btn.onclick = () => {
      if (selectedLessons.includes(l)) {
        selectedLessons = selectedLessons.filter(x => x !== l);
        btn.classList.remove("selected");
      } else {
        selectedLessons.push(l);
        btn.classList.add("selected");
      }
    };

    div.appendChild(btn);
  });
}

// ===================== MODE
function startMode(m) {
  mode = m;

  if (m === "easy") maxTime = 30;
  if (m === "normal") maxTime = 20;
  if (m === "hard") maxTime = 10;

  document.getElementById("menu").style.display = "none";
  startGame();
}

// ===================== QUEUE
function buildQueue() {
  let q = [];
  let filtered = data;

  if (selectedLessons.length > 0) {
    filtered = data.filter(d => selectedLessons.includes(d.lesson));
  }

  filtered.forEach(w => {
    let p = progress[w.kanji];
    let weight = 1 + p.wrong + (3 - p.level);

    for (let i = 0; i < weight; i++) q.push(w);
  });

  return shuffle(q);
}

// ===================== START
function startGame() {
  wrongList = {};
  queue = buildQueue();

  score = 0;
  total = 0;
  combo = 0;

  document.getElementById("game").style.display = "block";
  document.getElementById("dashboard").style.display = "none";

  nextQuestion();
}

// ===================== NEXT
function nextQuestion() {
  if (queue.length === 0) return showDashboard();

  current = queue.shift();
  document.getElementById("question").innerText = current.kanji;

  document.getElementById("status").innerText = "";

  stage = "hira";
  renderHira();

  startTimer();
}

// ===================== TIMER
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = maxTime;
  updateBar();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateBar();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      total++;
      handleWrong();
      next();
    }
  }, 1000);
}

function updateBar() {
  document.getElementById("progress").style.width =
    (timeLeft / maxTime) * 100 + "%";
}

// ===================== STEP 1 (HIRAGANA)
function renderHira() {
  const div = document.getElementById("choices");
  div.innerHTML = "<h3>เลือก Hiragana</h3>";

  let choices = getChoices("hira");

  choices.forEach(c => {
    let btn = document.createElement("button");
    btn.innerText = c;

    btn.onclick = () => selectHira(c);

    div.appendChild(btn);
  });
}

function selectHira(choice) {
  if (stage !== "hira") return;

  clearInterval(timerInterval);

  if (choice !== current.hira) {
    total++;
    handleWrong();
    next();
    return;
  }

  document.getElementById("status").innerText = "✅ ถูก! ไปต่อ";

  stage = "thai";
  renderThai();
  startTimer();
}

// ===================== STEP 2 (THAI)
function renderThai() {
  const div = document.getElementById("choices");
  div.innerHTML = "<h3>เลือกคำแปล</h3>";

  let choices = getChoices("thai");

  choices.forEach(c => {
    let btn = document.createElement("button");
    btn.innerText = c;

    btn.onclick = () => selectThai(c);

    div.appendChild(btn);
  });
}

function selectThai(choice) {
  if (stage !== "thai") return;

  clearInterval(timerInterval);
  total++;

  if (choice === current.thai) {
    handleCorrect();
  } else {
    handleWrong();
  }

  next();
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

// ===================== LOGIC
function handleCorrect() {
  score++;
  combo++;

  document.getElementById("status").innerText = "✅ Correct";

  let p = progress[current.kanji];
  p.level = Math.min(p.level + 1, 5);
  p.wrong = 0;
}

function handleWrong() {
  combo = 0;

  document.getElementById("status").innerText = "❌ Wrong";

  let p = progress[current.kanji];
  p.level = Math.max(p.level - 1, 0);
  p.wrong++;

  if (!wrongList[current.kanji]) {
    wrongList[current.kanji] = {
      hira: current.hira,
      thai: current.thai,
      count: 0
    };
  }

  wrongList[current.kanji].count++;

  queue.push(current);
}

// ===================== NEXT FLOW
function next() {
  updateUI();
  save();

  setTimeout(() => {
    nextQuestion();
  }, 500); // 🔥 delay นิดให้ดูผล
}

// ===================== UI
function updateUI() {
  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("combo").innerText = "🔥 Combo: " + combo;

  let acc = total > 0 ? Math.round((score / total) * 100) : 0;
  document.getElementById("accuracy").innerText = "Accuracy: " + acc + "%";
}

// ===================== DASHBOARD
function showDashboard() {
  document.getElementById("game").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  let acc = total > 0 ? Math.round((score / total) * 100) : 0;

  document.getElementById("finalScore").innerText = score + "/" + total;
  document.getElementById("finalAcc").innerText = acc + "%";

  history.push(acc);
  save();

  renderTable();
  renderChart();
}

function renderTable() {
  let table = document.getElementById("wrongTable");
  table.innerHTML = "";

  Object.keys(wrongList).forEach(k => {
    let r = wrongList[k];
    let tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${k}</td>
      <td>${r.hira}</td>
      <td>${r.thai}</td>
      <td>${r.count}</td>
    `;

    table.appendChild(tr);
  });
}

function renderChart() {
  new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: history.map((_, i) => i + 1),
      datasets: [{ label: "Accuracy", data: history }]
    }
  });
}

// ===================== REVIEW
function reviewWrong() {
  queue = Object.keys(wrongList).map(k => ({
    kanji: k,
    hira: wrongList[k].hira,
    thai: wrongList[k].thai
  }));

  document.getElementById("game").style.display = "block";
  document.getElementById("dashboard").style.display = "none";

  nextQuestion();
}

// ===================== MENU
function goMenu() {
  document.getElementById("menu").style.display = "block";
  document.getElementById("game").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
}

// ===================== INIT
async function init() {
  await loadData();
  buildLessonMenu();
}

init();
