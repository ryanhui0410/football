import React, { useState, useEffect, useMemo } from "react";
import MatchStatsModal from "./MatchStatsModal";
import "./ModifyDashboard.css";
import MatchLineup from "./MatchLineup";

// ═══════════════ TOP-LEVEL COMPONENTS ═══════════════

function ScorelineInput({ value, onChange }) {
  const parts = (value || "").split("-");
  const us = parts[0] ?? "";
  const them = parts[1] ?? "";
  const setSide = (side, raw) => {
    const clean = raw.replace(/\D/g, "");
    onChange(`${side === "us" ? clean : us}-${side === "them" ? clean : them}`);
  };
  const bump = (side, dir) => {
    const cur = parseInt(side === "us" ? us : them) || 0;
    setSide(side, String(Math.max(0, Math.min(99, cur + dir))));
  };
  const Side = ({ side, tag, val }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>{tag}</span>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <button type="button" onClick={() => bump(side, -1)}
          style={{ width: "30px", height: "30px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", fontSize: "16px", cursor: "pointer" }}>−</button>
        <input type="text" inputMode="numeric" value={val}
          onChange={(e) => setSide(side, e.target.value)}
          style={{ width: "44px", height: "34px", textAlign: "center", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: 700, fontSize: "16px", boxSizing: "border-box" }} />
        <button type="button" onClick={() => bump(side, 1)}
          style={{ width: "30px", height: "30px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", fontSize: "16px", cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center" }}>
      <Side side="us" tag="TEAM A" val={us} />
      <span style={{ fontSize: "22px", fontWeight: 700, color: "#334155" }}>–</span>
      <Side side="them" tag="TEAM B" val={them} />
    </div>
  );
}

function StatStepper({ label, value, onChange, max = 99 }) {
  const num = parseInt(value) || 0;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>{label}</span>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <button type="button" onClick={() => onChange(Math.max(0, num - 1))}
          style={{ width: "32px", height: "32px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", fontSize: "16px", cursor: "pointer" }}>−</button>
        <input type="text" inputMode="numeric" value={value ?? 0}
          onChange={(e) => onChange(Math.min(max, parseInt(e.target.value.replace(/\D/g, "")) || 0))}
          style={{ width: "48px", height: "32px", textAlign: "center", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
        <button type="button" onClick={() => onChange(Math.min(max, num + 1))}
          style={{ width: "32px", height: "32px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", fontSize: "16px", cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}

function deriveOutcome(matchResult, team) {
  const parts = (matchResult || "").split("-").map(s => parseInt(s.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return "";
  const [a, b] = parts;
  if (team === "A") return a > b ? "Win" : a < b ? "Loss" : "Draw";
  return b > a ? "Win" : b < a ? "Loss" : "Draw";
}

// ═══════════════ MAIN COMPONENT ═══════════════

function ModifyDashboard({ contributors, onSave }) {
  const [compareData, setCompareData] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);
  const [choiceMatch, setChoiceMatch] = useState(null);
  const [matchReport, setMatchReport] = useState(null);
  const [matchStatsData, setMatchStatsData] = useState([]);
  const [allLineups, setAllLineups] = useState([]);
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [slotToEdit, setSlotToEdit] = useState(null);
  const [editedLineup, setEditedLineup] = useState(null);
  const [lineupVersion, setLineupVersion] = useState(0);
  const [reportPerspective, setReportPerspective] = useState("");
  const [editedResult, setEditedResult] = useState("");
  const [slotStats, setSlotStats] = useState(null);
  const [selectedOtherPlayer, setSelectedOtherPlayer] = useState(null);
  const GITHUB_OWNER = "ryanhui0410";
  const GITHUB_REPO = "football";
  const IMAGES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/football-app/public/images`;

  const [pictureMap, setPictureMap] = useState({});
  const [activeFilter, setActiveFilter] = useState("All");
  const [othersExpanded, setOthersExpanded] = useState(false);

  const getPartner = (name) => {
    const n = (name || "").trim().toLowerCase();
    if (n === "ryan") return "Darren";
    if (n === "darren") return "Ryan";
    return null;
  };

  useEffect(() => {
    Promise.all([
      fetch(`https://football-stats-xbx6.onrender.com/match-lineups?t=${Date.now()}`).then(r => r.json()),
      fetch(`https://football-stats-xbx6.onrender.com/stats?t=${Date.now()}`).then(r => r.json()),
      fetch(`https://football-stats-xbx6.onrender.com/player-attributes?t=${Date.now()}`).then(r => r.json()),
      fetch(`${IMAGES_API_URL}?t=${Date.now()}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([lineups, stats, players, imageFiles]) => {
        setAllLineups(Array.isArray(lineups) ? lineups : []);
        setMatchStatsData(Array.isArray(stats) ? stats : []);
        setAvailablePlayers(Array.isArray(players) ? players : []);

        if (Array.isArray(imageFiles)) {
          const map = {};
          imageFiles
            .filter(f => /\.(jpe?g|png)$/i.test(f.name))
            .forEach(f => {
              map[f.name.replace(/\.(jpe?g|png)$/i, "").toLowerCase()] = f.download_url;
            });
          setPictureMap(map);
        }
      })
      .catch(err => console.error("Failed to fetch lineups/stats:", err));
  }, []);

  const getPicture = (name) =>
    pictureMap[(name || "").trim().toLowerCase()] || null;

  // ═══════════════ HELPERS ═══════════════

  const handleSlotPicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSlotStats(prev => ({ ...prev, picture: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.length === 10 && dateStr.includes("-")) return dateStr;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    return dateStr;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parts[2], parts[0] - 1, parts[1]);
    return new Date(dateStr);
  };

  const getRatingColor = (rating) => {
    const r = parseFloat(rating);
    if (isNaN(r)) return '#9e9e9e';
    if (r >= 9.0) return '#2563eb';
    if (r >= 7.0) return '#16a34a';
    if (r >= 5.0) return '#ea580c';
    return '#dc2626';
  };

  const getRatingBgColor = (rating) => {
    const r = parseFloat(rating);
    if (isNaN(r)) return '#e2e8f0';
    if (r > 9) return '#3b82f6';
    if (r >= 7) return '#22c55e';
    if (r >= 5) return '#eab308';
    return '#ef4444';
  };

  const getWinLossLetter = (winLoss) => {
    const w = (winLoss || "").trim().toLowerCase();
    if (w === "win" || w === "w") return "W";
    if (w === "loss" || w === "lose" || w === "l") return "L";
    if (w === "draw" || w === "d") return "D";
    return "";
  };

  const getFmRatingClass = (rating, isMotm) => {
    if (isMotm) return "motm";
    const r = parseFloat(rating);
    if (!isNaN(r) && r >= 7) return "good";
    return "";
  };

  // ⬅ CHANGED: 3 new helpers for player detail cards
  const getSeasonSummary = (playerName) => {
    const name = (playerName || "").trim().toLowerCase();
    const matches = matchStatsData.filter(
      s => (s.Contributor || "").trim().toLowerCase() === name
    );
    const goals = matches.reduce((sum, s) => sum + (parseFloat(s.Goal) || 0), 0);
    const assists = matches.reduce((sum, s) => sum + (parseFloat(s.Assist) || 0), 0);
    const motmCount = matches.filter(s => s["Man of the Match"] === true).length;
    const ratings = matches.map(s => parseFloat(s.Rating)).filter(r => !isNaN(r));
    const avgRating = ratings.length > 0
      ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
      : null;
    return { goals, assists, motmCount, avgRating, matchCount: matches.length };
  };

  const getPlayerAttributes = (playerName) => {
    const name = (playerName || "").trim().toLowerCase();
    const player = availablePlayers.find(
      p => (p.Contributor || "").trim().toLowerCase() === name
    );
    if (!player) return null;
    return [
      { label: "PAC", value: player.pace },
      { label: "SHO", value: player.shooting },
      { label: "PAS", value: player.passing },
      { label: "DRI", value: player.dribbling },
      { label: "DEF", value: player.defending },
      { label: "PHY", value: player.physical },
    ].filter(a => a.value != null);
  };

  const getRecentForm = (playerName) => {
    const name = (playerName || "").trim().toLowerCase();
    return matchStatsData
      .filter(s => (s.Contributor || "").trim().toLowerCase() === name)
      .sort((a, b) => parseDate(b.Date) - parseDate(a.Date))
      .slice(0, 5);
  };

  const splitSymbols = (symbolStr) => {
    if (!symbolStr) return [];
    const chars = [...symbolStr];
    const rows = [];
    const chunkSize = 5;
    for (let i = 0; i < chars.length; i += chunkSize) {
      rows.push(chars.slice(i, i + chunkSize));
    }
    return rows;
  };

  // ═══════════════ LINEUP-FIRST RESOLVER ═══════════════

  const findLineupMatch = (match) => {
    const normDate = normalizeDate(match.date);
    return allLineups.find(l =>
      normalizeDate(l.date) === normDate &&
      (l.location || "").trim() === (match.location || "").trim() &&
      (l.time || "").trim() === (match.time || "").trim()
    ) || null;
  };

  const findLineupPlayer = (lineup, contributorName) => {
    if (!lineup || !contributorName) return null;
    const teams = [lineup.teamA, lineup.teamB].filter(Boolean);
    for (const team of teams) {
      const players = [
        ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
        ...(Array.isArray(team.subs) ? team.subs : []),
      ];
      const me = players.find(
        p => p && p.Contributor &&
        p.Contributor.trim().toLowerCase() === contributorName.trim().toLowerCase()
      );
      if (me) return me;
    }
    return null;
  };

  const findLineupPlayerTeam = (lineup, contributorName) => {
    if (!lineup || !contributorName) return null;
    for (const [teamKey, team] of [["A", lineup.teamA], ["B", lineup.teamB]]) {
      if (!team) continue;
      const players = [
        ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
        ...(Array.isArray(team.subs) ? team.subs : []),
      ];
      if (players.some(p => p && p.Contributor &&
        p.Contributor.trim().toLowerCase() === contributorName.trim().toLowerCase())) {
        return teamKey;
      }
    }
    return null;
  };

  function normalizeName(name) {
    return (name || "").trim().toLowerCase();
  }

  const getPlayerMatchStats = (playerName, matchDate, matchLocation, matchTime) => {
    if (!playerName || !matchStatsData.length) return null;
    const normDate = normalizeDate(matchDate);
    return matchStatsData.find(s =>
      (s.Contributor || "").trim().toLowerCase() === playerName.trim().toLowerCase() &&
      normalizeDate(s.Date) === normDate &&
      (s.Location || "").trim().toLowerCase() === (matchLocation || "").trim().toLowerCase() &&
      (s.Time || "").trim().toLowerCase() === (matchTime || "").trim().toLowerCase()
    ) || null;
  };

  const buildResolvedMatch = (match, contributorName) => {
    const lineup = findLineupMatch(match);
    const lp = findLineupPlayer(lineup, contributorName);
    const stat = getPlayerMatchStats(contributorName, match.date, match.location, match.time);

    const lpGoal = parseInt(lp?.goal) || 0;
    const lpAssist = parseInt(lp?.assist) || 0;
    const lpLeft = parseInt(lp?.leftFoot) || 0;
    const lpRight = parseInt(lp?.rightFoot) || 0;
    const lpHead = parseInt(lp?.head) || 0;
    const lpOther = parseInt(lp?.other) || 0;
    const lpError = parseInt(lp?.error) || 0;
    const lpMotm = lp?.manOfTheMatch === true;

    const stGoal = stat ? (parseFloat(stat.Goal) || 0) : 0;
    const stAssist = stat ? (parseFloat(stat.Assist) || 0) : 0;
    const stLeft = stat ? (parseFloat(stat["Left Foot"]) || 0) : 0;
    const stRight = stat ? (parseFloat(stat["Right Foot"]) || 0) : 0;
    const stHead = stat ? (parseFloat(stat.Head) || 0) : 0;
    const stOther = stat ? (parseFloat(stat["Other body parts"]) || 0) : 0;
    const stError = stat ? (parseInt(stat.Error) || 0) : 0;
    const stMotm = stat?.["Man of the Match"] === true;

    const hasLpStats = lp && (
      lpGoal || lpAssist || lpLeft || lpRight || lpHead || lpOther || lpError || lpMotm
    );

    const goal = hasLpStats ? lpGoal : stGoal;
    const assist = hasLpStats ? lpAssist : stAssist;
    const leftFoot = hasLpStats ? lpLeft : stLeft;
    const rightFoot = hasLpStats ? lpRight : stRight;
    const head = hasLpStats ? lpHead : stHead;
    const other = hasLpStats ? lpOther : stOther;
    const error = hasLpStats ? lpError : stError;
    const manOfTheMatch = hasLpStats ? lpMotm : stMotm;

    const goalContribution = goal + assist;
    const symbol = "⚽".repeat(goal) + "👟".repeat(assist);

    const cLower = (contributorName || "").trim().toLowerCase();
    const assistRecipient = cLower === "ryan" ? "Darren" : cLower === "darren" ? "Ryan" : "";
    const assistToCount = assistRecipient && assist > 0
      ? (lp?.assistToCount ?? (stat ? (parseFloat(stat["Assist to count"]) || 0) : assist))
      : 0;
    const assistTo = assistRecipient && assistToCount > 0 ? assistRecipient : "";

    return {
      date: match.date,
      location: match.location,
      time: match.time,
      contributorName,
      rating: lp?.rating ?? (stat ? parseFloat(stat.Rating) : ""),
      picture: getPicture(contributorName) || "",
      goalContribution,
      assist,
      goal,
      symbol,
      leftFoot,
      rightFoot,
      head,
      other,
      error,
      manOfTheMatch,
      matchResult: findLineupMatch(match)?.matchResult || stat?.["Match result"] || "",
      winLoss: stat?.["Win/Loss?"] || "",
      season: stat?.Season || "",
      source: stat?.source || (lineup ? "Lineup only" : ""),
      assistTo,
      assistToCount,
      hasStats: !!stat,
      hasLineup: !!lineup,
    };
  };

  // ═══════════════ BUTTON HANDLERS ═══════════════

  const openStatsModal = (match, contributorName) => {
    const resolved = buildResolvedMatch(match, contributorName);
    setSelectedStats(resolved);
    setStatsModalOpen(true);
  };

  const fetchAndOpenReport = (isEditMode = false) => {
    const found = findLineupMatch(choiceMatch.match);
    if (!found) {
      alert("No tactical report found.");
      return;
    }

    setMatchReport(found);
    setEditedLineup(JSON.parse(JSON.stringify(found)));
    setIsEditingReport(isEditMode);
    setReportPerspective(choiceMatch.name);
    setLineupVersion(v => v + 1);

    let seededResult = "";
    const teamsSeed = [found.teamA, found.teamB].filter(Boolean);
    outerSeed: for (const team of teamsSeed) {
      const players = [
        ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
        ...(Array.isArray(team.subs) ? team.subs : []),
      ];
      for (const p of players) {
        if (!p?.Contributor) continue;
        const s = getPlayerMatchStats(p.Contributor, found.date, found.location, found.time);
        if (s && s["Match result"]) { seededResult = s["Match result"]; break outerSeed; }
      }
    }
    setEditedResult(seededResult);
  };

  // ═══════════════ BUILD ALL CONTRIBUTORS ═══════════════
  const allContributors = useMemo(() => {
    const byName = new Map();

    contributors.forEach(contributor => {
      byName.set(normalizeName(contributor.name), {
        name: contributor.name,
        matches: [...contributor.matches],
      });
    });

    allLineups.forEach(lineup => {
      const matchKey = `${normalizeDate(lineup.date)}|${(lineup.location || "").trim()}|${(lineup.time || "").trim()}`;

      let matchResult = lineup.matchResult || "";
      if (!matchResult) {
        const teams = [lineup.teamA, lineup.teamB].filter(Boolean);
        outer: for (const team of teams) {
          const players = [
            ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
            ...(Array.isArray(team.subs) ? team.subs : []),
          ];
          for (const p of players) {
            if (!p?.Contributor) continue;
            const anyStat = getPlayerMatchStats(p.Contributor, lineup.date, lineup.location, lineup.time);
            if (anyStat && anyStat["Match result"]) {
              matchResult = anyStat["Match result"];
              break outer;
            }
          }
        }
      }

      const teams = [lineup.teamA, lineup.teamB].filter(Boolean);
      teams.forEach((team, teamIdx) => {
        const teamLetter = teamIdx === 0 ? "A" : "B";
        const allPlayers = [
          ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
          ...(Array.isArray(team.subs) ? team.subs : []),
        ];
        allPlayers.forEach(p => {
          if (!p?.Contributor) return;
          const name = normalizeName(p.Contributor);

          if (!byName.has(name)) {
            byName.set(name, { name: p.Contributor, matches: [] });
          }
          const entry = byName.get(name);

          const alreadyHas = entry.matches.some(m =>
            `${normalizeDate(m.date)}|${(m.location || "").trim()}|${(m.time || "").trim()}` === matchKey
          );
          if (alreadyHas) return;

          const winLoss = deriveOutcome(matchResult, teamLetter);

          entry.matches.push({
            date: lineup.date,
            location: lineup.location,
            time: lineup.time,
            rating: p.rating ?? "",
            matchResult,
            winLoss,
            goalContribution: (parseInt(p.goal) || 0) + (parseInt(p.assist) || 0),
            assist: parseInt(p.assist) || 0,
            symbol: "⚽".repeat(parseInt(p.goal) || 0) + "👟".repeat(parseInt(p.assist) || 0),
            manOfTheMatch: p.manOfTheMatch === true,
            isLineupOnly: true,
          });
        });
      });
    });

    return Array.from(byName.values())
      .sort((a, b) => {
        const rank = (n) => {
          const l = n.toLowerCase();
          if (l === "ryan") return 0;
          if (l === "darren") return 1;
          return 2;
        };
        const ra = rank(a.name), rb = rank(b.name);
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name, "zh-Hant");
      });
  }, [contributors, allLineups, matchStatsData]);

  const otherPlayers = useMemo(() =>
    allContributors
      .map(c => c.name)
      .filter(n => {
        const l = normalizeName(n);
        return l !== "ryan" && l !== "darren";
      })
      .sort((a, b) => a.localeCompare(b, "zh-Hant")),
  [allContributors]);

  const displayContributors = useMemo(() => {
    if (activeFilter === "All") return allContributors;
    if (activeFilter === "Ryan")
      return allContributors.filter(c => normalizeName(c.name) === "ryan");
    if (activeFilter === "Darren")
      return allContributors.filter(c => normalizeName(c.name) === "darren");
    if (activeFilter === "Others") {
      if (selectedOtherPlayer) {
        return allContributors.filter(
          c => normalizeName(c.name) === normalizeName(selectedOtherPlayer)
        );
      }
      return allContributors.filter(c => {
        const l = normalizeName(c.name);
        return l !== "ryan" && l !== "darren";
      });
    }
    return allContributors;
  }, [allContributors, activeFilter, selectedOtherPlayer]);

  const enrichLineupWithMotm = (lineup) => {
    if (!lineup) return lineup;
    const enriched = JSON.parse(JSON.stringify(lineup));
    ['teamA', 'teamB'].forEach(team => {
      ['players', 'subs'].forEach(key => {
        if (Array.isArray(enriched[team]?.[key])) {
          enriched[team][key] = enriched[team][key].map(player => {
            if (!player) return null;
            const stat = getPlayerMatchStats(player.Contributor, enriched.date, enriched.location, enriched.time);
            return {
              ...player,
              isMotm: player.manOfTheMatch != null
                ? player.manOfTheMatch === true
                : (stat ? stat["Man of the Match"] === true : false),
              goals: player.goal != null
                ? (parseInt(player.goal) || 0)
                : (stat ? (parseInt(stat.Goal) || 0) : 0),
              assists: player.assist != null
                ? (parseInt(player.assist) || 0)
                : (stat ? (parseInt(stat.Assist) || 0) : 0),
            };
          });
        }
      });
    });
    return enriched;
  };

  const calcTeamAverage = (teamObj) => {
    if (!teamObj) return null;
    const playersArr = Array.isArray(teamObj.players)
      ? teamObj.players
      : Object.values(teamObj.players || {});
    const subsArr = Array.isArray(teamObj.subs)
      ? teamObj.subs
      : Object.values(teamObj.subs || {});
    const allPlayers = [...playersArr, ...subsArr];
    const ratings = allPlayers
      .filter(p => p && p.rating != null)
      .map(p => parseFloat(p.rating))
      .filter(r => !isNaN(r));
    if (ratings.length === 0) return null;
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
  };

  // ═══════════════ SAVE ═══════════════

  const handleSaveReportLineup = async () => {
    if (!editedLineup) return;

    const sanitizeTeam = (teamObj) => {
      if (!teamObj) return { formation: "4-4-2", players: Array(11).fill(null), subs: Array(4).fill(null) }; // ⬅ CHANGED
      const cleanPlayer = (p) => {
        if (!p) return null;
        return {
          ...p,
          rating: parseFloat(p.rating) || 0,
          manOfTheMatch: p.manOfTheMatch === true,
        };
      };

      const cleanPlayers = (teamObj.players || []).map(cleanPlayer);
      const cleanSubs = (teamObj.subs || []).map(cleanPlayer);
      while (cleanSubs.length < 4) cleanSubs.push(null); // ⬅ CHANGED: was 2

      return {
        formation: teamObj.formation || "4-4-2",
        players: cleanPlayers.slice(0, 11),
        subs: cleanSubs.slice(0, 4) // ⬅ CHANGED: was 2
      };
    };

    const payload = {
      date: editedLineup.date,
      location: editedLineup.location,
      time: editedLineup.time,
      matchResult: editedResult ?? "",
      teamA: sanitizeTeam(editedLineup.teamA),
      teamB: sanitizeTeam(editedLineup.teamB),
    };

    try {
      const res = await fetch(`https://football-stats-xbx6.onrender.com/match-lineups?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        alert(`⚠️ Saved locally, but GitHub failed: ${result.githubError || result.error}`);
        return;
      }
      alert("✅ Match Report saved!");

      setIsEditingReport(false);
      setMatchReport(JSON.parse(JSON.stringify({ ...editedLineup, teamA: payload.teamA, teamB: payload.teamB })));
      setLineupVersion(v => v + 1);
      setAllLineups(prev => {
        const idx = prev.findIndex(l =>
          normalizeDate(l.date) === normalizeDate(payload.date) &&
          (l.location || "").trim() === (payload.location || "").trim() &&
          (l.time || "").trim() === (payload.time || "").trim()
        );
        if (idx === -1) return [...prev, JSON.parse(JSON.stringify({ ...editedLineup, teamA: payload.teamA, teamB: payload.teamB }))];
        const next = [...prev];
        next[idx] = JSON.parse(JSON.stringify({ ...editedLineup, teamA: payload.teamA, teamB: payload.teamB }));
        return next;
      });
    } catch (err) {
      console.error("Save failed:", err);
      alert("❌ Failed to save match report");
    }
  };

  const getLayoutType = () => {
    const isMobileWidth = window.innerWidth <= 850;
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isMobileWidth && isPortrait) return "vertical";
    return "horizontal";
  };

  const [layout, setLayout] = useState(getLayoutType());

  useEffect(() => {
    const handleResize = () => setLayout(getLayoutType());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div className="md-wrap">
      <div className="md-filter-bar">
        <span className="md-filter-label">Filter by Player:</span>
        <div className="md-filter-pills">
          {["All", "Ryan", "Darren", "Others"].map(name => (
            <button
              key={name}
              className={`md-pill ${
                activeFilter === name || (name === "Others" && selectedOtherPlayer)
                  ? 'active' : ''
              }`}
              onClick={() => {
                if (name === "Others") {
                  setOthersExpanded(prev => !prev);
                  setActiveFilter("Others");
                  setSelectedOtherPlayer(null);
                } else {
                  setActiveFilter(name);
                  setOthersExpanded(false);
                  setSelectedOtherPlayer(null);
                }
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {othersExpanded && (
          <div className="md-others-list">
            {otherPlayers.map(name => (
              <button
                key={name}
                className={`md-pill md-pill-sm ${selectedOtherPlayer === name ? 'active' : ''}`}
                onClick={() => {
                  setSelectedOtherPlayer(name);
                  setActiveFilter("Others");
                  setOthersExpanded(false);
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {displayContributors.map((contributor) => {
        const sortedMatches = [...contributor.matches].sort((a, b) => parseDate(b.date) - parseDate(a.date));
        return (
          <div key={contributor.name} className="md-contributor-section">
            <div className="md-contributor-header">
              <h2 className="md-contributor-name">{contributor.name}</h2>
              <span className="md-match-count">{sortedMatches.length} Matches</span>
            </div>

            <table className="md-table">
              <thead className="md-thead">
                <tr>
                  <th className="md-th md-th-date">Date & Location</th>
                  <th className="md-th md-th-result center">Match Result</th>
                  <th className="md-th md-th-contrib center">Contributions</th>
                  <th className="md-th md-th-rating center">Rating</th>
                  <th className="md-th md-th-action center">Action</th>
                </tr>
              </thead>
              <tbody className="md-tbody">
                {sortedMatches.map((match, idx) => (
                  <tr key={idx} className="md-row" onClick={() => setChoiceMatch({ match: match, name: contributor.name })}>
                    <td className="md-td" data-label="Date & Location">
                      <div className="md-date">{match.date}</div>
                      <div className="md-location">📍 {match.location || "Unknown"}</div>
                    </td>
                    <td className="md-td center" data-label="Match Result">
                      <div className={`md-result-box ${match.winLoss ? match.winLoss.toLowerCase() : ''}`}>
                        <div className="md-score">{match.matchResult || "—"}</div>
                        {match.winLoss && <div className={`md-outcome ${match.winLoss.toLowerCase()}`}>{match.winLoss}</div>}
                      </div>
                    </td>
                    <td className="md-td center" data-label="Contributions">
                      {match.symbol ? (
                        <div className="md-symbols-wrapper">
                          {splitSymbols(match.symbol).map((row, rowIdx) => (
                            <div key={rowIdx} className="md-symbols-row">
                              {row.map((ch, idx) => (
                                <span key={idx} className="md-symbol-icon">{ch}</span>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="md-symbols empty">No symbols</span>
                      )}
                    </td>
                    <td className="md-td center" data-label="Rating">
                      {match.manOfTheMatch ? (
                        <span className="md-rating-motm-wrapper">
                          <span
                            className="md-rating md-rating-motm"
                            style={{ backgroundColor: getRatingBgColor(match.rating) }}
                          >
                            {match.rating || "—"}
                          </span>
                        </span>
                      ) : (
                        <span
                          className="md-rating"
                          style={{ backgroundColor: getRatingBgColor(match.rating) }}
                        >
                          {match.rating || "—"}
                        </span>
                      )}
                    </td>
                    <td className="md-td center" data-label="Action">
                      <span className="md-actions-hint">Tap row →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="fm-list">
              {sortedMatches.map((match, idx) => {
                const goals = Math.max(0, (match.goalContribution || 0) - (match.assist || 0));
                const assists = match.assist || 0;
                const wlLetter = getWinLossLetter(match.winLoss);
                const isMotm = !!match.manOfTheMatch;
                return (
                  <div
                    key={`fm-${idx}`}
                    className="fm-row"
                    onClick={() => setChoiceMatch({ match: match, name: contributor.name })}
                  >
                    <div className="fm-row-top">
                      <span className="fm-date">{match.date}</span>
                      <span className="fm-location">📍 {match.location || "Unknown"}</span>
                    </div>

                    <div className="fm-row-main">
                      <div className="fm-left">
                        {wlLetter && (
                          <span className={`fm-wl fm-wl-${wlLetter.toLowerCase()}`}>{wlLetter}</span>
                        )}
                        <span className="fm-score">{match.matchResult || "—"}</span>
                      </div>
                      <div className="fm-right">
                        {goals > 0 && (
                          <span className="fm-icons fm-goals" title={`${goals} goal(s)`}>
                            {[...Array(goals)].map((_, i) => (
                              <span key={`g-${i}`} className="fm-icon">⚽</span>
                            ))}
                          </span>
                        )}
                        {assists > 0 && (
                          <span className="fm-icons fm-assists" title={`${assists} assist(s)`}>
                            {[...Array(assists)].map((_, i) => (
                              <span key={`a-${i}`} className="fm-icon">👟</span>
                            ))}
                          </span>
                        )}
                        {goals === 0 && assists === 0 && <span className="fm-ga fm-none">—</span>}

                        <span className={`fm-rating-box ${getFmRatingClass(match.rating, isMotm)}`}>
                          {match.rating || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <MatchStatsModal open={statsModalOpen} match={selectedStats} onClose={() => setStatsModalOpen(false)} />

      {/* CHOICE MODAL */}
      {choiceMatch && !matchReport && (
        <div className="choice-overlay" onClick={() => setChoiceMatch(null)}>
          <div className="choice-modal" onClick={e => e.stopPropagation()}>
            <button className="choice-close" onClick={() => setChoiceMatch(null)}>✕</button>
            <h3>Match on {choiceMatch.match.date}</h3>
            <p className="choice-subtitle">What would you like to view for <strong>{choiceMatch.name}</strong>?</p>
            <div className="choice-buttons">
              <button className="choice-btn stats" onClick={() => { openStatsModal(choiceMatch.match, choiceMatch.name); setChoiceMatch(null); }}>
                📊 <span>View Individual Stats</span>
              </button>
              <button className="choice-btn report" onClick={() => fetchAndOpenReport(false)}>
                ⚽ <span>View Match Report</span>
              </button>
              <button className="choice-btn edit-report" onClick={() => fetchAndOpenReport(true)}>
                ✏️ <span>Edit Match Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MATCH REPORT OVERLAY */}
      {matchReport && (
        <div className="report-overlay" onClick={() => { setMatchReport(null); }}>
          <div className="report-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '25px' }}>
            <button className="report-close" onClick={() => { setMatchReport(null); }}>✕</button>
            <h2 className="report-title">⚽ Match Report: {matchReport.date}</h2>
            {matchReport.location && <p className="report-meta">📍 {matchReport.location} {matchReport.time && `• 🕒 ${matchReport.time}`}</p>}

            {(() => {
              const avgA = calcTeamAverage(matchReport.teamA);
              const avgB = calcTeamAverage(matchReport.teamB);

              let matchResult = matchReport.matchResult || '';
              let winLoss = '';

              if (!matchResult) {
                const playersA = Array.isArray(matchReport.teamA?.players) ? matchReport.teamA.players : Object.values(matchReport.teamA?.players || {});
                const playersB = Array.isArray(matchReport.teamB?.players) ? matchReport.teamB.players : Object.values(matchReport.teamB?.players || {});
                const allPlayers = [...playersA, ...playersB].filter(p => p != null);

                for (const p of allPlayers) {
                  const stat = getPlayerMatchStats(p.Contributor, matchReport.date, matchReport.location, matchReport.time);
                  if (stat && stat["Match result"]) {
                    matchResult = stat["Match result"];
                    break;
                  }
                }
              }

              if (matchResult) {
                const myTeam = findLineupPlayerTeam(matchReport, reportPerspective);
                winLoss = deriveOutcome(matchResult, myTeam);
              }

              return (
                <>
                  {isEditingReport ? (
                    <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px", marginBottom: "10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", textAlign: "center", marginBottom: "6px" }}>
                        ⚽ Match Result (Team A – Team B)
                      </div>
                      <ScorelineInput
                        value={editedResult}
                        onChange={(val) => setEditedResult(val)}
                      />
                    </div>
                  ) : (
                    <div className="report-result-header" style={{ justifyContent: 'center', border: 'none', background: 'transparent', padding: '10px 0', marginBottom: '10px' }}>
                      <div className="result-score-center">
                        <span className="result-score">{matchResult || '—'}</span>
                        {winLoss && <span className={`result-wl ${winLoss.toLowerCase()}`}>{winLoss}</span>}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '10px' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#444' }}>
                      {isEditingReport ? "✏️ Edit Tactical Lineup" : "Tactical Lineup"}
                    </h3>

                    <div style={{ position: 'relative' }}>
                      <MatchLineup
                        key={`lineup-${isEditingReport ? 'edit' : 'view'}-${lineupVersion}`}
                        matchData={{ Date: matchReport.date, Location: matchReport.location, Time: matchReport.time }}
                        initialLineup={enrichLineupWithMotm(isEditingReport ? editedLineup : matchReport)}
                        readOnly={!isEditingReport}
                        pictureMap={pictureMap}
                        editMode={isEditingReport}
                        layout={layout}
                        availablePlayers={availablePlayers}
                        getRatingColor={getRatingColor}
                        getPlayerMatchStats={getPlayerMatchStats}
                        onLineupChange={(newLineup) => {
                          setEditedLineup(prev => ({ ...prev, ...newLineup }));
                        }}
                        onSlotClick={(team, idx, player) => {
                          setSlotToEdit({ team, idx, player });
                          if (player) {
                            const stat = getPlayerMatchStats(player.Contributor, matchReport.date, matchReport.location, matchReport.time);
                            setSlotStats({
                              rating: player.rating ?? (stat ? parseFloat(stat.Rating) : ""),
                              goal: player.goal ?? (stat ? (parseInt(stat.Goal) || 0) : 0),
                              assist: player.assist ?? (stat ? (parseInt(stat.Assist) || 0) : 0),
                              error: player.error ?? (stat ? (parseInt(stat.Error) || 0) : 0),
                              ownGoal: player.ownGoal ?? (stat ? (parseInt(stat["Own Goal"]) || 0) : 0),
                              assistTo: player.assistTo ?? (stat?.["Assist to"] || ""),
                              leftFoot: player.leftFoot ?? (stat ? (parseInt(stat["Left Foot"]) || 0) : 0),
                              rightFoot: player.rightFoot ?? (stat ? (parseInt(stat["Right Foot"]) || 0) : 0),
                              head: player.head ?? (stat ? (parseInt(stat.Head) || 0) : 0),
                              other: player.other ?? (stat ? (parseInt(stat["Other body parts"]) || 0) : 0),
                              manOfTheMatch: player.manOfTheMatch ?? (stat ? stat["Man of the Match"] === true : false),
                              assistToCount: player.assistToCount ?? (stat ? (parseInt(stat["Assist to count"]) || 0): 0),
                            });
                          } else {
                            setSlotStats(null);
                          }
                        }}
                      />
                    </div>

                    {isEditingReport && (
                      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { setIsEditingReport(false); setEditedLineup(null); setLineupVersion(v => v + 1); }}
                          style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveReportLineup}
                          style={{
                            padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none',
                            borderRadius: '6px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                          }}
                        >
                          💾 Save Lineup
                        </button>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* SLOT EDIT MODAL */}
            {slotToEdit && (
              <div className="slot-edit-overlay" onClick={() => setSlotToEdit(null)}>
                <div className="slot-edit-modal" onClick={e => e.stopPropagation()}>
                  <button className="slot-edit-close" onClick={() => setSlotToEdit(null)}>✕</button>
                  <h3>{slotToEdit.player ? "Edit Player" : "Add Player"}</h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>Select Player:</label>
                    <select
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                      value={slotToEdit.player?.Contributor || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setSlotToEdit(prev => ({ ...prev, player: null }));
                          setSlotStats(null);
                        } else {
                          const selected = availablePlayers.find(p => p.Contributor === val);
                          setSlotToEdit(prev => ({
                            ...prev,
                            player: {
                              Contributor: selected.Contributor,
                              picture: selected.picture || `/${selected.Contributor}.jpeg`,
                              rating: prev.player?.rating !== undefined ? prev.player.rating : ""
                            }
                          }));
                          const stat = getPlayerMatchStats(selected.Contributor, matchReport.date, matchReport.location, matchReport.time);
                          setSlotStats({
                            rating: prevRatingOf(selected, stat),
                            goal: parseInt(selected.goal) || (stat ? (parseInt(stat.Goal) || 0) : 0),
                            assist: parseInt(selected.assist) || (stat ? (parseInt(stat.Assist) || 0) : 0),
                            error: parseInt(selected.error) || (stat ? (parseInt(stat.Error) || 0) : 0),
                            ownGoal: parseInt(selected.ownGoal) || (stat ? (parseInt(stat["Own Goal"]) || 0) : 0),
                            assistToCount: selected.assistToCount ?? (stat ? (parseInt(stat["Assist to count"]) || 0) : 0),
                            leftFoot: parseInt(selected.leftFoot) || (stat ? (parseInt(stat["Left Foot"]) || 0) : 0),
                            rightFoot: parseInt(selected.rightFoot) || (stat ? (parseInt(stat["Right Foot"]) || 0) : 0),
                            head: parseInt(selected.head) || (stat ? (parseInt(stat.Head) || 0) : 0),
                            other: parseInt(selected.other) || (stat ? (parseInt(stat["Other body parts"]) || 0) : 0),
                            manOfTheMatch: selected.manOfTheMatch === true || (stat ? stat["Man of the Match"] === true : false),
                          });
                        }
                      }}
                    >
                      <option value="">-- Empty Slot --</option>
                      {availablePlayers.map(p => (
                        <option key={p.Contributor} value={p.Contributor}>{p.Contributor}</option>
                      ))}
                    </select>
                  </div>

                  {slotToEdit.player && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>Profile Picture</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {slotStats?.picture && (
                          <img
                            src={slotStats.picture}
                            alt="Preview"
                            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }}
                          />
                        )}
                        <label style={{
                          padding: '8px 16px', background: '#eff6ff', color: '#1d4ed8',
                          borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
                        }}>
                          📷 Choose New Photo
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSlotPicture} />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ══ ⬅ CHANGED: Player detail cards — fills the freed bottom space ══ */}
                  {slotToEdit.player && (() => {
                    const pname = slotToEdit.player.Contributor;
                    const summary = getSeasonSummary(pname);
                    const attributes = getPlayerAttributes(pname);
                    const recentForm = getRecentForm(pname);

                    return (
                      <>
                        {/* Season Summary */}
                        <div className="pd-section pd-summary">
                          <h4>📊 Season Summary</h4>
                          {summary.matchCount > 0 ? (
                            <div className="pd-stat-grid">
                              <div className="pd-stat-item">
                                <span className="pd-stat-value" style={{ color: "#16a34a" }}>{summary.goals}</span>
                                <span className="pd-stat-label">Goals</span>
                              </div>
                              <div className="pd-stat-item">
                                <span className="pd-stat-value" style={{ color: "#2563eb" }}>{summary.assists}</span>
                                <span className="pd-stat-label">Assists</span>
                              </div>
                              <div className="pd-stat-item">
                                <span className="pd-stat-value" style={{ color: "#f59e0b" }}>{summary.motmCount}</span>
                                <span className="pd-stat-label">MOTM</span>
                              </div>
                              <div className="pd-stat-item">
                                <span className="pd-stat-value" style={{ color: getRatingColor(summary.avgRating) }}>
                                  {summary.avgRating || "—"}
                                </span>
                                <span className="pd-stat-label">Avg ({summary.matchCount})</span>
                              </div>
                            </div>
                          ) : (
                            <div className="pd-empty">No season stats yet</div>
                          )}
                        </div>

                        {/* Player Attributes */}
                        {attributes && attributes.length > 0 && (
                          <div className="pd-section pd-attributes">
                            <h4>🎯 Player Attributes</h4>
                            <div className="pd-attr-grid">
                              {attributes.map(a => (
                                <div key={a.label} className="pd-attr-item">
                                  <span className="pd-attr-value">{a.value}</span>
                                  <span className="pd-attr-label">{a.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent Form */}
                        {recentForm.length > 0 && (
                          <div className="pd-section pd-form">
                            <h4>📈 Recent Form</h4>
                            <div className="pd-form-row">
                              {recentForm.map((m, i) => {
                                const r = parseFloat(m.Rating);
                                const bg = !isNaN(r)
                                  ? r >= 7 ? "#16a34a" : r >= 5 ? "#eab308" : "#ef4444"
                                  : "#9ca3af";
                                const isMotm = m["Man of the Match"] === true;
                                return (
                                  <div
                                    key={i}
                                    className={`pd-form-chip ${isMotm ? "pd-form-motm" : ""}`}
                                    style={{ background: bg }}
                                    title={`${m.Date} — ${m.Location || ""} | Rating: ${m.Rating || "—"}${isMotm ? " ⭐MOTM" : ""}`}
                                  >
                                    <span className="pd-form-rating">{m.Rating || "—"}</span>
                                    <span className="pd-form-date">{m.Date}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {slotToEdit.player && slotStats && (
                    <>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>Match Rating (0-10.0):</label>
                        <input
                          type="number" min="0" max="10" step="0.1"
                          value={slotStats.rating !== "" && slotStats.rating !== undefined ? slotStats.rating : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSlotStats(prev => ({ ...prev, rating: val === "" ? "" : parseFloat(val) }));
                          }}
                        />
                      </div>

                      <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "10px", marginBottom: "16px" }}>
                        <h4 style={{ margin: "0 0 6px", fontFamily: "'Oswald', sans-serif", color: "#1e3a8a", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.1em" }}>
                          ⚽ Match Stats
                        </h4>
                        <StatStepper label="Goal" value={slotStats.goal} onChange={(v) => setSlotStats(s => ({ ...s, goal: v }))} />

                        {getPartner(slotToEdit.player.Contributor) && (
                          <>
                            <StatStepper label="Left Foot" value={slotStats.leftFoot} max={slotStats.goal}
                              onChange={(v) => setSlotStats(s => ({ ...s, leftFoot: v }))} />
                            <StatStepper label="Right Foot" value={slotStats.rightFoot} max={slotStats.goal}
                              onChange={(v) => setSlotStats(s => ({ ...s, rightFoot: v }))} />
                            <StatStepper label="Head" value={slotStats.head} max={slotStats.goal}
                              onChange={(v) => setSlotStats(s => ({ ...s, head: v }))} />
                            <StatStepper label="Other Body Parts" value={slotStats.other} max={slotStats.goal}
                              onChange={(v) => setSlotStats(s => ({ ...s, other: v }))} />

                            {(() => {
                              const bodyTotal = (slotStats.leftFoot || 0) + (slotStats.rightFoot || 0) + (slotStats.head || 0) + (slotStats.other || 0);
                              const tallyOk = (slotStats.goal || 0) === bodyTotal;
                              return tallyOk ? (
                                <div style={{
                                  display: "flex", alignItems: "center", gap: "8px",
                                  background: "#dcfce7", border: "1px solid #86efac", color: "#166534",
                                  borderRadius: "8px", padding: "8px 10px", fontSize: "12px", fontWeight: 600, marginTop: "6px"
                                }}>
                                  ✓ Goal ({slotStats.goal || 0}) = LF ({slotStats.leftFoot || 0}) + RF ({slotStats.rightFoot || 0}) + Head ({slotStats.head || 0}) + Other ({slotStats.other || 0})
                                </div>
                              ) : (
                                <div style={{
                                  display: "flex", alignItems: "center", gap: "8px",
                                  background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c",
                                  borderRadius: "8px", padding: "8px 10px", fontSize: "12px", fontWeight: 600, marginTop: "6px"
                                }}>
                                  ⚠ Mismatch: Goal ({slotStats.goal || 0}) ≠ breakdown total ({bodyTotal}) — off by {Math.abs((slotStats.goal || 0) - bodyTotal)}
                                </div>
                              );
                            })()}
                          </>
                        )}

                        <StatStepper label="Own Goal" value={slotStats.ownGoal} onChange={(v) => setSlotStats(s => ({ ...s, ownGoal: v }))} />
                        <StatStepper label="Assist" value={slotStats.assist} onChange={(v) => setSlotStats(s => ({ ...s, assist: v }))} />
                        <StatStepper label="Error" value={slotStats.error} onChange={(v) => setSlotStats(s => ({ ...s, error: v }))} />

                        {getPartner(slotToEdit.player.Contributor) && slotStats.assist > 0 && (
                          <StatStepper
                            label={`No. of assist to ${getPartner(slotToEdit.player.Contributor)}`}
                            value={slotStats.assistToCount ?? 0}
                            max={slotStats.assist}
                            onChange={(v) => setSlotStats(s => ({ ...s, assistToCount: v }))}
                          />
                        )}

                        <div style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "12px 0", marginTop: "8px",
                          borderTop: "2px solid #e2e8f0", cursor: "pointer"
                        }}
                          onClick={() => setSlotStats(s => ({ ...s, manOfTheMatch: !s.manOfTheMatch }))}
                        >
                          <input
                            type="checkbox"
                            checked={!!slotStats.manOfTheMatch}
                            onChange={(e) => setSlotStats(s => ({ ...s, manOfTheMatch: e.target.checked }))}
                            style={{ width: "22px", height: "22px", cursor: "pointer", accentColor: "#f59e0b" }}
                          />
                          <label style={{
                            fontWeight: 700, fontSize: "15px",
                            color: slotStats.manOfTheMatch ? "#b45309" : "#475569",
                            cursor: "pointer", userSelect: "none",
                            display: "flex", alignItems: "center", gap: "6px"
                          }}>
                            ⭐ Man of the Match
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setSlotToEdit(null)} style={{ padding: '10px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button
                      onClick={async () => {
                        const { team, idx, player } = slotToEdit;
                        let picture = player?.picture ?? "";

                        if (slotStats?.picture && slotStats.picture.startsWith("data:")) {
                          try {
                            const upRes = await fetch("https://football-stats-xbx6.onrender.com/upload-player-picture", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: player.Contributor, image: slotStats.picture }),
                            });
                            const upResult = await upRes.json();
                            if (!upRes.ok) {
                              alert(`⚠️ Picture upload failed: ${upResult.githubError || upResult.error || upRes.status}`);
                              return;
                            }
                            picture = upResult.picture;
                            setPictureMap(prev => ({
                              ...prev,
                              [player.Contributor.trim().toLowerCase()]: picture,
                            }));
                          } catch (err) {
                            alert(`⚠️ Picture upload network error: ${err.message}`);
                            return;
                          }
                        }

                        const teamKey = team === 'A' ? 'teamA' : 'teamB';
                        const mergedPlayer = player
                          ? {
                              ...player,
                              picture,
                              rating: slotStats?.rating ?? player.rating,
                              goal: slotStats?.goal ?? 0,
                              assist: slotStats?.assist ?? 0,
                              error: slotStats?.error ?? 0,
                              ownGoal: slotStats?.ownGoal ?? 0,
                              leftFoot: slotStats?.leftFoot ?? 0,
                              rightFoot: slotStats?.rightFoot ?? 0,
                              head: slotStats?.head ?? 0,
                              other: slotStats?.other ?? 0,
                              manOfTheMatch: slotStats?.manOfTheMatch === true,
                              assistTo: getPartner(player.Contributor) && (slotStats?.assistToCount ?? 0) > 0
                                ? getPartner(player.Contributor)
                                : "",
                              assistToCount: getPartner(player.Contributor) ? (slotStats?.assistToCount ?? 0) : 0,
                            }
                          : null;

                        setEditedLineup(prev => {
                          const newLineup = JSON.parse(JSON.stringify(prev));

                          if (typeof idx === 'string' && idx.startsWith('sub')) {
                            const subIdx = parseInt(idx.replace('sub', ''));
                            // ⬅ CHANGED: pad subs to 4 instead of 2
                            if (!Array.isArray(newLineup[teamKey].subs) || newLineup[teamKey].subs.length < 4) {
                              const old = Array.isArray(newLineup[teamKey].subs) ? newLineup[teamKey].subs : [];
                              newLineup[teamKey].subs = [...old, ...Array(Math.max(0, 4 - old.length)).fill(null)].slice(0, 4);
                            }
                            newLineup[teamKey].subs[subIdx] = mergedPlayer;
                          } else {
                            if (!Array.isArray(newLineup[teamKey].players)) {
                              newLineup[teamKey].players = Array(11).fill(null);
                            }
                            newLineup[teamKey].players[idx] = mergedPlayer;
                          }
                          return newLineup;
                        });
                        setLineupVersion(v => v + 1);
                        setSlotToEdit(null);
                      }}
                      style={{ padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Save to Pitch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function prevRatingOf(player, stat) {
  if (player && player.rating !== undefined && player.rating !== null && player.rating !== "") return player.rating;
  return stat ? (parseFloat(stat.Rating) || "") : "";
}

export default ModifyDashboard;