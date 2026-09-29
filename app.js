// Google Sheet's published CSV URL (File > Share > Publish to web > CSV)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-S3KDNMHf65kTEZTL-NyQlbHBz3Zb5He5EXFzFDp94ugeoE-k_ftRgL1lzbLDymNNb808Iuflm0fE/pub?output=csv";
// First column of the sheet ("Player ID") is used to identify a tile for deletion
let playerIdIdx = 0;

async function loadSheetData() {
  const statusEl = document.getElementById("status");
  const gridEl = document.getElementById("tile-grid");

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      statusEl.textContent = "No data found.";
      return;
    }

    const [headerRow, ...bodyRows] = rows;
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
        return `
          <div class="tile" data-player-id="${escapeHTML(playerId)}">
            <button class="delete-btn" title="Delete player">&times;</button>
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

// Minimal CSV parser handling quoted fields and commas within quotes
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n" || char === "\r") {
        if (field !== "" || row.length > 0) {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        }
        if (char === "\r" && next === "\n") i++;
      } else {
        field += char;
      }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.length > 1 || r[0] !== "");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadSheetData();
