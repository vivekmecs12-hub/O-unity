// Paste this into: Google Sheet > Extensions > Apps Script > Code.gs
// Then deploy: Deploy > New deployment > Type "Web app"
//   Execute as: Me
//   Who has access: Anyone
// Copy the resulting Web App URL into config.js (ADMIN_ENDPOINT_URL).
//
// Expected sheet columns (row 1 headers): Player ID | Player First name | Player Last Name | Batting Skill | Bowling Skill

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var values = sheet.getDataRange().getValues();
  return jsonResponse({ headers: values[0], rows: values.slice(1) });
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data.action === "delete") {
    return handleDelete(data);
  }
  if (data.action === "update") {
    return handleUpdate(data);
  }
  return handleAdd(data);
}

function handleAdd(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

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

function handleDelete(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var playerId = Number(data.playerId);
  var values = sheet.getDataRange().getValues();

  // values[0] is the header row; sheet rows are 1-indexed
  for (var i = 1; i < values.length; i++) {
    if (Number(values[i][0]) === playerId) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ success: false, error: "Player not found." });
}

function handleUpdate(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var playerId = Number(data.playerId);

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

  var values = sheet.getDataRange().getValues();
  // values[0] is the header row; sheet rows are 1-indexed
  for (var i = 1; i < values.length; i++) {
    if (Number(values[i][0]) === playerId) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[firstName, lastName, batting, bowling]]);
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ success: false, error: "Player not found." });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
