// saveJson.js
const fs = require("fs");
const XLSX = require("xlsx");

const sheetName = "2025-2026";
const workbook = XLSX.readFile("../public/football stats.xlsx");
const sheet = workbook.Sheets[sheetName];
if (!sheet) {
  console.error(`Sheet "${sheetName}" not found`);
  process.exit(1);
}

// read raw rows
const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2 });
const labels = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 1 })[0];

// helper: Excel serial → JS Date
function excelDateToJSDate(serial) {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  const fractionalDay = serial - Math.floor(serial);
  const totalSeconds = Math.floor(86400 * fractionalDay);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  dateInfo.setHours(hours, minutes, seconds);
  return dateInfo;
}

// helper: format date/time nicely
function formatDate(dateObj) {
  return dateObj.toLocaleDateString("en-US"); // e.g. 6/21/2026
}
function formatTime(dateObj) {
  return dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }); // e.g. 8:00 PM
}

// map rows to objects
const formatted = jsonData.map((row) => {
  const obj = {};
  labels.forEach((label, i) => {
    let value = row[i];
    if (label.toLowerCase() === "date" && typeof value === "number") {
      value = formatDate(excelDateToJSDate(value));
    }
    if (label.toLowerCase() === "time" && typeof value === "number") {
      value = formatTime(excelDateToJSDate(value));
    }
    obj[label] = value;
  });
  return obj;
});

fs.writeFileSync("./football_stats_2025_2026.json", JSON.stringify(formatted, null, 2));
console.log("✅ JSON saved to src/football_stats_2025_2026.json");
