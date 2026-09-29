// First column of the sheet ("Player ID") is used to identify a tile for deletion
let playerIdIdx = 0;

const session = requireLogin();
const isAdmin = session && session.role === "admin";
if (isAdmin) document.getElementById("add-player-link").hidden = false;
document.getElementById("logout-link").addEventListener("click", (event) => {
  event.preventDefault();
  logout();
});

async function loadSheetData() {
  const statusEl = document.getElementById("status");
  const gridEl = document.getElementById("tile-grid");

  try {
    // Reads live from the Sheet via Apps Script (doGet), no publish/caching delay
    const response = await fetch(ADMIN_ENDPOINT_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const headerRow = data.headers;
    const bodyRows = data.rows;

    if (!headerRow || bodyRows.length === 0) {
      statusEl.textContent = "No data found.";
      return;
    }
    // "Player First name" + "Player Last Name" columns form the tile title
    const firstNameIdx = headerRow.findIndex(h => /first\s*name/i.test(h));
    const lastNameIdx = headerRow.findIndex(h => /last\s*name/i.test(h));
    const titleIdxs = [firstNameIdx, lastNameIdx].filter(i => i !== -1);
    // Batting/Bowling Skill columns are rendered as a pie chart instead of text
    const battingIdx = headerRow.findIndex(h => /batting\s*skill/i.test(h));
    const bowlingIdx = headerRow.findIndex(h => /bowling\s*skill/i.test(h));
    playerIdIdx = headerRow.findIndex(h => /player\s*id/i.test(h));
    if (playerIdIdx === -1) playerIdIdx = 0;

    gridEl.innerHTML = bodyRows
      .map(row => {
        const title = titleIdxs.map(i => row[i]).join(" ") || row[0] || "";
        const batting = Number(row[battingIdx]) || 0;
        const bowling = Number(row[bowlingIdx]) || 0;
        const total = batting + bowling || 1;
        const battingPct = (batting / total) * 100;
        const pieStyle = `background: conic-gradient(#4f8ef7 0% ${battingPct}%, #f7a94f ${battingPct}% 100%);`;
        const playerId = row[playerIdIdx];
        const deleteBtn = isAdmin ? `<button class="delete-btn" title="Delete player">&times;</button>` : "";
        return `
          <div class="tile" data-player-id="${escapeHTML(playerId)}">
            ${deleteBtn}
            <h3>${escapeHTML(title)}</h3>
            <div class="pie" style="${pieStyle}" title="Batting ${batting}% / Bowling ${bowling}%"></div>
            <div class="legend">
              <span><i class="swatch batting"></i>Batting ${batting}%</span>
              <span><i class="swatch bowling"></i>Bowling ${bowling}%</span>
            </div>
          </div>`;
      })
      .join("");

    statusEl.textContent = "";
  } catch (err) {
    statusEl.textContent = `Failed to load data: ${err.message}`;
  }
}

document.getElementById("tile-grid").addEventListener("click", async (event) => {
  const btn = event.target.closest(".delete-btn");
  if (!btn) return;

  const tile = btn.closest(".tile");
  const playerId = tile.dataset.playerId;
  const name = tile.querySelector("h3").textContent;

  if (!confirm(`Delete ${name}? This removes them from the Google Sheet too.`)) return;

  btn.disabled = true;
  try {
    // no-cors: Apps Script doesn't send CORS headers on POST responses, so the
    // reply can't be read here, but the sheet deletion still completes server-side.
    await fetch(ADMIN_ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "delete", playerId }),
    });
    tile.remove();
  } catch (err) {
    document.getElementById("status").textContent = `Failed to delete: ${err.message}`;
    btn.disabled = false;
  }
});

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

loadSheetData();
