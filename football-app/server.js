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

// ✅ Single version – parseFloat, camelCase keys
function computeGoal(leftFoot, rightFoot, head) {
  return (parseFloat(leftFoot) || 0)
       + (parseFloat(rightFoot) || 0)
       + (parseFloat(head) || 0);
}

function computeSymbol(goal, assist) {
  const g = parseInt(goal) || 0;
  const a = parseInt(assist) || 0;
  const ball = String.fromCodePoint(0x26bd); // ⚽
  const shoe = String.fromCodePoint(0x1f45f); // 👟
  return ball.repeat(g) + shoe.repeat(a);
}

function computeGoalContribution(goal, assist) {
  return (parseInt(goal) || 0) + (parseInt(assist) || 0);
}

// ✅ Convert string fields → numbers
function toNumbers(stat) {
  const numFields = [
    "Goal", "Assist", "Rating", "LeftFoot", "RightFoot",
    "Head", "OtherBodyParts", "Goal Contribution", "Error",
  ];
  numFields.forEach((field) => {
    if (stat[field] !== undefined && stat[field] !== "") {
      stat[field] = parseFloat(stat[field]) || 0;
    }
  });
  return stat;
}

// ✅ Shared helper to read the stats JSON
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
  const newStat = req.body;

  if (!newStat || !newStat.Contributor) {
    return res.status(400).json({ message: "❌ Missing contributor" });
  }

  // ✅ Read existing data FIRST
  const data = readStats();

  // 1. Compute Goal (camelCase keys)
  const goal = computeGoal(newStat.LeftFoot, newStat.RightFoot, newStat.Head);
  newStat.Goal = goal;

  // 2. Compute Symbol
  newStat.Symbol = computeSymbol(goal, newStat.Assist);

  // 3. Compute Goal Contribution
  newStat["Goal Contribution"] = computeGoalContribution(goal, newStat.Assist);

  // 4. Convert strings → numbers
  toNumbers(newStat);

  data.push(newStat);
  writeStats(data);

  commitAndPush(`Add stats for ${newStat.Contributor} (${new Date().toISOString()})`).catch(
    console.error
  );

  res.json({
    message: "✅ Stat added successfully",
    symbol: newStat.Symbol,
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

  const updatedRecord = { ...data[index], ...req.body };

  const goal = computeGoal(updatedRecord.LeftFoot, updatedRecord.RightFoot, updatedRecord.Head);
  updatedRecord.Goal = goal;
  updatedRecord.Symbol = computeSymbol(goal, updatedRecord.Assist);
  updatedRecord["Goal Contribution"] = computeGoalContribution(goal, updatedRecord.Assist);
  toNumbers(updatedRecord);

  data[index] = updatedRecord;
  writeStats(data);

  const contributor = updatedRecord.Contributor || "unknown";
  commitAndPush(`Modify stats for ${contributor} (${new Date().toISOString()})`).catch(
    console.error
  );

  res.json({ message: "✅ Stat modified successfully", updated: updatedRecord });
});

// ===================== GET /stats-history =====================

app.get("/stats-history", (req, res) => {
  const data = readStats();
  res.json({
    contributors: [...new Set(data.map((d) => d.Contributor).filter(Boolean))],
    locations: [...new Set(data.map((d) => d.Location).filter(Boolean))],
    times: [...new Set(data.map((d) => d.Time).filter(Boolean))],
    sources: [...new Set(data.map((d) => d.source).filter(Boolean))],
  });
});

// ===================== Static serving =====================

app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));