const pickerEl = document.getElementById("player-picker");
const statusEl = document.getElementById("game-status");
const startButton = document.getElementById("start-game-btn");
const teamBoard = document.getElementById("selected-team");
const teamGrid = document.getElementById("team-grid");
let players = [];
let teamAssignments = new Map();

async function loadPlayerPicker() {
  try {
    const response = await fetch(ADMIN_ENDPOINT_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const headerRow = data.headers;
    const bodyRows = data.rows;

    if (!headerRow || !bodyRows || bodyRows.length === 0) {
      statusEl.textContent = "No players found.";
      return;
    }

    const firstNameIdx = headerRow.findIndex(h => /first\s*name/i.test(h));
    const lastNameIdx = headerRow.findIndex(h => /last\s*name/i.test(h));
    const playerIdIdx = headerRow.findIndex(h => /player\s*id/i.test(h));
    players = bodyRows.map(row => ({
      id: String(row[playerIdIdx]),
      name: [row[firstNameIdx], row[lastNameIdx]].filter(Boolean).join(" "),
    }));

    pickerEl.innerHTML = players
      .map(player => `
        <label class="player-checkbox">
          <input type="checkbox" value="${escapeHTML(player.id)}">
          <span>${escapeHTML(player.name)}</span>
        </label>`)
      .join("");
    startButton.disabled = true;
  } catch (err) {
    statusEl.textContent = `Failed to load players: ${err.message}`;
  }
}

pickerEl.addEventListener("change", () => {
  startButton.disabled = pickerEl.querySelectorAll('input[type="checkbox"]:checked').length === 0;
});

startButton.addEventListener("click", () => {
  const selectedIds = new Set(
    [...pickerEl.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value)
  );
  const selectedPlayers = players.filter(player => selectedIds.has(player.id));

  if (selectedPlayers.length === 0) {
    statusEl.textContent = "Select at least one player to start the game.";
    return;
  }

  teamAssignments = new Map(selectedPlayers.map(player => [player.id, "a"]));
  teamBoard.hidden = false;
  statusEl.textContent = "";
  renderTeams();
  teamBoard.scrollIntoView({ behavior: "smooth", block: "start" });
});

teamGrid.addEventListener("click", event => {
  const card = event.target.closest(".game-player-card");
  if (!card) return;

  const playerId = card.dataset.playerId;
  const currentTeam = teamAssignments.get(playerId);
  const nextTeam = currentTeam === "a" ? "b" : "a";
  const updateTeams = () => {
    teamAssignments.set(playerId, nextTeam);
    renderTeams(playerId, nextTeam, !document.startViewTransition);
  };

  if (document.startViewTransition) {
    document.startViewTransition(updateTeams);
  } else {
    updateTeams();
  }
});

function renderTeams(movedPlayerId = "", destinationTeam = "", useFallbackAnimation = false) {
  const teams = [
    { id: "a", name: "Team 1", className: "team-one" },
    { id: "b", name: "Team 2", className: "team-two" },
  ];

  teamGrid.innerHTML = teams.map(team => {
    const teamPlayers = players.filter(player => teamAssignments.get(player.id) === team.id);
    const playerCards = teamPlayers.map(player => {
      const isMovingPlayer = player.id === movedPlayerId;
      const sourceDirection = destinationTeam === "a" ? "arrive-from-right" : "arrive-from-left";
      const animationClass = useFallbackAnimation && isMovingPlayer ? sourceDirection : "";
      const playerIndex = players.indexOf(player);
      const destinationName = team.id === "a" ? "Team 2" : "Team 1";

      return `
        <button class="game-player-card ${animationClass}" type="button"
          data-player-id="${escapeHTML(player.id)}"
          aria-label="Move ${escapeHTML(player.name)} to ${destinationName}"
          style="view-transition-name: game-player-${playerIndex}">
          <span class="game-player-name">${escapeHTML(player.name)}</span>
          <span class="move-indicator" aria-hidden="true">${team.id === "a" ? "→" : "←"}</span>
        </button>`;
    }).join("");

    return `
      <section class="team-column ${team.className}" aria-labelledby="team-${team.id}-title">
        <div class="team-column-heading">
          <h3 id="team-${team.id}-title">${team.name}</h3>
          <span class="team-count">${teamPlayers.length}</span>
        </div>
        <div class="team-player-list">
          ${playerCards || '<p class="empty-team">No players yet</p>'}
        </div>
      </section>`;
  }).join("");
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

loadPlayerPicker();
