const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// Reverted to standard JSON limits (removed 10mb limit used for base64 images)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cors());
// Frontend Helper: Compress & Fix Smartphone Images
const sharp = require('sharp');

app.post("/process-image", async (req, res) => {
  try {
    // Assuming frontend sends the raw base64 string
    const base64String = req.body.image; 
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Sharp automatically reads EXIF data, fixes rotation, and converts HEIC to JPEG
    const processedBuffer = await sharp(imageBuffer)
      .rotate()                                  // 📱 Fixes smartphone sideways EXIF errors!
      .resize({ width: 800, withoutEnlargement: true }) // 📏 Shrinks massive files
      .jpeg({ quality: 70, mozjpeg: true })      // 🗜️ Compresses and ensures standard JPEG format
      .toBuffer();

    const finalBase64 = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
    
    res.json({ success: true, image: finalBase64 });
  } catch (err) {
    console.error("Backend Image Decode Error:", err);
    res.status(500).json({ error: "Failed to decode/process smartphone image" });
  }
});
async function syncFileToGitHub(localFilePath, githubFilePath, commitMessage) {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) return { success: false, error: "Missing GitHub Env Vars" };
    if (!fs.existsSync(localFilePath)) return { success: false, error: "Local file not found" };

    let contentString = fs.readFileSync(localFilePath, 'utf8');
    
    if (localFilePath.endsWith('.json')) {
      try {
        const parsed = JSON.parse(contentString);
        const recordCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
        console.log(`📦 [PUSH] Sending ${recordCount} records to GitHub: ${githubFilePath}`);
        
        // Log first and last record names if it's an array
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`   First: ${parsed[0].Contributor || 'unnamed'}`);
          console.log(`   Last: ${parsed[parsed.length - 1].Contributor || 'unnamed'}`);
        }
        
        contentString = JSON.stringify(parsed, null, 2); 
      } catch (e) {
        console.error("❌ Failed to parse/minify JSON:", e.message);
      }
    }

    const contentBuffer = Buffer.from(contentString, 'utf8');
    if (contentBuffer.length > 950000) return { success: false, error: `File too large: ${contentBuffer.length} bytes` };
    
    const contentBase64 = contentBuffer.toString("base64");
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${githubFilePath}`;

    let sha = "";
    try {
      const getRes = await fetch(apiUrl, {
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" }
      });
      if (getRes.ok) {
        sha = (await getRes.json()).sha;
      } else if (getRes.status !== 404) {
        return { success: false, error: `Failed to get SHA (${getRes.status})` };
      }
    } catch (e) {
      return { success: false, error: `Network error getting SHA` };
    }

    const body = { message: commitMessage, content: contentBase64, branch: "main" };
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

    if (putRes.ok) {
      console.log(`✅ GitHub sync SUCCESS: ${githubFilePath}`);
      return { success: true };
    } else {
      const errText = await putRes.text();
      console.error(`❌ GitHub sync FAILED (${putRes.status}):`, errText);
      return { success: false, error: `GitHub rejected push (${putRes.status}): ${errText}` };
    }

  } catch (err) {
    return { success: false, error: `Critical error: ${err.message}` };
  }
}

// ===================== GitHub API Pull Helper (Startup Sync) =====================
async function pullLatestFromGitHub(githubFilePath, localFilePath) {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) return;

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${githubFilePath}`;
    
    // Fetch the standard JSON response from GitHub
    const res = await fetch(apiUrl, {
      headers: { 
        Authorization: `token ${token}`, 
        Accept: "application/vnd.github.v3+json" 
      }
    });

    if (res.ok) {
      const data = await res.json();
      
      // GitHub returns the file content as a base64 encoded string. 
      // We must decode it back to normal text.
      const fileContent = Buffer.from(data.content, 'base64').toString('utf8');
      
      const dir = path.dirname(localFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.writeFileSync(localFilePath, fileContent);
      console.log(`✅ Downloaded fresh data: ${githubFilePath}`);
    } else {
      const errText = await res.text();
      console.log(`⚠️ Could not fetch ${githubFilePath} from GitHub (${res.status}): ${errText}`);
    }
  } catch (err) {
    console.error(`❌ Error pulling from GitHub:`, err);
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

const STATS_PATH = path.join(__dirname, "src", "football_stats_2025_2026.json");

function readStats() {
  if (!fs.existsSync(STATS_PATH)) return [];
  const content = fs.readFileSync(STATS_PATH, "utf8");
  return content.trim() ? JSON.parse(content) : [];
}

function writeStats(data) {
  const dir = path.dirname(STATS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); 
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
  const dir = path.dirname(PROFILES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); 
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

const ATTR_PATH = path.join(__dirname, "src", "player_attributes.json");

function readAttributes() {
  if (!fs.existsSync(ATTR_PATH)) {
    console.log(`⚠️ [READ] ${ATTR_PATH} does not exist locally. Returning empty array.`);
    return [];
  }
  const content = fs.readFileSync(ATTR_PATH, "utf8");
  const data = content.trim() ? JSON.parse(content) : [];
  console.log(`📖 [READ] Loaded ${data.length} players from local disk`);
  if (data.length > 0) {
    console.log(`   First player: ${data[0].Contributor || 'unnamed'}`);
    console.log(`   Last player: ${data[data.length - 1].Contributor || 'unnamed'}`);
  }
  return data;
}

function writeAttributes(data) {
  const dir = path.dirname(ATTR_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ATTR_PATH, JSON.stringify(data, null, 2));
  console.log(`💾 [WRITE] Saved ${data.length} players to local disk`);
}

app.get("/player-attributes", (req, res) => {
  res.json(readAttributes());
});

app.post("/player-attributes", async (req, res) => {
  console.log(`\n📥 [PLAYER-ATTRIBUTES] Request received! Contributor: ${req.body?.Contributor}`);
  try {
    const card = req.body;
    if (!card || !card.Contributor) {
      return res.status(400).json({ error: "Missing Contributor" });
    }

    // Read current data
    const data = readAttributes();
    console.log(`📊 [DEBUG] After reading, array has ${data.length} players`);

    const index = data.findIndex(a => 
      (a.Contributor || "").trim().toLowerCase() === card.Contributor.trim().toLowerCase()
    );

    if (index === -1) {
      data.push(card);
      console.log(`➕ [DEBUG] Added NEW player. Array now has ${data.length} players`);
    } else {
      data[index] = { ...data[index], ...card };
      console.log(`🔄 [DEBUG] Updated existing player at index ${index}`);
    }

    // Verify the player is in the array before writing
    const hasPlayer = data.some(p => p.Contributor === card.Contributor);
    console.log(`✓ [DEBUG] Player ${card.Contributor} is in array: ${hasPlayer}`);

    writeAttributes(data);

    // Now push to GitHub
    console.log(`📤 [DEBUG] About to push ${data.length} players to GitHub`);
    const syncResult = await syncFileToGitHub(ATTR_PATH, "football-app/src/player_attributes.json", `Update player card: ${card.Contributor}`);

    if (syncResult.success) {
      res.json({ message: "✅ Player card saved and synced to GitHub!", totalPlayers: data.length });
    } else {
      res.status(500).json({ 
        error: "Saved locally, but GitHub rejected it.", 
        githubError: syncResult.error 
      });
    }
  } catch (error) {
    console.error("❌ Error in player-attributes POST:", error);
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
const LINEUPS_PATH = path.join(__dirname, "src", "match_lineups.json");

function readLineups() {
  if (!fs.existsSync(LINEUPS_PATH)) return [];
  const content = fs.readFileSync(LINEUPS_PATH, "utf8");
  return content.trim() ? JSON.parse(content) : [];
}

function writeLineups(data) {
  const dir = path.dirname(LINEUPS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); 
  fs.writeFileSync(LINEUPS_PATH, JSON.stringify(data, null, 2));
}

app.post("/match-lineups", async (req, res) => {
  try {
    const lineup = req.body;

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
      teamA: {
        formation: lineup.teamA?.formation || "4-4-2",
        players: lineup.teamA?.players || Array(11).fill(null),
        subs: lineup.teamA?.subs || [null, null]
      },
      teamB: {
        formation: lineup.teamB?.formation || "4-4-2",
        players: lineup.teamB?.players || Array(11).fill(null),
        subs: lineup.teamB?.subs || [null, null]
      }
    };

    if (index === -1) {
      data.push(normalizedLineup);
      console.log(`➕ Created NEW lineup for ${normDate}`);
    } else {
      data[index] = normalizedLineup;
      console.log(`🔄 UPDATED existing lineup at index ${index}`);
    }

    writeLineups(data);

    // ✅ NOW CHECK THE RESULT
    const syncResult = await syncFileToGitHub(
      LINEUPS_PATH,
      "football-app/src/match_lineups.json",
      `Update lineup for ${normDate}`
    );

    if (syncResult.success) {
      res.json({ message: "✅ Lineup saved AND synced to GitHub", index, isNew: index === -1 });
    } else {
      console.error(`❌ GitHub sync failed for lineups: ${syncResult.error}`);
      res.status(500).json({
        error: "Saved locally but GitHub sync FAILED",
        githubError: syncResult.error,
        index,
        isNew: index === -1
      });
    }
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
const buildPath = path.join(__dirname,"build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.log("ℹ️  Running in API-only mode (no frontend build folder found)");
}

// ===================== STARTUP SYNC =====================
// Every time Render wakes up from sleep, it will download the latest data from GitHub
async function startupSync() {
  console.log("🔄 Server waking up... Pulling latest data from GitHub...");
  
  await pullLatestFromGitHub("football-app/src/football_stats_2025_2026.json", STATS_PATH);
  await pullLatestFromGitHub("football-app/src/contributor_profiles.json", PROFILES_PATH);
  await pullLatestFromGitHub("football-app/src/player_attributes.json", ATTR_PATH);
  await pullLatestFromGitHub("football-app/src/match_lineups.json", LINEUPS_PATH);
  
  console.log("✅ Data synced! Server is ready.");
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Start the server with sync
startupSync();