// Paste this into: Google Sheet > Extensions > Apps Script > Code.gs
// Then deploy: Deploy > New deployment > Type "Web app"
//   Execute as: Me
//   Who has access: Anyone
// Copy the resulting Web App URL into admin.js (ADMIN_ENDPOINT_URL).
//
// Expected sheet columns (row 1 headers): Player ID | Player First name | Player Last Name | Batting Skill | Bowling Skill

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  var firstName = (data.firstName || "").toString().trim();
  var lastName = (data.lastName || "").toString().trim();
  var batting = Number(data.battingSkill) || 0;
  var bowling = Number(data.bowlingSkill) || 0;

  if (!firstName || !lastName) {
    return jsonResponse({ success: false, error: "First and last name are required." });
  }
  if (batting + bowling !== 100) {
    return jsonResponse({ success: false, error: "Batting Skill + Bowling Skill must add up to 100." });
  }

  var newId = sheet.getLastRow(); // header occupies row 1, so lastRow == next player id
  sheet.appendRow([newId, firstName, lastName, batting, bowling]);

  return jsonResponse({ success: true, id: newId });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
