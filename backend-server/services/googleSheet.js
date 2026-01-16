const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../config/serviceAccount.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

async function writeToSheet(data) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: "1hBeQUxpK_131Ku6q721e-YyJBxCBHtmQzOiq9BYC4uk",
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        data.empId,
        data.login,
        data.logout,
        data.breakTime
      ]]
    }
  });
}

module.exports = { writeToSheet };
