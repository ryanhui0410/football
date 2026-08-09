const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const simpleGit = require("simple-git");
const git = simpleGit();
const app = express();
// Increase the JSON payload limit to 10 Megabytes to allow base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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

// ===================== Player Attributes (FIFA Cards) =====================

const ATTR_PATH = path.join(__dirname, "src", "player_attributes.json");

function readAttributes() {
  if (!fs.existsSync(ATTR_PATH)) return [];
  const content = fs.readFileSync(ATTR_PATH, "utf8");
  return content.trim() ? JSON.parse(content) : [];
}

function writeAttributes(data) {
  fs.writeFileSync(ATTR_PATH, JSON.stringify(data, null, 2));
}

app.get("/player-attributes", (req, res) => {
  res.json(readAttributes());
});

app.post("/player-attributes", async (req, res) => { // <-- Added 'async' here
  try {
    const card = req.body;
    console.log(`\n📥 [PLAYER CARD] Received payload for: ${card.Contributor}`);

    if (!card || !card.Contributor) {
      return res.status(400).json({ error: "Missing Contributor name" });
    }

    // 🔄 1. PULL LATEST DATA FROM GITHUB *BEFORE* WE TOUCH THE FILE
    try {
      await git.pull('origin', 'main', ['--rebase']);
      console.log("⬇️ Pulled latest data from GitHub before saving.");
    } catch (pullErr) {
      console.log("⚠️ Could not pull from GitHub (offline or no changes). Continuing with local save.");
    }

    // 🖼️ 2. Handle Image Upload (Decode base64 and save to public/images)
    if (card.picture && typeof card.picture === 'string' && card.picture.startsWith("data:image")) {
      try {
        const base64Data = card.picture.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        
        const imagesDir = path.join(__dirname, "public", "images");
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
        
        const safeName = card.Contributor.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, "_");
        const fileName = `${safeName}.jpeg`;
        const filePath = path.join(imagesDir, fileName);
        
        fs.writeFileSync(filePath, imageBuffer);
        card.picture = `/images/${fileName}`;
      } catch (imgErr) {
        console.error("❌ Failed to save image:", imgErr);
      }
    }

    // 3. NOW read the file (it now contains the latest remote data!)
    const data = readAttributes();
    const index = data.findIndex((item) => item.Contributor === card.Contributor);

    if (index === -1) {
      data.push(card);
      console.log(`➕ Added NEW player: ${card.Contributor}`);
    } else {
      data[index] = { ...data[index], ...card };
      console.log(`🔄 UPDATED existing player: ${card.Contributor}`);
    }

    // 4. Write to file
    writeAttributes(data);

    // 5. Commit and Push
    await git.add(".");
    try {
      await git.commit(`Update player card: ${card.Contributor} (${new Date().toISOString()})`);
      await git.push('origin', 'main');
      console.log(`✅ Git sync successful!`);
    } catch (gitErr) {
      // If there was nothing to commit, it throws an error. We can ignore it.
      if (!gitErr.message.includes("nothing to commit")) {
         console.error("⚠️ Git push warning:", gitErr.message);
      }
    }

    res.json({ message: "✅ Player card saved successfully", updated: index === -1 ? card : data[index] });

  } catch (error) {
    console.error("❌ CRITICAL ERROR saving player card:", error);
    res.status(500).json({ error: "Failed to save player card", details: error.message });
  }
});

// Optional: Delete endpoint if you ever want to remove a card
app.delete("/player-attributes/:name", (req, res) => {
  const name = req.params.name;
  let data = readAttributes();
  const initialLength = data.length;
  data = data.filter((c) => c.Contributor !== name);
  
  if (data.length === initialLength) {
    return res.status(404).json({ error: "Player not found" });
  }

  writeAttributes(data);
  commitAndPush(`Delete player card: ${name}`).catch(console.error);

  res.json({ message: "Player card deleted" });
});
// ===================== Match Lineups =====================
const LINEUPS_PATH = path.join(__dirname, "src", "match_lineups.json");

function readLineups() {
  if (!fs.existsSync(LINEUPS_PATH)) return [];
  const content = fs.readFileSync(LINEUPS_PATH, "utf8");
  return content.trim() ? JSON.parse(content) : [];
}

function writeLineups(data) {
  fs.writeFileSync(LINEUPS_PATH, JSON.stringify(data, null, 2));
}

app.post("/match-lineups", async (req, res) => {
  try {
    const lineup = req.body;
    if (!lineup.date) return res.status(400).json({ error: "Missing date" });

    // Pull latest before saving to avoid conflicts
    await git.pull('origin', 'main', ['--rebase']).catch(() => {});

    const data = readLineups();
    const index = data.findIndex(l => l.date === lineup.date);

    if (index === -1) data.push(lineup);
    else data[index] = lineup;

    writeLineups(data);

    await git.add(".");
    await git.commit(`Update lineup for ${lineup.date}`);
    await git.push('origin', 'main');

    res.json({ message: "✅ Lineup saved" });
  } catch (err) {
    console.error("Lineup save error:", err);
    res.status(500).json({ error: "Failed to save lineup" });
  }
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