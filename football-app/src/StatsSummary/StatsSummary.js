import React, { useState, useEffect, useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import FormTrendGraph from "./FormTrendGraph";
import StreakTracker from "./StreakTracker";
import "./StatsSummary.css";
import { readFromGitHub, FILES } from "../githubAPI";
ChartJS.register(ArcElement, Tooltip, Legend);

function getSeasonFromDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  let month, year;
  if (parts.length === 3) {
    month = parseInt(parts[0], 10);
    year = parseInt(parts[2], 10);
  } else {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    month = d.getMonth() + 1;
    year = d.getFullYear();
  }
  if (isNaN(month) || isNaN(year)) return "";
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

const normalizeName = (name) => (name || "").trim().toLowerCase();
const normField = (v) => (v || "").trim().toLowerCase();
const isPair = (n) => n === "ryan" || n === "darren";

const prettyName = (name) => {
  if (!name) return "";
  return name.split(' ').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
};

// Shared Win/Loss helper (teamIdx 0 = teamA, 1 = teamB)
function deriveWL(matchResult, teamIdx) {
  if (!matchResult) return "";
  const scores = matchResult.split("-").map(s => parseInt(s.trim()));
  if (scores.length !== 2 || isNaN(scores[0]) || isNaN(scores[1])) return "";
  const playerScore = teamIdx === 0 ? scores[0] : scores[1];
  const oppScore = teamIdx === 0 ? scores[1] : scores[0];
  return playerScore > oppScore ? "Win" : playerScore < oppScore ? "Loss" : "Draw";
}

// ✅ NEW: same image source PlayerRatings / TacticalDashboard use
const GITHUB_OWNER = "ryanhui0410";
const GITHUB_REPO = "football";
const IMAGES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/football-app/public/images`;

// ✅ NEW: mini version of PlayerRatings' PlayerPicture, same fallback chain
function PlayerAvatar({ name, pictureMap, size = 26 }) {
  const candidates = [
    pictureMap?.[(name || "").trim().toLowerCase()], // GitHub listing (primary)
    `/images/${encodeURIComponent(name)}.jpeg`,      // local build fallback
    `/${name}.jpeg`,                                 // legacy root fallback
  ].filter(Boolean);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => { setAttempt(0); }, [name, pictureMap]);

  const baseStyle = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    border: "1px solid #cbd5e1", background: "#e2e8f0", boxSizing: "border-box",
  };

  if (attempt >= candidates.length) {
    return (
      <span style={{
        ...baseStyle, display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.5), fontWeight: 700, color: "#64748b",
      }}>
        {(name || "?").charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={candidates[attempt]}
      alt={name}
      style={{ ...baseStyle, objectFit: "cover", display: "block" }}
      onError={() => setAttempt(a => a + 1)}
    />
  );
}

function StatsSummary({ stats }) {
  const [filterSeason, setFilterSeason] = useState("");
  const [filterGroup, setFilterGroup] = useState(""); // "" = All Groups
  const [selectedPlayer, setSelectedPlayer] = useState("Ryan");
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [lineups, setLineups] = useState([]);
  const [debugInfo, setDebugInfo] = useState("");
  const [attributes, setAttributes] = useState([]);
  const [pictureMap, setPictureMap] = useState({}); // ✅ NEW: player name → image URL

  const [sortKey, setSortKey] = useState("avgRating");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    setDebugInfo("⏳ Loading data from GitHub...");
    const loadData = async () => {
      try {
        const [lineupData, attrData, imageFiles] = await Promise.all([
          readFromGitHub(FILES.lineups),
          readFromGitHub(FILES.playerAttributes),
          // ✅ NEW: same listing PlayerRatings uses (fails gracefully)
          fetch(`${IMAGES_API_URL}?t=${Date.now()}`)
            .then(res => (res.ok ? res.json() : []))
            .catch(() => []),
        ]);
        setLineups(Array.isArray(lineupData) ? lineupData : []);
        setAttributes(Array.isArray(attrData) ? attrData : []);

        // ✅ NEW: build the picture map (identical logic to PlayerRatings)
        if (Array.isArray(imageFiles)) {
          const map = {};
          imageFiles
            .filter(f => /\.(jpe?g|png)$/i.test(f.name))
            .forEach(f => {
              map[f.name.replace(/\.(jpe?g|png)$/i, "").toLowerCase()] = f.download_url;
            });
          setPictureMap(map);
        }

        setDebugInfo(`✅ Loaded ${Array.isArray(lineupData) ? lineupData.length : 0} match lineups`);
      } catch (err) {
        setDebugInfo("❌ Failed to load data from GitHub");
      }
    };
    loadData();
  }, []);

  // player → filterGroup map (from playerAttributes)
  const playerGroupMap = useMemo(() => {
    const map = {};
    attributes.forEach((a) => {
      const name = normalizeName(a?.Contributor);
      const g = (a?.filterGroup || "").trim();
      if (name && g) map[name] = g;
    });
    return map;
  }, [attributes]);

  // Group dropdown options (same ordering as Tactical Dashboard)
  const filterGroups = useMemo(() => {
    const groups = [...new Set(Object.values(playerGroupMap))];
    const preferredOrder = ["The Bros", "Barry", "馬哲", "梁哥"];
    return groups.sort((a, b) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [playerGroupMap]);

  // Classify each lineup match by the group MOST of its players belong to.
  // Counts starters + subs from both teams. Ties → match belongs to all tied groups.
  const matchGroupIndex = useMemo(() => {
    const byKey = {};     // "date|location|time" -> [groups]
    const byDateLoc = {}; // "date|location"      -> Set(groups)
    const byDate = {};    // "date"               -> Set(groups)

    lineups.forEach((match) => {
      if (!match || !match.date) return;
      const counts = {};
      [match.teamA, match.teamB].filter(Boolean).forEach((team) => {
        const allPlayers = [
          ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
          ...(Array.isArray(team.subs) ? team.subs : []),
        ];
        allPlayers.forEach((p) => {
          if (!p || !p.Contributor) return;
          const g = playerGroupMap[normalizeName(p.Contributor)];
          if (g) counts[g] = (counts[g] || 0) + 1;
        });
      });

      const max = Math.max(0, ...Object.values(counts));
      const topGroups = max > 0 ? Object.keys(counts).filter((g) => counts[g] === max) : [];

      const date = match.date;
      const dlKey = `${date}|${normField(match.location)}`;
      byKey[`${date}|${normField(match.location)}|${normField(match.time)}`] = topGroups;
      if (!byDateLoc[dlKey]) byDateLoc[dlKey] = new Set();
      if (!byDate[date]) byDate[date] = new Set();
      topGroups.forEach((g) => { byDateLoc[dlKey].add(g); byDate[date].add(g); });
    });

    return { byKey, byDateLoc, byDate };
  }, [lineups, playerGroupMap]);

  // Lineups belonging to the selected group
  const groupLineups = useMemo(() => {
    if (!filterGroup) return lineups;
    return lineups.filter((m) => {
      if (!m || !m.date) return false;
      const groups = matchGroupIndex.byKey[`${m.date}|${normField(m.location)}|${normField(m.time)}`] || [];
      return groups.includes(filterGroup);
    });
  }, [lineups, filterGroup, matchGroupIndex]);

  // Stats records belonging to the selected group.
  // Match via lineup index (date+loc+time → date+loc → date);
  // if no lineup exists for that date, fall back to the player's own group.
  const groupStats = useMemo(() => {
    if (!filterGroup) return stats;
    return stats.filter((s) => {
      if (!s || !s.Date) return false;
      const full = matchGroupIndex.byKey[`${s.Date}|${normField(s.Location)}|${normField(s.Time)}`];
      if (full) return full.includes(filterGroup);
      const dl = matchGroupIndex.byDateLoc[`${s.Date}|${normField(s.Location)}`];
      if (dl) return dl.has(filterGroup);
      const d = matchGroupIndex.byDate[s.Date];
      if (d) return d.has(filterGroup);
      return playerGroupMap[normalizeName(s.Contributor)] === filterGroup;
    });
  }, [stats, filterGroup, matchGroupIndex, playerGroupMap]);

  const dropdownPlayers = useMemo(() => {
    return ["Ryan", "Darren"];
  }, []);

  const lineupStats = useMemo(() => {
    const map = {};

    groupLineups.forEach((match) => {
      if (!match || !match.date) return;
      const season = getSeasonFromDate(match.date);
      if (!season) return;

      const teams = [match.teamA, match.teamB].filter(Boolean);

      teams.forEach((team) => {
        const allPlayers = [];
        const players = Array.isArray(team.players) ? team.players : Object.values(team.players || {});
        allPlayers.push(...players);

        if (Array.isArray(team.subs)) {
          allPlayers.push(...team.subs);
        }

        allPlayers.forEach((player) => {
          if (!player || !player.Contributor) return;

          const name = normalizeName(player.Contributor);
          const rating = parseFloat(player.rating) || 0;

          if (!map[name]) map[name] = {};
          if (!map[name][season]) map[name][season] = { matches: 0, totalRating: 0 };

          map[name][season].matches += 1;
          map[name][season].totalRating += rating;
        });
      });
    });

    Object.keys(map).forEach((name) => {
      Object.keys(map[name]).forEach((season) => {
        const d = map[name][season];
        d.avgRating = d.matches > 0 ? d.totalRating / d.matches : 0;
      });
    });

    return map;
  }, [groupLineups]);

  // Merge stats with lineup data for pair players (Ryan/Darren) — group-aware
  const mergedStats = useMemo(() => {
    const merged = [...groupStats];
    const existingKeys = new Set(groupStats.map(s => `${normalizeName(s.Contributor)}|${s.Date}`));

    groupLineups.forEach((match) => {
      if (!match || !match.date) return;
      const teams = [match.teamA, match.teamB].filter(Boolean);
      teams.forEach((team, teamIdx) => {
        const allPlayers = [
          ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
          ...(Array.isArray(team.subs) ? team.subs : []),
        ];
        allPlayers.forEach((p) => {
          if (!p || !p.Contributor) return;
          const name = normalizeName(p.Contributor);
          if (!isPair(name)) return;

          const key = `${name}|${match.date}`;
          if (existingKeys.has(key)) {
            const existingIdx = merged.findIndex(m =>
              normalizeName(m.Contributor) === name && m.Date === match.date
            );
            if (existingIdx >= 0) {
              const lineupError = parseInt(p.error) || 0;
              const statsError = parseInt(merged[existingIdx]["Error?"] ?? merged[existingIdx]["Error"] ?? 0) || 0;
              if (lineupError > statsError) {
                // Immutable update (don't mutate the stats prop)
                merged[existingIdx] = { ...merged[existingIdx], "Error?": lineupError };
              }
            }
            return;
          }

          const wl = deriveWL(match.matchResult, teamIdx);

          const lf = parseInt(p.leftFoot) || 0;
          const rf = parseInt(p.rightFoot) || 0;
          const hd = parseInt(p.head) || 0;
          const ot = parseInt(p.other) || 0;
          const breakdownTotal = lf + rf + hd + ot;
          const goalTotal = parseInt(p.goal) || 0;

          merged.push({
            Date: match.date,
            Contributor: p.Contributor,
            Rating: parseFloat(p.rating) || 0,
            "Left Foot": breakdownTotal > 0 ? lf : goalTotal,
            "Right Foot": breakdownTotal > 0 ? rf : 0,
            "Head": breakdownTotal > 0 ? hd : 0,
            "Other body parts": breakdownTotal > 0 ? ot : 0,
            "Goal": goalTotal,
            "Assist": parseInt(p.assist) || 0,
            "Error?": parseInt(p.error) || 0,
            "Match result": match.matchResult || "", 
            "Own Goal": parseFloat(p.ownGoal) || 0,
            "Man of the Match": Boolean(p.manOfTheMatch ?? p.isMotm),
            "Win/Loss?": wl,
            Location: match.location || "",
            "Assist to": p.assistTo || "",
            "Assist to count": parseInt(p.assistToCount) || 0,
          });
        });
      });
    });

    return merged;
  }, [groupStats, groupLineups]);

  const getLineupTotals = (playerName) => {
    const playerData = lineupStats[normalizeName(playerName)];
    if (!playerData) return null;
    let matches = 0, totalRating = 0;
    Object.entries(playerData).forEach(([season, d]) => {
      if (!filterSeason || season === filterSeason) {
        matches += d.matches;
        totalRating += d.totalRating;
      }
    });
    return {
      matches,
      avgRating: matches > 0 ? totalRating / matches : 0,
    };
  };

  const allSeasons = [...new Set(mergedStats.map((s) => getSeasonFromDate(s.Date)).filter(Boolean))].sort();

  const filteredStats = filterSeason
    ? mergedStats.filter((s) => getSeasonFromDate(s.Date) === filterSeason)
    : mergedStats;

  const motmStats = useMemo(() => {
    const map = {};
    mergedStats.forEach((s) => {
      const name = normalizeName(s.Contributor);
      if (!name) return;
      const season = getSeasonFromDate(s.Date);
      if (!season) return;
      if (!map[name]) map[name] = {};
      if (!map[name][season]) map[name][season] = 0;
      if (s["Man of the Match"] === true) {
        map[name][season] += 1;
      }
    });
    return map;
  }, [mergedStats]);

  const allPlayersTable = useMemo(() => {
    const rows = new Map();

    const ensureRow = (name) => {
      if (!rows.has(name)) {
        rows.set(name, {
          name: prettyName(name),
          matches: 0, totalRating: 0,
          goals: 0, assists: 0, errors: 0, ownGoals: 0,
          wins: 0,
        });
      }
      return rows.get(name);
    };

    // When a group is selected, only players OF that group are shown —
    // EXCEPT Ryan & Darren, who always appear in ANY group filter.
    // Their numbers are already scoped to the group's matches via groupLineups/mergedStats.
    const inGroup = (name) =>
      !filterGroup || isPair(name) || playerGroupMap[name] === filterGroup;

    const seasonFilteredStats = filterSeason
      ? mergedStats.filter((s) => getSeasonFromDate(s.Date) === filterSeason)
      : mergedStats;

    // Lineups loop — only for non-pair players (already group-filtered)
    groupLineups.forEach((match) => {
      if (!match || !match.date) return;
      const season = getSeasonFromDate(match.date);
      if (filterSeason && season !== filterSeason) return;

      const teams = [match.teamA, match.teamB].filter(Boolean);
      teams.forEach((team, teamIdx) => {
        const allPlayers = [
          ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
          ...(Array.isArray(team.subs) ? team.subs : []),
        ];
        const wl = deriveWL(match.matchResult, teamIdx);

        allPlayers.forEach((p) => {
          if (!p || !p.Contributor) return;
          const name = normalizeName(p.Contributor);
          if (isPair(name)) return;
          if (!inGroup(name)) return;

          const row = ensureRow(name);
          row.matches += 1;
          row.totalRating += parseFloat(p.rating) || 0;
          row.goals += parseInt(p.goal) || 0;
          row.assists += parseInt(p.assist) || 0;
          row.errors += parseInt(p.error) || 0;
          row.ownGoals += parseInt(p.ownGoal) || 0;
          if (wl === "Win") row.wins += 1;
        });
      });
    });

    // Stats loop — pair players from mergedStats, non-pair fallback
    seasonFilteredStats.forEach((s) => {
      const name = normalizeName(s.Contributor);
      if (!name) return;
      if (!inGroup(name)) return;

      const wl = (s["Win/Loss?"] || "").toString().trim().toLowerCase();

      if (isPair(name)) {
        const row = ensureRow(name);
        const left = parseInt(s["Left Foot"] || 0);
        const right = parseInt(s["Right Foot"] || 0);
        const head = parseInt(s.Head || 0);
        const other = parseInt(s["Other body parts"] || 0);
        const breakdownGoals = left + right + head + other;
        row.matches += 1;
        row.totalRating += parseFloat(s.Rating) || 0;
        row.goals += breakdownGoals > 0 ? breakdownGoals : (parseInt(s.Goal) || 0);
        row.assists += parseInt(s.Assist || 0);
        row.errors += parseInt(s["Error?"] ?? s.Error ?? 0) || 0;
        row.ownGoals += parseFloat(s["Own Goal"] ?? 0) || 0;
        if (wl === "win") row.wins += 1;
      } else {
        const row = ensureRow(name);
        if (row.matches === 0) {
          row.matches += 1;
          row.totalRating += parseFloat(s.Rating) || 0;
          row.goals += parseInt(s.Goal) || 0;
          row.assists += parseInt(s.Assist) || 0;
          row.errors += parseInt(s["Error?"] ?? s.Error ?? 0) || 0;
          row.ownGoals += parseFloat(s["Own Goal"] ?? 0) || 0;
          if (wl === "win") row.wins += 1;
        }
      }
    });

    return Array.from(rows.values())
      .filter((r) => r.matches > 0)
      .map((r) => ({
        ...r,
        avgRating: r.totalRating / r.matches,
        winRate: r.matches > 0 ? (r.wins / r.matches) * 100 : 0,
      }))
      .sort((a, b) => {
        const valA = a[sortKey] ?? 0;
        const valB = b[sortKey] ?? 0;
        if (sortDir === "desc") return valB - valA;
        return valA - valB;
      });
  }, [groupLineups, mergedStats, filterSeason, sortKey, sortDir, filterGroup, playerGroupMap]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortArrow = (key) => {
    if (sortKey !== key) return <span className="sort-arrow inactive">⇅</span>;
    return <span className="sort-arrow active">{sortDir === "desc" ? "▼" : "▲"}</span>;
  };

  const getDetailedPlayerStats = (playerName) => {
    const target = normalizeName(playerName);

    // Player outside the selected group → no profile (pair players bypass this)
    if (filterGroup && !isPair(target) && playerGroupMap[target] !== filterGroup) return null;

    const records = [];

    if (isPair(target)) {
      // ── Pair players (Ryan/Darren): use mergedStats (same as table) ──
      filteredStats.forEach(s => {
        if (normalizeName(s.Contributor) !== target) return;
        const left = parseInt(s["Left Foot"] || 0);
        const right = parseInt(s["Right Foot"] || 0);
        const head = parseInt(s.Head || 0);
        const other = parseInt(s["Other body parts"] || 0);
        const lineupForDate = groupLineups.find(l => l.date === s.Date);
        const breakdownTotal = left + right + head + other;
        records.push({
          date: s.Date,
          rating: parseFloat(s.Rating) || 0,
          left, right, head, other,
          goals: breakdownTotal > 0 ? breakdownTotal : (parseInt(s.Goal) || 0),
          assists: parseInt(s.Assist || 0) || 0,
          errors: parseInt(s["Error?"] ?? s.Error ?? 0) || 0,
          ownGoals: parseFloat(s["Own Goal"] ?? 0) || 0,
          wl: s["Win/Loss?"] || "",
          result: s["Match result"] || lineupForDate?.matchResult || "", // ✅ NEW
          motm: s["Man of the Match"] === true,
          location: s.Location || "",
        });
      });
    } else {
      // ── Non-pair: lineups first (same as table), stats fallback ──
      let hasLineupData = false;

      groupLineups.forEach(match => {
        if (!match || !match.date) return;
        const season = getSeasonFromDate(match.date);
        if (filterSeason && season !== filterSeason) return;

        const teams = [match.teamA, match.teamB].filter(Boolean);
        teams.forEach((team, teamIdx) => {
          const allPlayers = [
            ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
            ...(Array.isArray(team.subs) ? team.subs : []),
          ];
          allPlayers.forEach(p => {
            if (!p || !p.Contributor) return;
            if (normalizeName(p.Contributor) !== target) return;
            hasLineupData = true;

            const goal = parseInt(p.goal) || 0;
            const assist = parseInt(p.assist) || 0;
            const error = parseInt(p.error) || 0;
            const ownGoal = parseFloat(p.ownGoal) || 0;
            const rating = parseFloat(p.rating) || 0;
            const motm = p.manOfTheMatch === true;

            const lf = parseInt(p.leftFoot) || 0;
            const rf = parseInt(p.rightFoot) || 0;
            const hd = parseInt(p.head) || 0;
            const ot = parseInt(p.other) || 0;
            const breakdownTotal = lf + rf + hd + ot;

            let wl = deriveWL(match.matchResult, teamIdx);
            if (!wl) {
              const se = groupStats.find(s =>
                normalizeName(s.Contributor) === target && s.Date === match.date
              );
              if (se) wl = se["Win/Loss?"] || "";
            }

            records.push({
              date: match.date,
              rating,
              left: breakdownTotal > 0 ? lf : goal,
              right: breakdownTotal > 0 ? rf : 0,
              head: breakdownTotal > 0 ? hd : 0,
              other: breakdownTotal > 0 ? ot : 0,
              result: match.matchResult || "", // ✅ NEW
              goals: goal,
              assists: assist,
              errors: error,
              ownGoals: ownGoal,
              motm,
              wl,
              location: match.location || "",
            });
          });
        });
      });

      // ── Stats fallback: only if player has NO lineup data (same as table) ──
      if (!hasLineupData) {
        groupStats.forEach(s => {
          if (normalizeName(s.Contributor) !== target) return;
          const season = getSeasonFromDate(s.Date);
          if (filterSeason && season !== filterSeason) return;

          const left = parseInt(s["Left Foot"] || 0);
          const right = parseInt(s["Right Foot"] || 0);
          const head = parseInt(s.Head || 0);
          const other = parseInt(s["Other body parts"] || 0);
          const breakdownTotal = left + right + head + other;

          records.push({
            date: s.Date,
            rating: parseFloat(s.Rating) || 0,
            left, right, head, other,
            goals: breakdownTotal > 0 ? breakdownTotal : (parseInt(s.Goal) || 0),
            assists: parseInt(s.Assist || 0) || 0,
            result: s["Match result"] || groupLineups.find(l => l.date === s.Date)?.matchResult || "", // ✅ NEW
            errors: parseInt(s["Error?"] ?? s.Error ?? 0) || 0,
            ownGoals: parseFloat(s["Own Goal"] ?? 0) || 0,
            wl: s["Win/Loss?"] || "",
            motm: s["Man of the Match"] === true,
            location: s.Location || "",
          });
        });
      }
    }

    if (records.length === 0) return null;

    const entry = {
      ratings: [], left: 0, right: 0, head: 0, other: 0, assists: 0, errors: 0, wins: 0,
      locationStats: {}, matches: [],
    };

    records.forEach(r => {
      entry.ratings.push(r.rating);
      entry.left += r.left;
      entry.right += r.right;
      entry.head += r.head;
      entry.other += r.other;
      entry.assists += r.assists;
      entry.errors += r.errors;
      if (r.wl && r.wl.toLowerCase() === "win") entry.wins += 1;
      entry.matches.push({ date: r.date, rating: r.rating, goals: r.goals, assists: r.assists, wl: r.wl, result: r.result }); // ✅ CHANGED
      const location = normalizeName(r.location) || "Unknown";
      if (!entry.locationStats[location]) entry.locationStats[location] = { count: 0, goals: 0, assists: 0 };
      const loc = entry.locationStats[location];
      loc.count += 1;
      loc.goals += r.goals;
      loc.assists += r.assists;
    });

    entry.matches.sort((a, b) => new Date(a.date) - new Date(b.date));
    return entry;
  };

  const renderDetailedProfile = (playerName) => {
    const statsData = getDetailedPlayerStats(playerName);
    if (!statsData) return null;

    const avgRating = statsData.ratings.reduce((sum, r) => sum + r, 0) / (statsData.ratings.length || 1);
    const totalGoals = statsData.left + statsData.right + statsData.head + statsData.other;
    const percentages = totalGoals > 0 ? [
      ((statsData.left / totalGoals) * 100).toFixed(1),
      ((statsData.right / totalGoals) * 100).toFixed(1),
      ((statsData.head / totalGoals) * 100).toFixed(1),
      ((statsData.other / totalGoals) * 100).toFixed(1),
    ] : [0, 0, 0, 0];

    const pieData = {
      labels: [`Left Foot (${percentages[0]}%)`, `Right Foot (${percentages[1]}%)`, `Head (${percentages[2]}%)`, `Other (${percentages[3]}%)`],
      datasets: [{ data: [statsData.left, statsData.right, statsData.head, statsData.other], backgroundColor: ["#4CAF50", "#2196F3", "#FFC107", "#9C27B0"], borderColor: "#ffffff", borderWidth: 3 }],
    };

    const totalMatches = statsData.ratings.length;
    const winRate = totalMatches > 0 ? ((statsData.wins || 0) / totalMatches) * 100 : 0;
    const ratingClass = avgRating < 6 ? "low" : avgRating <= 8 ? "mid" : "high";
    const errorClass = statsData.errors === 0 ? "none" : statsData.errors <= 3 ? "low" : "high";
    const winRateClass = winRate >= 50 ? "high" : winRate > 0 ? "mid" : "low";

    const normName = normalizeName(playerName);
    const playerMotm = motmStats[normName] || {};
    const totalMotm = filterSeason
      ? (playerMotm[filterSeason] || 0)
      : Object.values(playerMotm).reduce((a, b) => a + b, 0);

    const targetAssistPlayer = (normName === "ryan") ? "Darren" : (normName === "darren") ? "Ryan" : null;
    let totalAssistTo = 0;
    if (targetAssistPlayer) {
      filteredStats.forEach(s => {
        if (normalizeName(s.Contributor) === normName && normalizeName(s["Assist to"]) === normalizeName(targetAssistPlayer)) {
          totalAssistTo += parseInt(s["Assist to count"]) || 0;
        }
      });
    }

    const locationEntries = Object.entries(statsData.locationStats).filter(([loc]) => loc !== "Unknown").sort((a, b) => a[0].localeCompare(b[0]));
    const locationData = locationEntries.map(([loc, data]) => {
      const avgGoals = data.count > 0 ? data.goals / data.count : 0;
      const avgAssists = data.count > 0 ? data.assists / data.count : 0;
      const avgContrib = data.count > 0 ? (data.goals + data.assists) / data.count : 0;
      return { loc, data, avgGoals, avgAssists, avgContrib };
    });
    const maxContrib = locationData.length > 0 ? Math.max(...locationData.map((d) => d.avgContrib)) : 0;
    const lineupTotals = getLineupTotals(playerName);

    return (
      <div className="player-card">
        <h3 className="player-name">⚔️ {playerName} - Attacking Stats{filterGroup ? ` · ${filterGroup}` : ""}</h3>

        <div className="summary-list">
          <div className="summary-row"><span className="summary-label">Avg Rating</span><span className={`badge badge-rating-${ratingClass}`}>{avgRating.toFixed(2)}</span></div>
          <div className="summary-row"><span className="summary-label">Matches</span><span className="plain-value">{totalMatches}</span></div>
          <div className="summary-row"><span className="summary-label">Total Goals</span><span className="plain-value">{totalGoals}</span></div>
          <div className="summary-row"><span className="summary-label">Assists</span><span className="plain-value">{statsData.assists}</span></div>
          {targetAssistPlayer && (
            <div className="summary-row">
              <span className="summary-label">Assists to {targetAssistPlayer}</span>
              <span className="plain-value">{totalAssistTo}</span>
            </div>
          )}
          <div className="summary-row"><span className="summary-label">Win Rate</span><span className={`badge badge-winrate-${winRateClass}`}>{winRate.toFixed(1)}%</span></div>
          <div className="summary-row"><span className="summary-label">Errors</span><span className={`badge badge-error-${errorClass}`}>{statsData.errors}</span></div>
          <div className="summary-row">
            <span className="summary-label">MOTM</span>
            <span className="plain-value">{totalMotm}</span>
          </div>

          {lineupTotals && lineupTotals.matches > 0 && (
            <>
              <div className="summary-row" style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1'}}>
                <span className="summary-label">Lineup Matches</span>
                <span className="plain-value">{lineupTotals.matches}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Lineup Avg Rating</span>
                <span className="plain-value">{lineupTotals.avgRating.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {totalGoals > 0 ? (
          <div className="chart-container">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#475569", font: { family: "'Barlow', sans-serif", size: 12 } } } } }} />
          </div>
        ) : (
          <div className="chart-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <p className="no-data" style={{margin: 0}}>No goal source data</p>
          </div>
        )}

        <div className="card-section form-section">
          <FormTrendGraph matches={statsData.matches} />
        </div>
        <div className="card-section streak-section">
          <StreakTracker matches={statsData.matches} />
        </div>

        {locationData.length > 0 && (
          <div className="location-section">
            <div className="location-title">📍 地点表现</div>
            <table className="location-table">
              <thead><tr><th>Location</th><th>Matches</th><th>Avg Goals</th><th>Avg Assists</th><th>Avg Contrib</th></tr></thead>
              <tbody>
                {locationData.map(({ loc, data, avgGoals, avgAssists, avgContrib }) => (
                  <tr key={loc} className={avgContrib === maxContrib && maxContrib > 0 ? "highlight" : ""}>
                    <td>{loc}</td><td>{data.count}</td><td>{avgGoals.toFixed(2)}</td><td>{avgAssists.toFixed(2)}</td><td>{avgContrib.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderSeasonalProfile = (playerName) => {
    // Friendly note when the player isn't part of the selected group
    // (never shown for Ryan/Darren — they bypass the group check)
    if (
      filterGroup &&
      !isPair(normalizeName(playerName)) &&
      playerGroupMap[normalizeName(playerName)] !== filterGroup
    ) {
      return (
        <div className="player-card simple-card">
          <h3 className="player-name">{playerName}</h3>
          <div className="no-data">
            <strong>{playerName}</strong> is not in the <strong>{filterGroup}</strong> group.
            Switch the group filter to see their stats.
          </div>
        </div>
      );
    }

    const playerData = lineupStats[normalizeName(playerName)];
    const playerMotm = motmStats[normalizeName(playerName)] || {};
    const totalMotm = Object.values(playerMotm).reduce((a, b) => a + b, 0);

    if (!playerData || Object.keys(playerData).length === 0) {
      return (
        <div className="player-card simple-card">
          <h3 className="player-name">{playerName}</h3>
          <div className="summary-list">
            <div className="summary-row">
              <span className="summary-label">MOTM</span>
              <span className="plain-value">{totalMotm}</span>
            </div>
          </div>
          <div className="no-data">
            No lineup records found for <strong>{playerName}</strong>.
          </div>
        </div>
      );
    }

    const seasons = Object.keys(playerData).sort().reverse();

    let totalMatches = 0;
    let totalRating = 0;
    seasons.forEach((s) => {
      totalMatches += playerData[s].matches;
      totalRating += playerData[s].totalRating;
    });
    const overallAvg = totalMatches > 0 ? totalRating / totalMatches : 0;
    const ratingClass = overallAvg < 6 ? "low" : overallAvg <= 8 ? "mid" : "high";

    return (
      <div className="player-card simple-card">
        <h3 className="player-name">🛡️ {playerName} - Lineup Stats</h3>
        <div className="summary-list">
          <div className="summary-row">
            <span className="summary-label">Overall Avg Rating</span>
            <span className={`badge badge-rating-${ratingClass}`}>{overallAvg.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Total Lineup Matches</span>
            <span className="plain-value">{totalMatches}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">MOTM</span>
            <span className="plain-value">{totalMotm}</span>
          </div>
        </div>

        {seasons.length > 0 && (
          <div className="location-section">
            <div className="location-title">📅 Season Breakdown</div>
            <table className="location-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Matches</th>
                  <th>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map(season => {
                  const sData = playerData[season];
                  const avg = sData.matches > 0 ? sData.totalRating / sData.matches : 0;
                  const sRatingClass = avg < 6 ? "low" : avg <= 8 ? "mid" : "high";
                  return (
                    <tr key={season}>
                      <td>{season}</td>
                      <td>{sData.matches}</td>
                      <td><span className={`badge badge-rating-${sRatingClass}`}>{avg.toFixed(2)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="stats-summary-wrap">
      <h2 className="stats-header">Stats Summary</h2>
      {debugInfo && (
        <div style={{
          textAlign: "center",
          color: debugInfo.includes("❌") ? "#ef4444" : "#64748b",
          fontSize: "13px",
          marginBottom: "15px",
          padding: "8px 12px",
          background: debugInfo.includes("❌") ? "#fef2f2" : "#f8fafc",
          borderRadius: "6px"
        }}>
          {debugInfo}
        </div>
      )}
      <div className="stats-layout">
        <div className="filter-panel">
          <h3 className="filter-title">Filters</h3>

          <div className="filter-group">
            <label className="filter-label">Player:</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="filter-select"
            >
              {dropdownPlayers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Group:</label>
            <select
              value={filterGroup}
              onChange={(e) => {
                setFilterGroup(e.target.value);
                if (e.target.value) setShowAllPlayers(true); // jump to the group's player table
              }}
              className="filter-select"
            >
              <option value="">All Groups</option>
              {filterGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {filterGroup && (
              <div className="filter-active">
                Group: <strong>{filterGroup}</strong>
              </div>
            )}
          </div>

          {getDetailedPlayerStats(selectedPlayer) && (
            <div className="filter-group">
              <label className="filter-label">Season (Attacking Stats):</label>
              <select value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)} className="filter-select">
                <option value="">All Seasons</option>
                {allSeasons.map((season) => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
              {filterSeason && (
                <div className="filter-active">
                  Showing: <strong>{filterSeason}</strong>
                </div>
              )}
            </div>
          )}

          <div className="filter-group">
            <button
              className={`all-players-btn ${showAllPlayers ? "active" : ""}`}
              onClick={() => setShowAllPlayers((prev) => !prev)}
            >
              {showAllPlayers ? "👤 Show Single Player" : "📋 Show All Players"}
            </button>
          </div>
        </div>

        <div className="cards-grid">
          {showAllPlayers ? (
            <div className="player-card all-players-card">
              <h3 className="player-name">
                📊 All Players {filterGroup ? `· ${filterGroup} ` : ""}{filterSeason ? `(${filterSeason})` : "(All Seasons)"}
              </h3>
              {allPlayersTable.length > 0 ? (
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table className="all-players-table" style={{ minWidth: "440px" }}>
                    <thead>
                      <tr>
                        {/* ✅ CHANGED: wider Player column to fit the avatar */}
                        <th style={{ textAlign: "left", paddingLeft: "6px", minWidth: "110px", maxWidth: "140px" }}>Player</th>
                        <th className="sortable-th" onClick={() => handleSort("matches")} title="Sort by Appearances">
                          Apps {sortArrow("matches")}
                        </th>
                        <th className="sortable-th" onClick={() => handleSort("avgRating")} title="Sort by Avg Rating">
                          Avg {sortArrow("avgRating")}
                        </th>
                        <th className="sortable-th" onClick={() => handleSort("winRate")} title="Sort by Win Rate (Wins / Apps)">
                          Win % {sortArrow("winRate")}
                        </th>
                        <th className="sortable-th" onClick={() => handleSort("goals")} title="Sort by Goals">
                          Goals {sortArrow("goals")}
                        </th>
                        <th className="sortable-th" onClick={() => handleSort("assists")} title="Sort by Assists">
                          Assists {sortArrow("assists")}
                        </th>
                        <th className="sortable-th" onClick={() => handleSort("errors")} title="Sort by Errors">
                          Errors {sortArrow("errors")}
                        </th>
                        <th className="sortable-th" onClick={() => handleSort("ownGoals")} title="Sort by Own Goals">
                          Own Goals {sortArrow("ownGoals")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPlayersTable.map(({ name, matches, avgRating, winRate, goals, assists, errors, ownGoals }) => {
                        const ratingClass = avgRating < 6 ? "low" : avgRating <= 8 ? "mid" : "high";
                        const winRateClass = winRate >= 50 ? "high" : winRate > 0 ? "mid" : "low";
                        return (
                          <tr
                            key={name}
                            onClick={() => { setSelectedPlayer(name); setShowAllPlayers(false); }}
                            title="Click to view detailed stats"
                          >
                            {/* ✅ CHANGED: avatar beside the player name */}
                            <td className="apt-player">
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <PlayerAvatar name={name} pictureMap={pictureMap} />
                                <span>{name}</span>
                              </div>
                            </td>
                            <td>{matches}</td>
                            <td>
                              <span className={`badge badge-rating-${ratingClass}`}>{avgRating.toFixed(2)}</span>
                            </td>
                            <td>
                              <span className={`badge badge-winrate-${winRateClass}`}>{winRate.toFixed(1)}%</span>
                            </td>
                            <td>{goals}</td>
                            <td>{assists}</td>
                            <td>{errors}</td>
                            <td>{ownGoals}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">No player records for this filter.</div>
              )}
            </div>
          ) : (
            renderDetailedProfile(selectedPlayer) || renderSeasonalProfile(selectedPlayer)
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsSummary;