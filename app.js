// Replace with your Google Sheet's published CSV URL (File > Share > Publish to web > CSV)
const SHEET_CSV_URL = "PASTE_YOUR_PUBLISHED_CSV_URL_HERE";

async function loadSheetData() {
  const statusEl = document.getElementById("status");
  const theadEl = document.querySelector("#data-table thead");
  const tbodyEl = document.querySelector("#data-table tbody");

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
    theadEl.innerHTML = `<tr>${headerRow.map(h => `<th>${escapeHTML(h)}</th>`).join("")}</tr>`;
    tbodyEl.innerHTML = bodyRows
      .map(row => `<tr>${row.map(cell => `<td>${escapeHTML(cell)}</td>`).join("")}</tr>`)
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
