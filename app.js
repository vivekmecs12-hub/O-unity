// Google Sheet's published CSV URL (File > Share > Publish to web > CSV)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-S3KDNMHf65kTEZTL-NyQlbHBz3Zb5He5EXFzFDp94ugeoE-k_ftRgL1lzbLDymNNb808Iuflm0fE/pub?output=csv";

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

    gridEl.innerHTML = bodyRows
      .map(row => {
        const title = titleIdxs.map(i => row[i]).join(" ") || row[0] || "";
        const batting = Number(row[battingIdx]) || 0;
        const bowling = Number(row[bowlingIdx]) || 0;
        const total = batting + bowling || 1;
        const battingPct = (batting / total) * 100;
        const pieStyle = `background: conic-gradient(#4f8ef7 0% ${battingPct}%, #f7a94f ${battingPct}% 100%);`;
        return `
          <div class="tile">
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
