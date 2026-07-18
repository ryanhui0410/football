const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const simpleGit = require('simple-git');
const git = simpleGit();
const app = express();
app.use(express.json());
app.use(cors());

// --- Helpers ---
async function commitAndPush(message) {
  try {
    // 添加所有变更（包括 JSON 文件）
    await git.add('.');
    await git.commit(message);
    await git.push();
    console.log(`✅ Git sync: ${message}`);
  } catch (err) {
    console.error('❌ Git sync failed:', err);
    // 注意：即使 Git 同步失败，本地文件已保存，不影响数据持久化
  }
}
function computeGoal(leftFoot, rightFoot, head) {
  const lf = parseInt(leftFoot) || 0;
  const rf = parseInt(rightFoot) || 0;
  const h = parseInt(head) || 0;
  return lf + rf + h;
}

function computeSymbol(goal, assist) {
  const g = parseInt(goal) || 0;
  const a = parseInt(assist) || 0;
  const ball = String.fromCodePoint(0x26BD);   // ⚽
  const shoe = String.fromCodePoint(0x1F45F);  // 👟
  return ball.repeat(g) + shoe.repeat(a);
}
function computeGoalContribution(goal, assist) {
  return (parseInt(goal) || 0) + (parseInt(assist) || 0);
}
// --- Profile management ---
const PROFILES_PATH = path.join(__dirname, "src", "contributor_profiles.json");

// Helper to read/write profiles
function readProfiles() {
  if (!fs.existsSync(PROFILES_PATH)) return {};
  const content = fs.readFileSync(PROFILES_PATH, "utf8");
  return content.trim() ? JSON.parse(content) : {};
}

function writeProfiles(profiles) {
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2));
}

// GET all contributor profiles
app.get("/contributor-profiles", (req, res) => {
  const profiles = readProfiles();
  res.json(profiles);
});

// POST / update a single contributor's profile
app.post("/contributor-profile", (req, res) => {
  const { name, profile } = req.body; // profile contains picture, position, PAC, SHO, etc.
  if (!name) return res.status(400).json({ message: "Missing contributor name" });
  
  const profiles = readProfiles();
  profiles[name] = { ...profiles[name], ...profile };
  writeProfiles(profiles);
  res.json({ message: "Profile updated", updated: profiles[name] });
});
// --- Player Attributes (read/write file) ---
const ATTR_PATH = path.join(__dirname, 'src', 'player_attributes.json');

// GET all attributes
app.get('/player-attributes', (req, res) => {
  if (!fs.existsSync(ATTR_PATH)) return res.json([]);
  const content = fs.readFileSync(ATTR_PATH, 'utf8');
  res.json(JSON.parse(content));
});

// POST – update one contributor's attributes
app.post('/player-attributes', (req, res) => {
  const { contributor, updates } = req.body;
  if (!contributor) return res.status(400).json({ error: 'Missing contributor' });

  let data = [];
  if (fs.existsSync(ATTR_PATH)) {
    const content = fs.readFileSync(ATTR_PATH, 'utf8');
    if (content.trim()) data = JSON.parse(content);
  }

  // Find the contributor's entry
  const index = data.findIndex(item => item.Contributor === contributor);
  if (index === -1) {
    // If not found, create a new entry with default values
    const newEntry = { Contributor: contributor, ...updates };
    data.push(newEntry);
  } else {
    data[index] = { ...data[index], ...updates };
  }

  fs.writeFileSync(ATTR_PATH, JSON.stringify(data, null, 2));
  res.json({ message: 'Updated', updated: data.find(item => item.Contributor === contributor) });
});
// --- POST /add-stats ---
app.post("/add-stats", (req, res) => {
  const newStat = req.body;
  const filePath = path.join(__dirname, "src", "football_stats_2025_2026.json");

  let data = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    if (fileContent.trim()) data = JSON.parse(fileContent);
  }

  // 1. Compute Goal from Left Foot, Right Foot, Head
  const goal = computeGoal(newStat["Left Foot"], newStat["Right Foot"], newStat["Head"]);
  newStat.Goal = goal;

  // 2. Compute Symbol using the computed Goal and existing Assist
  newStat.Symbol = computeSymbol(goal, newStat.Assist);

  // 3. Compute Goal Contribution
  newStat["Goal Contribution"] = computeGoalContribution(newStat.Goal, newStat.Assist);

  data.push(newStat);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  commitAndPush(`Add stats for ${newStat.Contributor} (${new Date().toISOString()})`)
    .catch(console.error);
  res.json({
    message: "✅ Stat added successfully",
    symbol: newStat.Symbol,
    totalRecords: data.length
  });
});

// --- GET /stats --- (unchanged)
app.get("/stats", (req, res) => {
  const filePath = path.join(__dirname, "src", "football_stats_2025_2026.json");
  if (!fs.existsSync(filePath)) return res.json([]);
  const fileContent = fs.readFileSync(filePath, "utf8");
  if (!fileContent.trim()) return res.json([]);
  const data = JSON.parse(fileContent);
  res.json(data);
});

// --- PUT /modify-stats/:index ---
app.put("/modify-stats/:index", (req, res) => {
  const filePath = path.join(__dirname, "src", "football_stats_2025_2026.json");
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });

  const fileContent = fs.readFileSync(filePath, "utf8");
  let data = JSON.parse(fileContent);

  const index = parseInt(req.params.index);
  if (index < 0 || index >= data.length) {
    return res.status(400).json({ message: "Invalid index" });
  }

  // Merge incoming updates with the existing record
  const updatedRecord = { ...data[index], ...req.body };

  // 1. Recompute Goal from (possibly updated) Left Foot, Right Foot, Head
  const goal = computeGoal(
    updatedRecord["Left Foot"],
    updatedRecord["Right Foot"],
    updatedRecord["Head"]
  );
  updatedRecord.Goal = goal;

  // 2. Recompute Symbol using the new Goal and (possibly updated) Assist
  updatedRecord.Symbol = computeSymbol(goal, updatedRecord.Assist);

  // 3. Recompute Goal Contribution = Goal + Assist
  updatedRecord["Goal Contribution"] = computeGoalContribution(goal, updatedRecord.Assist);

  // Save back
  data[index] = updatedRecord;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  // 异步提交到 Git
  const contributor = updatedRecord.Contributor || 'unknown';
  commitAndPush(`Modify stats for ${contributor} (${new Date().toISOString()})`)
    .catch(console.error);

  res.json({
    message: "✅ Stat modified successfully",
    updated: updatedRecord
  });
});
// --- GET /stats-history --- (unchanged)
app.get("/stats-history", (req, res) => {
  const filePath = path.join(__dirname, "src", "football_stats_2025_2026.json");
  if (!fs.existsSync(filePath)) return res.json({ history: [] });
  const fileContent = fs.readFileSync(filePath, "utf8");
  if (!fileContent.trim()) return res.json({ history: [] });
  const data = JSON.parse(fileContent);

  const contributors = [...new Set(data.map(d => d.Contributor).filter(Boolean))];
  const locations = [...new Set(data.map(d => d.Location).filter(Boolean))];
  const times = [...new Set(data.map(d => d.Time).filter(Boolean))];
  const sources = [...new Set(data.map(d => d.source).filter(Boolean))];

  res.json({ contributors, locations, times, sources });
});

// --- Static serving --- (unchanged)
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));