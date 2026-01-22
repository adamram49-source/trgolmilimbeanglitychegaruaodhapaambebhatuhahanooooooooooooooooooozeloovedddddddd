let currentGame = null;

/* ---------- STORAGE ---------- */
function getGames() {
  return JSON.parse(localStorage.getItem("games") || "[]");
}
function saveGames(games) {
  localStorage.setItem("games", JSON.stringify(games));
}

/* ---------- CREATE / EDIT ---------- */
function saveGame(editId = null) {
  const name = gameName.value;
  const en = english.value.split("\n");
  const he = hebrew.value.split("\n");

  const pairs = en.map((e, i) => ({
    en: e.trim(),
    he: he[i]?.trim()
  })).filter(p => p.en && p.he);

  let games = getGames();

  if (editId) {
    games = games.map(g =>
      g.id == editId ? { ...g, name, pairs } : g
    );
  } else {
    games.push({ id: Date.now(), name, pairs });
  }

  saveGames(games);
  location.href = "games.html";
}

/* ---------- LIST ---------- */
function loadGamesList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  getGames().forEach(g => {
    const div = document.createElement("div");

    const open = document.createElement("button");
    open.innerText = g.name;
    open.onclick = () => location.href = `game.html?id=${g.id}`;

    const edit = document.createElement("button");
    edit.innerText = "✏️";
    edit.onclick = () => location.href = `editor.html?edit=${g.id}`;

    const del = document.createElement("button");
    del.innerText = "🗑️";
    del.onclick = () => {
      if (confirm("למחוק את המשחק?")) {
        saveGames(getGames().filter(x => x.id !== g.id));
        loadGamesList();
      }
    };

    div.append(open, edit, del);
    list.appendChild(div);
  });
}

/* ---------- LOAD GAME ---------- */
function loadGame() {
  const params = new URLSearchParams(location.search);

  if (params.get("shared")) {
    loadSharedGame(params.get("shared"));
    return;
  }

  const id = params.get("id");
  currentGame = getGames().find(g => g.id == id);
  title.innerText = currentGame.name;
  startGame("en");
}

/* ---------- GAME ---------- */
function startGame(mode) {
  board.innerHTML = "";
  message.innerText = "";

  let left = [];
  let right = [];

  currentGame.pairs.forEach(p => {
    if (mode === "en") {
      left.push({ text: p.he, id: p.en });
      right.push({ text: p.en, id: p.en });
    } else {
      left.push({ text: p.en, id: p.he });
      right.push({ text: p.he, id: p.he });
    }
  });

  right.sort(() => Math.random() - 0.5);

  left.forEach(w => {
    const d = document.createElement("div");
    d.className = "word";
    d.innerText = w.text;
    d.draggable = true;
    d.dataset.id = w.id;
    d.ondragstart = e => e.dataTransfer.setData("id", w.id);
    board.appendChild(d);
  });

  board.appendChild(document.createElement("hr"));

  right.forEach(w => {
    const t = document.createElement("div");
    t.className = "word target";
    t.innerText = w.text;
    t.dataset.id = w.id;

    t.ondragover = e => e.preventDefault();
    t.ondrop = e => {
      const id = e.dataTransfer.getData("id");
      if (id === w.id) {
        successPair(id);
      } else {
        failAnim(t);
      }
    };

    board.appendChild(t);
  });
}

/* ---------- EFFECTS ---------- */
function successPair(id) {
  message.innerText = "🎉 כל הכבוד!";

  document.querySelectorAll(`[data-id="${id}"]`).forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "scale(0.5)";
    setTimeout(() => el.remove(), 400);
  });
}

function failAnim(el) {
  message.innerText = "❌ טעית";
  el.style.transform = "translateX(20px)";
  setTimeout(() => el.style.transform = "", 300);
}

/* ---------- SHARE (AUTO COPY) ---------- */
function shareGame() {
  const data = {
    name: currentGame.name,
    pairs: currentGame.pairs
  };

  const encoded = btoa(JSON.stringify(data));
  const base = location.href.split("?")[0];
  const link = `${base}?shared=${encoded}`;

  navigator.clipboard.writeText(link).then(() => {
    alert("🔗 הקישור הועתק ללוח!");
  });
}

/* ---------- LOAD SHARED GAME ---------- */
function loadSharedGame(encoded) {
  const data = JSON.parse(atob(encoded));

  const newGame = {
    id: Date.now(),
    name: data.name + " (משותף)",
    pairs: data.pairs
  };

  const games = getGames();
  games.push(newGame);
  saveGames(games);

  currentGame = newGame;
  title.innerText = newGame.name;
  startGame("en");

  // מנקה את ה-URL
  history.replaceState({}, "", "game.html?id=" + newGame.id);
}
