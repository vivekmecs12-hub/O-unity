const battingSkillInput = document.getElementById("battingSkill");
const bowlingSkillInput = document.getElementById("bowlingSkill");

battingSkillInput.addEventListener("input", () => {
  let batting = Number(battingSkillInput.value);
  if (batting > 100) batting = 100;
  if (batting < 0) batting = 0;
  battingSkillInput.value = battingSkillInput.value === "" ? "" : batting;
  bowlingSkillInput.value = battingSkillInput.value === "" ? "" : 100 - batting;
});

document.getElementById("player-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const statusEl = document.getElementById("admin-status");

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const battingSkill = Number(battingSkillInput.value);
  const bowlingSkill = Number(bowlingSkillInput.value);

  statusEl.textContent = "Saving...";

  try {
    // no-cors: Apps Script doesn't send CORS headers on POST responses, so the
    // reply can't be read here, but the sheet write still completes server-side.
    await fetch(ADMIN_ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ firstName, lastName, battingSkill, bowlingSkill }),
    });

    statusEl.textContent = `Added ${firstName} ${lastName}. Refresh the players page to see it.`;
    event.target.reset();
  } catch (err) {
    statusEl.textContent = `Failed to add player: ${err.message}`;
  }
});
