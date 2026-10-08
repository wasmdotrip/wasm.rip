const grid = document.querySelector("#grid");
const empty = document.querySelector("#empty");
const countEl = document.querySelector("#ports-count");
const searchEl = document.querySelector("#q");
const sortEl = document.querySelector("#sort");
const tabs = document.querySelectorAll(".tab");
const chip = document.querySelector("#porter-chip");
const chipName = document.querySelector("#porter-name");
const peopleList = document.querySelector("#people-list");
const state = { q: "", filter: "featured", sort: "featured", porter: null };

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const splitPorters = (porter) =>
  porter.split(/\s*(?:&|,|\band\b)\s*/i).map((p) => p.trim()).filter(Boolean);
const byName = (a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

let games = [];
let members = [];

function matchesPorter(game, member) {
  const keys = [member.name, member.github, ...(member.aliases || [])].map(norm);
  return splitPorters(game.porter).some((p) => keys.includes(norm(p)));
}

function visibleGames() {
  const q = norm(state.q);
  const list = games.filter((g) => {
    if (state.filter === "featured" && !g.featured) return false;
    if (state.porter && !matchesPorter(g, state.porter)) return false;
    if (q && !norm(g.name).includes(q) && !norm(g.porter).includes(q)) return false;
    return true;
  });
  if (state.sort === "az") list.sort(byName);
  else if (state.sort === "new") list.sort((a, b) => b._order - a._order);
  else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || byName(a, b));
  return list;
}

function card(game) {
  const gameThing = document.createElement("div");
  gameThing.classList.add("game-card");

  const gameImage = document.createElement("img");
  gameImage.src = game.imageUrl;
  gameImage.alt = "";
  gameImage.loading = "lazy";

  const gameInfo = document.createElement("div");
  gameInfo.classList.add("game-info");

  const gameTitle = document.createElement("span");
  gameTitle.classList.add("game-title");
  gameTitle.textContent = game.name;

  const gamePorter = document.createElement("span");
  gamePorter.classList.add("game-desc");
  // porter can be a "(note)" instead of a name, e.g. "(click for more info)"
  const note = game.porter.match(/^\((.*)\)$/);
  gamePorter.textContent = note ? note[1] : `port by ${game.porter}`;

  gameInfo.append(gameTitle, gamePorter);
  gameThing.append(gameImage, gameInfo);
  gameThing.addEventListener("click", () => window.open(game.gameUrl, "_blank"));
  return gameThing;
}

function render() {
  const list = visibleGames();
  grid.replaceChildren(...list.map(card));
  countEl.textContent =
    list.length === games.length ? `${games.length} total` : `${list.length} of ${games.length}`;
  empty.hidden = list.length > 0;
  if (!list.length) {
    empty.textContent = state.q ? `nothing matches "${state.q}". ` : "nothing here. ";
    empty.append("if you want it ported, ask in the ");
    const link = document.createElement("a");
    link.href = "https://discord.gg/uubyGYPHQw";
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "discord";
    empty.append(link, ".");
  }
  chip.hidden = !state.porter;
  if (state.porter) chipName.textContent = state.porter.name;
}

function renderPeople() {
  peopleList.replaceChildren(
    ...members.map((m) => {
      const n = games.filter((g) => matchesPorter(g, m)).length;
      const wrap = document.createElement("div");
      wrap.className = "group-memb";

      const link = document.createElement("a");
      link.href = `https://github.com/${m.github}`;
      link.target = "_blank";
      link.rel = "noopener";
      const img = document.createElement("img");
      img.src = m.avatar;
      img.alt = "";
      img.loading = "lazy";
      const name = document.createElement("span");
      name.textContent = m.name;
      link.append(img, name);

      const ports = document.createElement("button");
      ports.type = "button";
      ports.className = "person-ports";
      ports.textContent = n ? `${n} port${n === 1 ? "" : "s"}` : "no ports listed";
      ports.disabled = !n;
      ports.addEventListener("click", () => {
        state.porter = m;
        state.filter = "all";
        state.q = "";
        searchEl.value = "";
        syncTabs();
        render();
        document.querySelector("#ports").scrollIntoView();
      });

      wrap.append(link, ports);
      return wrap;
    })
  );
}

function syncTabs() {
  tabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.filter === state.filter)));
}

searchEl.addEventListener("input", () => {
  state.q = searchEl.value.trim();
  render();
});
sortEl.addEventListener("change", () => {
  state.sort = sortEl.value;
  render();
});
tabs.forEach((t) =>
  t.addEventListener("click", () => {
    state.filter = t.dataset.filter;
    syncTabs();
    render();
  })
);
document.querySelector("#porter-clear").addEventListener("click", () => {
  state.porter = null;
  render();
});

document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (e.key === "/" && !typing) {
    e.preventDefault();
    searchEl.focus();
  } else if (e.key === "Escape" && document.activeElement === searchEl) {
    searchEl.value = "";
    state.q = "";
    render();
    searchEl.blur();
  }
});

Promise.all([
  fetch("games.json").then((r) => r.json()),
  fetch("members.json").then((r) => r.json()),
])
  .then(([g, m]) => {
    games = g.map((game, i) => ({ ...game, _order: i }));
    members = m;
    document.querySelector("#more-count").textContent = Math.max(0, games.length - 2);
    render();
    renderPeople();
  })
  .catch(() => {
    countEl.textContent = "";
    empty.hidden = false;
    empty.textContent = "hi, games failed to load, either someone messed something up or idk";
  });
