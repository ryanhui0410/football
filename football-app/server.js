const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// Increase the JSON payload limit to 10 Megabytes to allow base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// ===================== GitHub API Sync Helper =====================
async function syncFileToGitHub(localFilePath, githubFilePath, commitMessage) {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      console.error("❌ CRITICAL: GitHub Env Vars missing! Check Render Dashboard.");
      return;
    }

    if (!fs.existsSync(localFilePath)) {
      console.warn(`⚠️ Local file not found: ${localFilePath}`);
      return;
    }

    const content = fs.readFileSync(localFilePath);
    // Check file size (GitHub API limit is ~1MB)
    if (content.length > 900000) {
        console.error(`❌ FILE TOO LARGE: ${content.length} bytes. GitHub API limit is ~1MB.`);
        return;
    }
    
    const contentBase64 = content.toString("base64");
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${githubFilePath}`;

    // 1. Get SHA
    let sha = "";
    try {
      const getRes = await fetch(apiUrl, {
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch (e) { /* File might not exist yet */ }

    // 2. Push Update
    const body = {
      message: commitMessage,
      content: contentBase64,
      branch: "main"
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    // 🕵️‍♂️ VERBOSE LOGGING
    const responseText = await putRes.text();
    if (putRes.ok) {
      const result = JSON.parse(responseText);
      console.log(`✅ GitHub sync SUCCESS!`);
      console.log(`🔗 VIEW FILE HERE: ${result.content?.html_url || 'URL not returned'}`);
      console.log(`🔗 VIEW COMMIT HERE: ${result.commit?.html_url || 'URL not returned'}`);
    } else {
      console.error(`❌ GitHub sync FAILED (${putRes.status}):`, responseText);
    }

  } catch (err) {
    console.error("❌ GitHub sync CRITICAL error:", err);
  }
}

// ===================== Helpers =====================

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

function computeGoal(leftFoot, rightFoot, head, other) {
  return (parseFloat(leftFoot) || 0)
       + (parseFloat(rightFoot) || 0)
       + (parseFloat(head) || 0)
       + (parseFloat(other) || 0);
}

// ✅ Accept BOTH camelCase (from form) and spaced (from old data)
function formatStat(raw) {
  const leftFoot  = raw["Left Foot"]       ?? raw.LeftFoot       ?? 0;
  const rightFoot = raw["Right Foot"]      ?? raw.RightFoot      ?? 0;
  const head      = raw.Head               ?? 0;
  const other     = raw["Other body parts"] ?? raw.OtherBodyParts ?? 0;
  const assist    = raw.Assist             ?? 0;
  const rating    = raw.Rating             ?? 0;

  const motm = raw["Man of the Match"] ?? raw.ManOfTheMatch ?? false;

  const cName = (raw.Contributor || "").trim().toLowerCase();
  const assistRecipient = cName === "ryan" ? "Darren" : cName === "darren" ? "Ryan" : "";
  const assistToCount = parseFloat(raw.AssistToCount ?? raw["Assist to count"] ?? raw.AssistTo ?? 0) || 0;
  const finalAssistTo = (assistRecipient && assistToCount > 0) ? assistRecipient : "";

  const goal = computeGoal(leftFoot, rightFoot, head, other);

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
    "Match result":    raw["Match result"] ?? raw.MatchResult ?? "",
    "Win/Loss?":       raw["Win/Loss?"]    ?? raw.WinLoss    ?? "",
    "Assist to":       finalAssistTo,
    "Assist to count": assistToCount,
    "Man of the Match": motm,
  };
}

// ===================== Stats file I/O =====================

const STATS_PATH = path.join(__dirname, "football-app", "src", "football_stats_2025_2026.json");

function readStats() {
  if (!fs.existsSync(STATS_PATH)) return [];
  const content = fs.readFileSync(STATS_PATH, "utf8");
  return content.trim() ? JSON.parse(content) : [];
}

function writeStats(data) {
  fs.writeFileSync(STATS_PATH, JSON.stringify(data, null, 2));
}

// ===================== Profile management =====================

const PROFILES_PATH = path.join(__dirname, "football-app", "src", "contributor_profiles.json");

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

app.post("/contributor-profile", async (req, res) => {
  const { name, profile } = req.body;
  if (!name) return res.status(400).json({ message: "Missing contributor name" });
  const profiles = readProfiles();
  profiles[name] = { ...profiles[name], ...profile };
  writeProfiles(profiles);
  
  await syncFileToGitHub(PROFILES_PATH, "football-app/src/contributor_profiles.json", `Update profile for ${name}`);
  
  res.json({ message: "Profile updated", updated: profiles[name] });
});

// ===================== Player Attributes (FIFA Cards) =====================

const ATTR_PATH = path.join(__dirname, "football-app", "src", "player_attributes.json");

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

app.post("/player-attributes", async (req, res) => {
  try {
    const card = req.body;
    if (!card || !card.Contributor) {
      return res.status(400).json({ error: "Missing Contributor name" });
    }

    // Handle Image Upload
    if (card.picture && typeof card.picture === 'string' && card.picture.startsWith("data:image")) {
      try {
        const base64Data = card.picture.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        const imagesDir = path.join(__dirname, "football-app", "public", "images");
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
        
        const safeName = card.Contributor.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, "_");
        const fileName = `${safeName}.jpeg`;
        const filePath = path.join(imagesDir, fileName);
        
        fs.writeFileSync(filePath, imageBuffer);
        card.picture = `/images/${fileName}`;
        
        // 📸 Sync the image to GitHub as well!
        await syncFileToGitHub(filePath, `football-app/public/images/${fileName}`, `Update profile picture: ${card.Contributor}`);
      } catch (imgErr) {
        console.error("❌ Failed to save image:", imgErr);
      }
    }

    const data = readAttributes();
    const index = data.findIndex(a => 
      (a.Contributor || "").trim().toLowerCase() === card.Contributor.trim().toLowerCase()
    );

    if (index === -1) {
      data.push(card);
    } else {
      data[index] = { ...data[index], ...card };
    }

    writeAttributes(data);

    await syncFileToGitHub(ATTR_PATH, "football-app/src/player_attributes.json", `Update player card: ${card.Contributor}`);

    res.json({ message: "✅ Player card saved", updated: index === -1 ? card : data[index] });
  } catch (error) {
    console.error("❌ CRITICAL ERROR saving player card:", error);
    res.status(500).json({ error: "Failed to save player card", details: error.message });
  }
});

app.delete("/player-attributes/:name", async (req, res) => {
  const name = req.params.name;
  let data = readAttributes();
  const initialLength = data.length;
  data = data.filter((c) => c.Contributor !== name);
  
  if (data.length === initialLength) {
    return res.status(404).json({ error: "Player not found" });
  }

  writeAttributes(data);
  await syncFileToGitHub(ATTR_PATH, "football-app/src/player_attributes.json", `Delete player card: ${name}`);

  res.json({ message: "Player card deleted" });
});

// ===================== Match Lineups =====================
const LINEUPS_PATH = path.join(__dirname, "football-app", "src", "match_lineups.json");

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
    
    console.log("📥 Received lineup payload:", JSON.stringify({
      date: lineup.date,
      location: lineup.location, 
      time: lineup.time,
      hasTeamA: !!lineup.teamA,
      hasTeamB: !!lineup.teamB
    }, null, 2));

    if (!lineup.date) return res.status(400).json({ error: "Missing date" });

    const data = readLineups();
    
    const normDate = (lineup.date || "").trim();
    const normLoc  = (lineup.location || "").trim();
    const normTime = (lineup.time || "").trim();

    const index = data.findIndex(l => 
      (l.date || "").trim() === normDate && 
      (l.location || "").trim() === normLoc && 
      (l.time || "").trim() === normTime
    );

    const normalizedLineup = {
      date: normDate,
      location: normLoc,
      time: normTime,
      teamA: lineup.teamA || { formation: "4-4-2", players: [] },
      teamB: lineup.teamB || { formation: "4-4-2", players: [] }
    };

    if (index === -1) {
      data.push(normalizedLineup);
      console.log(`➕ Created NEW lineup for ${normDate}`);
    } else {
      data[index] = normalizedLineup;
      console.log(`🔄 UPDATED existing lineup at index ${index}`);
    }

    writeLineups(data);

    await syncFileToGitHub(LINEUPS_PATH, "football-app/src/match_lineups.json", `Update lineup for ${normDate}`);

    res.json({ message: "✅ Lineup saved", index, isNew: index === -1 });
  } catch (err) {
    console.error("❌ Lineup save error:", err);
    res.status(500).json({ error: "Failed to save lineup", details: err.message });
  }
});

app.get("/match-lineups", (req, res) => {
  res.json(readLineups());
});

// ===================== POST /add-stats =====================

app.post("/add-stats", async (req, res) => {
  const raw = req.body;

  if (!raw || !raw.Contributor) {
    return res.status(400).json({ message: "❌ Missing contributor" });
  }

  const data = readStats();
  const newStat = formatStat(raw);

  data.push(newStat);
  writeStats(data);

  await syncFileToGitHub(STATS_PATH, "football-app/src/football_stats_2025_2026.json", `Add stats for ${newStat.Contributor}`);

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

app.put("/modify-stats/:index", async (req, res) => {
  const data = readStats();
  const index = parseInt(req.params.index);

  if (index < 0 || index >= data.length) {
    return res.status(400).json({ message: "Invalid index" });
  }

  const merged = { ...data[index], ...req.body };
  const updatedRecord = formatStat(merged);

  data[index] = updatedRecord;
  writeStats(data);

  await syncFileToGitHub(STATS_PATH, "football-app/src/football_stats_2025_2026.json", `Modify stats for ${updatedRecord.Contributor}`);

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
const buildPath = path.join(__dirname, "football-app", "build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.log("ℹ️  Running in API-only mode (no frontend build folder found)");
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));