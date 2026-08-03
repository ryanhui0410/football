const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const simpleGit = require("simple-git");
const git = simpleGit();
const app = express();
app.use(express.json());
app.use(cors());

// ===================== Helpers =====================

async function commitAndPush(message) {
  try {
    await git.add(".");
    await git.commit(message);
    await git.push();
    console.log(`✅ Git sync: ${message}`);
  } catch (err) {
    console.error("❌ Git sync failed:", err);
  }
}

function computeGoal(leftFoot, rightFoot, head) {
  return (parseFloat(leftFoot) || 0)
       + (parseFloat(rightFoot) || 0)
       + (parseFloat(head) || 0);
}

function computeSymbol(goal, assist) {
  const g = parseInt(goal) || 0;
  const a = parseInt(assist) || 0;
  const ball = String.fromCodePoint(0x26bd);  // ⚽
  const shoe = String.fromCodePoint(0x1f45f); // 👟
  return ball.repeat(g) + shoe.repeat(a);
}

function computeGoalContribution(goal, assist) {
  return (parseInt(goal) || 0) + (parseInt(assist) || 0);
}

// ✅ Season: Aug–Jul cycle
function computeSeason(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  const month = parseInt(parts[0]);
  const year  = parseInt(parts[2]);
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

// ✅ Accept BOTH camelCase (from form) and spaced (from old data)
//    Output ALWAYS in the standard spaced format
function formatStat(raw) {
  const leftFoot  = raw["Left Foot"]       ?? raw.LeftFoot       ?? 0;
  const rightFoot = raw["Right Foot"]      ?? raw.RightFoot      ?? 0;
  const head      = raw.Head               ?? 0;
  const other     = raw["Other body parts"] ?? raw.OtherBodyParts ?? 0;
  const assist    = raw.Assist             ?? 0;
  const rating    = raw.Rating             ?? 0;
    // Assist-to recipient (Ryan ↔ Darren), saved only when meaningful
  const cName = (raw.Contributor || "").trim().toLowerCase();
  const assistRecipient = cName === "ryan" ? "Darren" : cName === "darren" ? "Ryan" : "";
  const assistToCount = assistRecipient ? (parseFloat(raw.AssistTo) || 0) : 0;
  const goal = computeGoal(leftFoot, rightFoot, head, other);

  // ✅ Fixed field order matching 8/3/2025 format
  return {
    Date:              raw.Date,
    Contributor:       raw.Contributor,
    Symbol:            computeSymbol(goal, assist),
    Goal:              parseFloat(goal) || 0,
    Assist:            parseFloat(assist) || 0,
    Rating:            parseFloat(rating) || 0,
    Location:          raw.Location,
    Time:              raw.Time,
    "Goal Contribution": computeGoalContribution(goal, assist),
    source:            raw.source,
    "Left Foot":       parseFloat(leftFoot) || 0,
    "Right Foot":      parseFloat(rightFoot) || 0,
    Head:              parseFloat(head) || 0,
    "Other body parts": parseFloat(other) || 0,
    Season:            computeSeason(raw.Date),
    "Match result":    raw["Match result"] ?? raw.MatchResult ?? "",   // ← new
    "Win/Loss?":       raw["Win/Loss?"]    ?? raw.WinLoss    ?? "",   // ← new
    "Assist to":       assistToCount > 0 ? assistRecipient : "",
    "Assist to count": assistToCount,
  };
}

// ===================== Stats file I/O =====================

const STATS_PATH = path.join(__dirname, "src", "football_stats_2025_2026.json");

function readStats() {
  if (!fs.existsSync(STATS_PATH)) return [];
  const content = fs.readFileSync(STATS_PATH, "utf8");
  return content.trim() ? JSON.parse(content) : [];
}

function writeStats(data) {
  fs.writeFileSync(STATS_PATH, JSON.stringify(data, null, 2));
}

// ===================== Profile management =====================

const PROFILES_PATH = path.join(__dirname, "src", "contributor_profiles.json");

function readProfiles() {
  if (!fs.existsSync(PROFILES_PATH)) return {};
  const content = fs.readFileSync(PROFILES_PATH, "utf8");
  return content.trim() ? JSON.parse(content) : {};
}

function writeProfiles(profiles) {
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2));
}

function computeGoal(leftFoot, rightFoot, head, other) {
  return (parseFloat(leftFoot) || 0)
       + (parseFloat(rightFoot) || 0)
       + (parseFloat(head) || 0)
       + (parseFloat(other) || 0);
}

app.get("/contributor-profiles", (req, res) => {
  res.json(readProfiles());
});

app.post("/contributor-profile", (req, res) => {
  const { name, profile } = req.body;
  if (!name) return res.status(400).json({ message: "Missing contributor name" });
  const profiles = readProfiles();
  profiles[name] = { ...profiles[name], ...profile };
  writeProfiles(profiles);
  res.json({ message: "Profile updated", updated: profiles[name] });
});

// ===================== Player Attributes =====================

const ATTR_PATH = path.join(__dirname, "src", "player_attributes.json");

app.get("/player-attributes", (req, res) => {
  if (!fs.existsSync(ATTR_PATH)) return res.json([]);
  const content = fs.readFileSync(ATTR_PATH, "utf8");
  res.json(JSON.parse(content));
});

app.post("/player-attributes", (req, res) => {
  const { contributor, updates } = req.body;
  if (!contributor) return res.status(400).json({ error: "Missing contributor" });

  let data = [];
  if (fs.existsSync(ATTR_PATH)) {
    const content = fs.readFileSync(ATTR_PATH, "utf8");
    if (content.trim()) data = JSON.parse(content);
  }

  const index = data.findIndex((item) => item.Contributor === contributor);
  if (index === -1) {
    data.push({ Contributor: contributor, ...updates });
  } else {
    data[index] = { ...data[index], ...updates };
  }

  fs.writeFileSync(ATTR_PATH, JSON.stringify(data, null, 2));
  res.json({ message: "Updated", updated: data.find((i) => i.Contributor === contributor) });
});

// ===================== POST /add-stats =====================

app.post("/add-stats", (req, res) => {
  const raw = req.body;

  if (!raw || !raw.Contributor) {
    return res.status(400).json({ message: "❌ Missing contributor" });
  }

  const data = readStats();

  // ✅ Normalize → standard format with Season
  const newStat = formatStat(raw);

  data.push(newStat);
  writeStats(data);

  commitAndPush(`Add stats for ${newStat.Contributor} (${new Date().toISOString()})`).catch(
    console.error
  );

  res.json({
    message: "✅ Stat added successfully",
    symbol: newStat.Symbol,
    season: newStat.Season,
    totalRecords: data.length,
  });
});

// ===================== GET /stats =====================

app.get("/stats", (req, res) => {
  res.json(readStats());
});

// ===================== PUT /modify-stats/:index =====================

app.put("/modify-stats/:index", (req, res) => {
  const data = readStats();
  const index = parseInt(req.params.index);

  if (index < 0 || index >= data.length) {
    return res.status(400).json({ message: "Invalid index" });
  }

  // Merge old record with incoming updates, then normalize
  const merged = { ...data[index], ...req.body };
  const updatedRecord = formatStat(merged);

  data[index] = updatedRecord;
  writeStats(data);

  commitAndPush(
    `Modify stats for ${updatedRecord.Contributor} (${new Date().toISOString()})`
  ).catch(console.error);

  res.json({ message: "✅ Stat modified successfully", updated: updatedRecord });
});

// ===================== GET /stats-history =====================

app.get("/stats-history", (req, res) => {
  const data = readStats();
  res.json({
    contributors: [...new Set(data.map((d) => d.Contributor).filter(Boolean))],
    locations:    [...new Set(data.map((d) => d.Location).filter(Boolean))],
    times:        [...new Set(data.map((d) => d.Time).filter(Boolean))],
    sources:      [...new Set(data.map((d) => d.source).filter(Boolean))],
  });
});

// ===================== Static serving =====================

app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));