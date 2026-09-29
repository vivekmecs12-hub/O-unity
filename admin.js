const battingSkillInput = document.getElementById("battingSkill");
const bowlingSkillInput = document.getElementById("bowlingSkill");
const battingSkillValue = document.getElementById("battingSkillValue");
const bowlingSkillValue = document.getElementById("bowlingSkillValue");
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const submitBtn = document.getElementById("submit-btn");

// If ?edit=<playerId> is present, the form edits that player instead of adding a new one
const params = new URLSearchParams(window.location.search);
const editPlayerId = params.get("edit");

if (editPlayerId) {
  document.getElementById("page-title").textContent = "Edit Player";
  submitBtn.textContent = "Save Changes";
  firstNameInput.value = params.get("firstName") || "";
  lastNameInput.value = params.get("lastName") || "";
  const initialBatting = Number(params.get("battingSkill")) || 0;
  battingSkillInput.value = initialBatting;
  bowlingSkillInput.value = 100 - initialBatting;
  battingSkillValue.textContent = initialBatting;
  bowlingSkillValue.textContent = 100 - initialBatting;
}

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

document.getElementById("player-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const statusEl = document.getElementById("admin-status");

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const battingSkill = Number(battingSkillInput.value);
  const bowlingSkill = Number(bowlingSkillInput.value);
  const payload = editPlayerId
    ? { action: "update", playerId: editPlayerId, firstName, lastName, battingSkill, bowlingSkill }
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
      setTimeout(() => (window.location.href = "index.html"), 1000);
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
