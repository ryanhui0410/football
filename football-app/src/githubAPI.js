// ── GitHub API Direct Access (no server needed) ──
const GITHUB_TOKEN = "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"; // ⚠️ Replace this
const GITHUB_OWNER = "ryanhui0410";
const GITHUB_REPO = "football";
const API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;

// ── Read JSON file from GitHub ──
export const readFromGitHub = async (filePath) => {
  const res = await fetch(`${API_BASE}/${filePath}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.raw",
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    console.warn(`⚠️ Could not read ${filePath} (${res.status})`);
    return [];
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return []; }
};

// ── Write JSON file to GitHub (uses Git Data API — always works) ──
export const writeToGitHub = async (filePath, data, message) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  console.log(`📤 Writing ${filePath} (${jsonStr.length} bytes)...`);

  // 1. Create blob (the file content)
  const blobRes = await fetch(`${apiBase}/git/blobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content: jsonStr, encoding: "utf-8" }),
    signal: AbortSignal.timeout(60000),
  });
  if (!blobRes.ok) throw new Error(`Blob failed: ${await blobRes.text()}`);
  const blob = await blobRes.json();
  console.log(`  📦 Blob created: ${blob.sha.substring(0, 10)}...`);

  // 2. Get main branch commit SHA
  const refRes = await fetch(`${apiBase}/git/refs/heads/main`, {
    headers, signal: AbortSignal.timeout(15000),
  });
  if (!refRes.ok) throw new Error(`Ref lookup failed: ${await refRes.text()}`);
  const ref = await refRes.json();
  const commitSha = ref.object.sha;
  console.log(`  🌿 Main commit: ${commitSha.substring(0, 10)}...`);

  // 3. Get the commit's tree
  const commitRes = await fetch(`${apiBase}/git/commits/${commitSha}`, {
    headers, signal: AbortSignal.timeout(15000),
  });
  if (!commitRes.ok) throw new Error(`Commit lookup failed: ${await commitRes.text()}`);
  const commit = await commitRes.json();

  // 4. Create new tree with updated file
  const treeRes = await fetch(`${apiBase}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      base_tree: commit.tree.sha,
      tree: [{
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!treeRes.ok) throw new Error(`Tree failed: ${await treeRes.text()}`);
  const tree = await treeRes.json();
  console.log(`  🌳 Tree created: ${tree.sha.substring(0, 10)}...`);

  // 5. Create commit
  const newCommitRes = await fetch(`${apiBase}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [commitSha],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!newCommitRes.ok) throw new Error(`Commit failed: ${await newCommitRes.text()}`);
  const newCommit = await newCommitRes.json();
  console.log(`  💾 Commit created: ${newCommit.sha.substring(0, 10)}...`);

  // 6. Update ref to point to new commit
  const updateRes = await fetch(`${apiBase}/git/refs/heads/main`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ sha: newCommit.sha }),
    signal: AbortSignal.timeout(15000),
  });
  if (!updateRes.ok) throw new Error(`Ref update failed: ${await updateRes.text()}`);

  console.log(`✅ Written to GitHub: ${filePath}`);
  return true;
};

// ── Upload image to GitHub ──
export const uploadImageToGitHub = async (base64Image, fileName, commitMessage) => {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const filePath = `football-app/public/images/${fileName}`;

  // Get SHA if file exists
  let sha = "";
  const getRes = await fetch(`${API_BASE}/${filePath}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (getRes.ok) {
    sha = (await getRes.json()).sha;
  }

  const body = { message: commitMessage, content: base64Data, branch: "main" };
  if (sha) body.sha = sha;

  const putRes = await fetch(`${API_BASE}/${filePath}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`Image upload failed (${putRes.status}): ${err}`);
  }

  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${filePath}`;
};

// ── List images from GitHub ──
export const listGitHubImages = async () => {
  const res = await fetch(`${API_BASE}/football-app/public/images`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const files = await res.json();
  return files
    .filter(f => /\.(jpe?g|png)$/i.test(f.name))
    .map(f => ({
      name: f.name.replace(/\.(jpe?g|png)$/i, "").toLowerCase(),
      url: f.download_url,
    }));
};

// ── Compute stats fields (mirrors server's formatStat) ──
export const formatStat = (raw) => {
  const leftFoot  = parseFloat(raw["Left Foot"] ?? raw.LeftFoot ?? 0) || 0;
  const rightFoot = parseFloat(raw["Right Foot"] ?? raw.RightFoot ?? 0) || 0;
  const head      = parseFloat(raw.Head ?? 0) || 0;
  const other     = parseFloat(raw["Other body parts"] ?? raw.OtherBodyParts ?? 0) || 0;
  const assist    = parseFloat(raw.Assist ?? 0) || 0;
  const rating    = parseFloat(raw.Rating ?? 0) || 0;
  const goal      = leftFoot + rightFoot + head + other;

  const cName = (raw.Contributor || "").trim().toLowerCase();
  const assistRecipient = cName === "ryan" ? "Darren" : cName === "darren" ? "Ryan" : "";
  const assistToCount = parseFloat(raw.AssistToCount ?? raw["Assist to count"] ?? raw.AssistTo ?? 0) || 0;
  const finalAssistTo = (assistRecipient && assistToCount > 0) ? assistRecipient : "";

  // Season
  let season = "";
  if (raw.Date) {
    const parts = raw.Date.split("/");
    const month = parseInt(parts[0]);
    const year = parseInt(parts[2]);
    if (!isNaN(month) && !isNaN(year)) {
      const startYear = month >= 8 ? year : year - 1;
      season = `${startYear}-${startYear + 1}`;
    }
  }

  // Symbol
  const ball = "⚽".repeat(Math.round(goal));
  const shoe = "👟".repeat(Math.round(assist));

  return {
    Date: raw.Date,
    Contributor: raw.Contributor,
    Symbol: ball + shoe,
    Goal: goal,
    Assist: assist,
    Rating: rating,
    Location: raw.Location,
    Time: raw.Time,
    "Goal Contribution": goal + assist,
    source: raw.source,
    "Left Foot": leftFoot,
    "Right Foot": rightFoot,
    Head: head,
    "Other body parts": other,
    "Own Goal": parseFloat(raw.OwnGoal ?? raw["Own Goal"] ?? 0) || 0,
    Season: season,
    "Match result": raw["Match result"] ?? raw.MatchResult ?? "",
    "Win/Loss?": raw["Win/Loss?"] ?? raw.WinLoss ?? "",
    "Assist to": finalAssistTo,
    "Assist to count": assistToCount,
    "Man of the Match": raw["Man of the Match"] ?? raw.ManOfTheMatch ?? false,
  };
};

// ── File paths on GitHub ──
export const FILES = {
  stats: "football-app/src/football_stats_2025_2026.json",
  lineups: "football-app/src/match_lineups.json",
  playerAttributes: "football-app/src/player_attributes.json",
};