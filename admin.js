const battingSkillInput = document.getElementById("battingSkill");
const bowlingSkillInput = document.getElementById("bowlingSkill");
const battingSkillValue = document.getElementById("battingSkillValue");
const bowlingSkillValue = document.getElementById("bowlingSkillValue");
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const submitBtn = document.querySelector('#player-form button[type="submit"]');

function updateSubmitState() {
  submitBtn.disabled = !firstNameInput.value.trim() || !lastNameInput.value.trim();
}

firstNameInput.addEventListener("input", updateSubmitState);
lastNameInput.addEventListener("input", updateSubmitState);
updateSubmitState();

battingSkillInput.addEventListener("input", () => {
  const batting = Number(battingSkillInput.value);
  const bowling = 100 - batting;
  bowlingSkillInput.value = bowling;
  battingSkillValue.textContent = batting;
  bowlingSkillValue.textContent = bowling;
});

// If ?edit=<playerId> is present, load that player's data and switch the form to edit mode
const editPlayerId = new URLSearchParams(window.location.search).get("edit");

async function loadPlayerForEdit() {
  const statusEl = document.getElementById("admin-status");
  try {
    const response = await fetch(ADMIN_ENDPOINT_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const firstNameIdx = data.headers.findIndex(h => /first\s*name/i.test(h));
    const lastNameIdx = data.headers.findIndex(h => /last\s*name/i.test(h));
    const battingIdx = data.headers.findIndex(h => /batting\s*skill/i.test(h));
    const idIdx = data.headers.findIndex(h => /player\s*id/i.test(h));

    const row = data.rows.find(r => String(r[idIdx]) === String(editPlayerId));
    if (!row) {
      statusEl.textContent = "Player not found.";
      return;
    }

    document.getElementById("page-heading").textContent = "O-unity Admin — Edit Player";
    firstNameInput.value = row[firstNameIdx];
    lastNameInput.value = row[lastNameIdx];
    battingSkillInput.value = row[battingIdx];
    battingSkillInput.dispatchEvent(new Event("input"));
    submitBtn.textContent = "Update Player";
    updateSubmitState();
  } catch (err) {
    statusEl.textContent = `Failed to load player: ${err.message}`;
  }
}

if (editPlayerId) loadPlayerForEdit();

document.getElementById("player-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const statusEl = document.getElementById("admin-status");

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const battingSkill = Number(battingSkillInput.value);
  const bowlingSkill = Number(bowlingSkillInput.value);
  const payload = editPlayerId
    ? { action: "edit", playerId: editPlayerId, firstName, lastName, battingSkill, bowlingSkill }
    : { firstName, lastName, battingSkill, bowlingSkill };

  statusEl.textContent = "Saving...";

  try {
    // no-cors: Apps Script doesn't send CORS headers on POST responses, so the
    // reply can't be read here, but the sheet write still completes server-side.
    await fetch(ADMIN_ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    if (editPlayerId) {
      statusEl.textContent = `Updated ${firstName} ${lastName}. Redirecting...`;
      window.location.href = "index.html";
    } else {
      statusEl.textContent = `Added ${firstName} ${lastName}. Refresh the players page to see it.`;
      event.target.reset();
      battingSkillInput.dispatchEvent(new Event("input"));
      updateSubmitState();
    }
  } catch (err) {
    statusEl.textContent = `Failed to save player: ${err.message}`;
  }
});
