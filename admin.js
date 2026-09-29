// Paste the Apps Script Web App URL here after deploying apps-script/Code.gs
const ADMIN_ENDPOINT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

document.getElementById("player-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const statusEl = document.getElementById("admin-status");

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const battingSkill = Number(document.getElementById("battingSkill").value);
  const bowlingSkill = Number(document.getElementById("bowlingSkill").value);

  if (battingSkill + bowlingSkill !== 100) {
    statusEl.textContent = "Batting Skill + Bowling Skill must add up to 100.";
    return;
  }

  statusEl.textContent = "Saving...";

  try {
    // text/plain avoids a CORS preflight request that Apps Script web apps don't support
    const response = await fetch(ADMIN_ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ firstName, lastName, battingSkill, bowlingSkill }),
    });
    const result = await response.json();

    if (result.success) {
      statusEl.textContent = `Added ${firstName} ${lastName} (Player ID ${result.id}).`;
      event.target.reset();
    } else {
      statusEl.textContent = result.error || "Failed to add player.";
    }
  } catch (err) {
    statusEl.textContent = `Failed to add player: ${err.message}`;
  }
});
