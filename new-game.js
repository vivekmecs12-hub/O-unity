async function loadPlayerPicker() {
  const pickerEl = document.getElementById("player-picker");
  const statusEl = document.getElementById("game-status");

  try {
    const response = await fetch(ADMIN_ENDPOINT_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const headerRow = data.headers;
    const bodyRows = data.rows;

    const firstNameIdx = headerRow.findIndex(h => /first\s*name/i.test(h));
    const lastNameIdx = headerRow.findIndex(h => /last\s*name/i.test(h));
    const playerIdIdx = headerRow.findIndex(h => /player\s*id/i.test(h));

    if (!bodyRows || bodyRows.length === 0) {
      statusEl.textContent = "No players found.";
      return;
    }

    pickerEl.innerHTML = bodyRows
      .map(row => {
        const playerId = row[playerIdIdx];
        const name = [row[firstNameIdx], row[lastNameIdx]].filter(Boolean).join(" ");
        return `
          <label class="player-checkbox">
            <input type="checkbox" value="${escapeHTML(playerId)}" data-name="${escapeHTML(name)}">
            ${escapeHTML(name)}
          </label>`;
      })
      .join("");
  } catch (err) {
    statusEl.textContent = `Failed to load players: ${err.message}`;
  }
}

document.getElementById("start-game-btn").addEventListener("click", () => {
  const statusEl = document.getElementById("game-status");
  const teamEl = document.getElementById("selected-team");
  const checked = [...document.querySelectorAll('#player-picker input[type="checkbox"]:checked')];

  if (checked.length === 0) {
    statusEl.textContent = "Select at least one player to start the game.";
    teamEl.innerHTML = "";
    return;
  }

  statusEl.textContent = "";
  teamEl.innerHTML = `
    <h3>Today's Team</h3>
    <ul>${checked.map(c => `<li>${escapeHTML(c.dataset.name)}</li>`).join("")}</ul>`;
});

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

loadPlayerPicker();
