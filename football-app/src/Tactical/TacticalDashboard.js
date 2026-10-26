import React, { useState, useEffect, useMemo } from "react";
import MatchLineup from "../EditStats/MatchLineup";
import "./TacticalDashboard.css";

// ✅ Inline stat stepper for the slot modal
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

// ✅ Us–Them scoreline stepper
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
    <div className="td-field">
      <label>⚽ Match Result (Team A – Team B)</label>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center" }}>
        <Side side="us" tag="TEAM A" val={us} />
        <span style={{ fontSize: "22px", fontWeight: 700, color: "#334155" }}>–</span>
        <Side side="them" tag="TEAM B" val={them} />
      </div>
    </div>
  );
}

// ✅ Inline calendar picker
function CalendarPicker({ value, onChange }) {
  const parts = (value || "").split("/").map(Number);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parts[2] && !isNaN(parts[2]) ? parts[2] : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(
    parts[0] && !isNaN(parts[0]) ? parts[0] - 1 : new Date().getMonth()
  );

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    onChange(`${viewMonth + 1}/${day}/${viewYear}`);
    setOpen(false);
  };

  const selParts = (value || "").split("/").map(Number);
  const selMatch = (day) =>
    selParts[0] === viewMonth + 1 && selParts[1] === day && selParts[2] === viewYear;

  const blanks = Array(firstWeekday).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="td-field" style={{ position: "relative" }}>
      <label>📅 Match Date</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1",
          background: "#f8fafc", fontSize: "15px", fontFamily: "'Barlow', sans-serif",
          color: value ? "#0f172a" : "#94a3b8", textAlign: "left", cursor: "pointer", boxSizing: "border-box"
        }}
      >
        {value || "Tap to pick a date"}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 5000,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)", padding: "12px",
          width: "280px", marginTop: "6px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <button type="button" onClick={prevMonth}
              style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#475569", padding: "4px 8px" }}>◀</button>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth}
              style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#475569", padding: "4px 8px" }}>▶</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 700, color: "#94a3b8", padding: "4px 0" }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {blanks.map((_, i) => <div key={`b-${i}`} />)}
            {days.map(day => {
              const selected = selMatch(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  style={{
                    height: "34px", border: selected ? "none" : "1px solid transparent",
                    borderRadius: "8px", fontSize: "13px", fontWeight: selected ? 700 : 500,
                    cursor: "pointer",
                    background: selected ? "#2563eb" : "#f8fafc",
                    color: selected ? "#fff" : "#334155",
                  }}
                  onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "#dbeafe"; }}
                  onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "#f8fafc"; }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button type="button" onClick={() => setOpen(false)}
              style={{ border: "none", background: "#f1f5f9", borderRadius: "6px", padding: "6px 16px", fontSize: "12px", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ✨ Derive outcome from score + team
function deriveOutcome(matchResult, team) {
  const parts = (matchResult || "").split("-").map(s => parseInt(s.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return "";
  const [a, b] = parts;
  if (team === "A") return a > b ? "Win" : a < b ? "Loss" : "Draw";
  return b > a ? "Win" : b < a ? "Loss" : "Draw";
}

const MAX_SUBS = 4;

function TacticalDashboard() {
  const GITHUB_OWNER = "ryanhui0410";
  const GITHUB_REPO = "football";
  const IMAGES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/football-app/public/images`;

  const [history, setHistory] = useState({ contributors: [], locations: [], times: [], sources: [] });
  const [allLineups, setAllLineups] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [matchDetails, setMatchDetails] = useState({ Date: "", Location: "", Time: "", MatchResult: "" });
  const [lineupData, setLineupData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [slotToEdit, setSlotToEdit] = useState(null);
  const [pictureMap, setPictureMap] = useState({});
  const [playerStats, setPlayerStats] = useState({});
  const [slotStats, setSlotStats] = useState(null);

  // Player picker state
  const [addPlayerMode, setAddPlayerMode] = useState("name"); // "name" | "photo"
  const [playerSearchText, setPlayerSearchText] = useState("");
  const [playerFilterGroup, setPlayerFilterGroup] = useState("All");

  // Season tracking
  const [seasonInfo, setSeasonInfo] = useState(null);

  const getPicture = (name) =>
    name ? pictureMap[name.trim().toLowerCase()] || null : null;

  const getPartner = (name) => {
    const n = (name || "").trim().toLowerCase();
    if (n === "ryan") return "Darren";
    if (n === "darren") return "Ryan";
    return null;
  };

  // ── Season helper (mirrors backend logic) ──
  const getSeasonKey = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const month = parseInt(parts[0]);
    const year = parseInt(parts[2]);
    if (isNaN(month) || isNaN(year)) return null;
    const startYear = month >= 8 ? year : year - 1;
    if (startYear <= 2026) return "2025_2026";
    return `${startYear}_${startYear + 1}`;
  };

  const getSeasonLabel = (dateStr) => {
    const key = getSeasonKey(dateStr);
    return key ? key.replace("_", "-") : "";
  };

  const getLayoutType = () => {
    const isPortrait = window.innerHeight > window.innerWidth;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (isPortrait && w <= 850) return "vertical";
    if (!isPortrait && w <= 1024 && h <= 500) return "landscape";
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

  useEffect(() => {
    Promise.all([
      fetch(`https://football-stats-xbx6.onrender.com/stats-history?t=${Date.now()}`).then(res => res.json()),
      fetch(`https://football-stats-xbx6.onrender.com/match-lineups?t=${Date.now()}`).then(res => res.json()),
      fetch(`https://football-stats-xbx6.onrender.com/player-attributes?t=${Date.now()}`).then(res => res.json()),
      fetch(`${IMAGES_API_URL}?t=${Date.now()}`).then(res => res.ok ? res.json() : []),
    ])
      .then(([historyData, lineups, players, imageFiles]) => {
        setHistory({
          contributors: historyData.contributors || [],
          locations: historyData.locations || [],
          times: historyData.times || [],
          sources: historyData.sources || [],
        });
        setAllLineups(Array.isArray(lineups) ? lineups : []);
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
      .catch(err => console.error("Failed to fetch initial data", err));
  }, []);

  // ── Update season info when date changes ──
  useEffect(() => {
    const key = getSeasonKey(matchDetails.Date);
    if (key) {
      const startYear = parseInt(key.split("_")[0]);
      const endYear = parseInt(key.split("_")[1]);
      const isNewSeason = startYear >= 2027;
      setSeasonInfo({
        key,
        label: key.replace("_", "-"),
        isNewSeason,
        statsFile: isNewSeason ? `football_stats_${key}.json` : "football_stats_2025_2026.json",
        lineupsFile: isNewSeason ? `match_lineups_${key}.json` : "match_lineups.json",
      });
    } else {
      setSeasonInfo(null);
    }
  }, [matchDetails.Date]);

  // ═══════════════════════════════════════════════════
  // Dynamically extract filter groups from players
  // ═══════════════════════════════════════════════════
  const filterGroups = useMemo(() => {
    const groups = new Set();
    availablePlayers.forEach(p => {
      const g = (p.filterGroup || "").trim();
      if (g) groups.add(g);
    });
    const preferredOrder = ["The Bros", "Barry", "馬哲", "梁哥"];
    const sorted = [...groups];
    sorted.sort((a, b) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [availablePlayers]);

  // Filtered players for picker
  const filteredAvailablePlayers = useMemo(() => {
    let list = [...availablePlayers];

    if (playerFilterGroup !== "All") {
      list = list.filter(p => (p.filterGroup || "").trim() === playerFilterGroup);
    }

    if (playerSearchText.trim()) {
      const search = playerSearchText.trim().toLowerCase();
      list = list.filter(p => (p.Contributor || "").toLowerCase().includes(search));
    }

    list.sort((a, b) => {
      const rank = (n) => {
        const l = (n || "").toLowerCase();
        if (l === "ryan") return 0;
        if (l === "darren") return 1;
        return 2;
      };
      const ra = rank(a.Contributor), rb = rank(b.Contributor);
      if (ra !== rb) return ra - rb;
      return (a.Contributor || "").localeCompare(b.Contributor || "");
    });

    return list;
  }, [availablePlayers, playerFilterGroup, playerSearchText]);

  useEffect(() => {
    if (!matchDetails.Date) {
      setLineupData(null);
      return;
    }

    const existing = allLineups.find(l =>
      l.date === matchDetails.Date &&
      l.location === matchDetails.Location &&
      l.time === matchDetails.Time
    );

    setLineupData(prev => {
      if (
        prev &&
        prev.date === matchDetails.Date &&
        prev.location === matchDetails.Location &&
        prev.time === matchDetails.Time
      ) {
        return prev;
      }
      return existing || {
        date: matchDetails.Date,
        location: matchDetails.Location,
        time: matchDetails.Time,
        teamA: { formation: "4-4-2", players: Array(11).fill(null), subs: Array(MAX_SUBS).fill(null) },
        teamB: { formation: "4-4-2", players: Array(11).fill(null), subs: Array(MAX_SUBS).fill(null) }
      };
    });
  }, [matchDetails.Date, matchDetails.Location, matchDetails.Time, allLineups]);

  const handleChange = (e) => {
    setMatchDetails({ ...matchDetails, [e.target.name]: e.target.value });
  };

  // Shared player selection handler
  const handleSelectPlayer = (selected) => {
    if (!selected) {
      setSlotToEdit(prev => ({ ...prev, player: null }));
      if (slotToEdit?.player?.Contributor) {
        setPlayerStats(prev => {
          const next = { ...prev };
          delete next[slotToEdit.player.Contributor];
          return next;
        });
      }
      setSlotStats(null);
    } else {
      setSlotToEdit(prev => ({
        ...prev,
        player: {
          Contributor: selected.Contributor,
          picture: getPicture(selected.Contributor) || `/${selected.Contributor}.jpeg`,
          rating: prev.player?.rating !== undefined ? prev.player.rating : ""
        }
      }));
      setSlotStats(playerStats[selected.Contributor] || {
        Goal: 0, Assist: 0, LeftFoot: 0, RightFoot: 0, Head: 0, OtherBodyParts: 0, Error: 0, ManOfTheMatch: false, AssistTo: 0, OwnGoal: 0
      });
    }
  };

  const handleSaveLineup = async () => {
    if (!matchDetails.Date || !matchDetails.Location || !matchDetails.Time) {
      setMessage("⚠️ Please fill in Date, Location, and Time before saving.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSaving(true);

    const sanitizeTeam = (teamObj) => {
      if (!teamObj) return { formation: "4-4-2", players: Array(11).fill(null), subs: Array(MAX_SUBS).fill(null) };

      const cleanPlayer = (p) => {
        if (!p) return null;
        const s = playerStats[p.Contributor] || {};
        const partner = getPartner(p.Contributor);
        const assistToCount = partner ? (parseInt(s.AssistTo) || 0) : 0;
        return {
          Contributor: p.Contributor,
          rating: parseFloat(p.rating) || 0,
          goal: s.Goal ?? 0,
          assist: s.Assist ?? 0,
          leftFoot: s.LeftFoot ?? 0,
          rightFoot: s.RightFoot ?? 0,
          head: s.Head ?? 0,
          other: s.OtherBodyParts ?? 0,
          ownGoal: s.OwnGoal ?? 0,
          error: s.Error ?? 0,
          manOfTheMatch: !!s.ManOfTheMatch,
          assistTo: partner && assistToCount > 0 ? partner : "",
          assistToCount,
        };
      };

      const cleanPlayers = (teamObj.players || []).map(cleanPlayer);
      const cleanSubs = (teamObj.subs || []).map(cleanPlayer);

      return {
        formation: teamObj.formation || "4-4-2",
        players: cleanPlayers.slice(0, 11),
        subs: cleanSubs.slice(0, MAX_SUBS)
      };
    };

    const payload = {
      date: matchDetails.Date,
      location: matchDetails.Location,
      time: matchDetails.Time,
      matchResult: matchDetails.MatchResult ?? "",
      teamA: sanitizeTeam(lineupData.teamA),
      teamB: sanitizeTeam(lineupData.teamB),
    };

    try {
      // ── STEP 1: Save lineup (backend routes to correct season file) ──
      const res = await fetch(`https://football-stats-xbx6.onrender.com/match-lineups?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        setMessage(`⚠️ Saved locally, but GitHub failed: ${result.githubError || result.error}`);
        setTimeout(() => setMessage(""), 6000);
        return;
      }

      const seasonLabel = result.season || getSeasonLabel(matchDetails.Date);
      setMessage(`✅ Lineup saved to season ${seasonLabel}! Syncing player stats...`);

      // ── STEP 2: Sync player stats (backend routes to correct season file) ──
      const statRecords = [];
      ["teamA", "teamB"].forEach(teamKey => {
        const team = lineupData[teamKey];
        const teamLetter = teamKey === "teamA" ? "A" : "B";
        const teamOutcome = deriveOutcome(matchDetails.MatchResult, teamLetter);
        [...(team?.players || []), ...(team?.subs || [])].forEach(p => {
          if (!p?.Contributor) return;
          const s = playerStats[p.Contributor] || {};
          statRecords.push({
            Date: matchDetails.Date,
            Contributor: p.Contributor,
            Rating: p.rating ?? 0,
            Location: matchDetails.Location,
            Time: matchDetails.Time,
            MatchResult: matchDetails.MatchResult ?? "",
            WinLoss: teamOutcome,
            Goal: s.Goal ?? 0,
            Assist: s.Assist ?? 0,
            LeftFoot: s.LeftFoot ?? 0,
            RightFoot: s.RightFoot ?? 0,
            Head: s.Head ?? 0,
            OtherBodyParts: s.OtherBodyParts ?? 0,
            OwnGoal: s.OwnGoal ?? 0,
            Error: s.Error ?? 0,
            ManOfTheMatch: !!s.ManOfTheMatch,
            AssistTo: getPartner(p.Contributor) && s.Assist > 0 ? (parseInt(s.AssistTo) || 0) : 0,
            source: "Tactical Dashboard",
          });
        });
      });

      try {
        const statsRes = await fetch("https://football-stats-xbx6.onrender.com/add-stats-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stats: statRecords }),
        });
        if (!statsRes.ok) {
          const err = await statsRes.json();
          setMessage(`⚠️ Lineup saved, but stats failed: ${err.message || "unknown"}`);
          setTimeout(() => setMessage(""), 6000);
          return;
        }

        const statsResult = await statsRes.json();
        const seasonDetails = (statsResult.seasons || []).map(s => `${s.season}: ${s.count} records`).join(", ");
        setMessage(`✅ Lineup + stats saved! [${seasonDetails}]`);
        setPlayerStats({});
      } catch (err) {
        setMessage(`⚠️ Lineup saved, but stats network error: ${err.message}`);
        setTimeout(() => setMessage(""), 6000);
      }
    } catch (err) {
      setMessage(`❌ Network error: ${err.message}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSlot = () => {
    const { team, idx, player } = slotToEdit;

    let targetTeam = team;
    let targetIdx = idx;
    let forcedMove = false;

    if (player && player.Contributor?.trim().toLowerCase() === 'ryan' && team === 'B') {
      targetTeam = 'A';
      forcedMove = true;
      if (typeof idx === 'string' && idx.startsWith('sub')) {
        const teamASubs = lineupData.teamA?.subs || Array(MAX_SUBS).fill(null);
        const emptyIdx = teamASubs.findIndex(p => p === null);
        targetIdx = emptyIdx !== -1 ? `sub${emptyIdx}` : idx;
      } else {
        const teamAPlayers = lineupData.teamA?.players || Array(11).fill(null);
        const emptyIdx = teamAPlayers.findIndex(p => p === null);
        targetIdx = emptyIdx !== -1 ? emptyIdx : idx;
      }
    }

    const teamKey = targetTeam === 'A' ? 'teamA' : 'teamB';

    setLineupData(prev => {
      const newLineup = JSON.parse(JSON.stringify(prev));

      if (typeof targetIdx === 'string' && targetIdx.startsWith('sub')) {
        const subIdx = parseInt(targetIdx.replace('sub', ''));
        if (!Array.isArray(newLineup[teamKey].subs) || newLineup[teamKey].subs.length < MAX_SUBS) {
          const old = Array.isArray(newLineup[teamKey].subs) ? newLineup[teamKey].subs : [];
          newLineup[teamKey].subs = [...old, ...Array(MAX_SUBS - old.length).fill(null)].slice(0, MAX_SUBS);
        }
        newLineup[teamKey].subs[subIdx] = player;
      }
      else {
        if (!Array.isArray(newLineup[teamKey].players)) newLineup[teamKey].players = Array(11).fill(null);
        newLineup[teamKey].players[targetIdx] = player;
      }
      return newLineup;
    });

    if (forcedMove) {
      setMessage("💡 Ryan is always on Team A. Moved automatically!");
      setTimeout(() => setMessage(""), 3000);
    }

    if (player && slotStats) {
      setPlayerStats(prev => ({
        ...prev,
        [player.Contributor]: slotStats,
      }));
    }

    setSlotToEdit(null);
    setAddPlayerMode("name");
    setPlayerSearchText("");
    setPlayerFilterGroup("All");
  };

  const renderDetailsCard = () => (
    <div className="td-details-card">
      <h3>Match Details</h3>
      <div className="td-inputs">
        <CalendarPicker
          value={matchDetails.Date}
          onChange={(val) => setMatchDetails(d => ({ ...d, Date: val }))}
        />
        <div className="td-field">
          <label>📍 Location</label>
          <input type="text" name="Location" value={matchDetails.Location} onChange={handleChange}
            placeholder="e.g. 傑志" list="location-history-list" />
          <datalist id="location-history-list">
            {(history.locations || []).map((loc, idx) => <option key={idx} value={loc} />)}
          </datalist>
        </div>
        <div className="td-field">
          <label>🕒 Time</label>
          <input type="text" name="Time" value={matchDetails.Time} onChange={handleChange} placeholder="e.g. 10:30 AM" list="time-history-list" />
          <datalist id="time-history-list">
            {(history.times || []).map((time, idx) => <option key={idx} value={time} />)}
          </datalist>
        </div>
        <ScorelineInput
          value={matchDetails.MatchResult}
          onChange={(val) => setMatchDetails(d => ({ ...d, MatchResult: val }))}
        />
      </div>

      {/* ── Season Info Banner ── */}
      {seasonInfo && (
        <div style={{
          marginTop: "12px",
          padding: "10px 14px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: seasonInfo.isNewSeason ? "#fef3c7" : "#eff6ff",
          border: `1px solid ${seasonInfo.isNewSeason ? "#f59e0b" : "#3b82f6"}`,
          color: seasonInfo.isNewSeason ? "#92400e" : "#1e40af",
        }}>
          <span>{seasonInfo.isNewSeason ? "🆕" : "📂"}</span>
          <span>
            Season <strong>{seasonInfo.label}</strong>
            {seasonInfo.isNewSeason
              ? " — New season files will be created automatically"
              : " — Using existing 2025-2026 files"}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "11px", opacity: 0.7 }}>
            {seasonInfo.statsFile} | {seasonInfo.lineupsFile}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="td-wrap">
      <h2 className="td-title">⚔️ Tactical Dashboard</h2>

      {message && <div className={`td-toast ${message.includes("✅") ? 'success' : 'warning'}`}>{message}</div>}

      <div className="td-pitch-container">
        {renderDetailsCard()}

        {lineupData && matchDetails.Date.trim() ? (
          <>
            <div className="td-remark">
              💡 <strong>Tactical Rule:</strong> Ryan is always assigned to <strong>Team A (Left Side)</strong>.
            </div>

            <MatchLineup
              matchData={matchDetails}
              initialLineup={lineupData}
              layout={layout}
              editMode={true}
              availablePlayers={availablePlayers}
              pictureMap={pictureMap}
              onLineupChange={(newLineup) => {
                setLineupData(prev => ({ ...prev, ...newLineup }));
              }}
              onSlotClick={(team, idx, player) => {
                setSlotToEdit({ team, idx, player });
                setAddPlayerMode("name");
                setPlayerSearchText("");
                setPlayerFilterGroup("All");
                if (player) {
                  setSlotStats(playerStats[player.Contributor] || {
                    Goal: 0, Assist: 0, LeftFoot: 0, RightFoot: 0, Head: 0, OtherBodyParts: 0, Error: 0, ManOfTheMatch: false, AssistTo: 0, OwnGoal: 0
                  });
                } else {
                  setSlotStats(null);
                }
              }}
            />

            <div className="td-actions">
              <button className="td-save-btn" onClick={handleSaveLineup} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Tactical Lineup"}
              </button>
            </div>
          </>
        ) : (
          <div className="td-placeholder">
            <p>⚽ Please enter a <strong>Match Date</strong> to load the tactical pitch.</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          SLOT EDIT MODAL — with dual-mode player picker
          ═══════════════════════════════════════════════════ */}
      {slotToEdit && (
        <div className="td-slot-overlay" onClick={() => setSlotToEdit(null)}>
          <div className="td-slot-modal" onClick={e => e.stopPropagation()}>

            {/* ── Header ── */}
            <div className="td-slot-header">
              <h3>{slotToEdit.player ? "Edit Player" : "Add Player"}</h3>
              <button className="td-slot-close" onClick={() => {
                setSlotToEdit(null);
                setAddPlayerMode("name");
                setPlayerSearchText("");
                setPlayerFilterGroup("All");
              }}>✕</button>
            </div>

            {/* ── Mode Toggle Tabs ── */}
            <div className="td-picker-tabs">
              <button
                className={`td-picker-tab ${addPlayerMode === 'name' ? 'active' : ''}`}
                onClick={() => setAddPlayerMode('name')}
              >
                📋 By Name
              </button>
              <button
                className={`td-picker-tab ${addPlayerMode === 'photo' ? 'active' : ''}`}
                onClick={() => setAddPlayerMode('photo')}
              >
                🖼️ By Photo
              </button>
            </div>

            {/* ── Filter Pills: Dynamic from filterGroup field ── */}
            <div className="td-picker-filters">
              <button
                className={`td-filter-pill ${playerFilterGroup === 'All' ? 'active' : ''}`}
                onClick={() => setPlayerFilterGroup('All')}
              >
                All
              </button>
              {filterGroups.map(group => (
                <button
                  key={group}
                  className={`td-filter-pill ${playerFilterGroup === group ? 'active' : ''}`}
                  onClick={() => setPlayerFilterGroup(group)}
                >
                  {group}
                </button>
              ))}
            </div>

            {/* ── Search Input ── */}
            <div className="td-picker-search">
              <input
                type="text"
                placeholder="🔍 Search player name..."
                value={playerSearchText}
                onChange={(e) => setPlayerSearchText(e.target.value)}
              />
              {playerSearchText && (
                <button className="td-search-clear" onClick={() => setPlayerSearchText("")}>✕</button>
              )}
            </div>

            {/* ── Player Picker Body ── */}
            {addPlayerMode === 'name' ? (
              /* ══ NAME MODE: Dropdown ══ */
              <div className="td-modal-field">
                <label>Select Player:</label>
                <select
                  value={slotToEdit.player?.Contributor || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      handleSelectPlayer(null);
                    } else {
                      const selected = filteredAvailablePlayers.find(p => p.Contributor === val)
                        || availablePlayers.find(p => p.Contributor === val);
                      if (selected) handleSelectPlayer(selected);
                    }
                  }}
                >
                  <option value="">-- Empty Slot --</option>
                  {filteredAvailablePlayers.map(p => (
                    <option key={p.Contributor} value={p.Contributor}>
                      {p.Contributor}{p.filterGroup ? ` (${p.filterGroup})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* ══ PHOTO MODE: 3-column grid ══ */
              <div className="td-photo-picker">
                {slotToEdit.player && (
                  <button
                    className="td-photo-clear-btn"
                    onClick={() => handleSelectPlayer(null)}
                  >
                    ✕ Clear Selection ({slotToEdit.player.Contributor})
                  </button>
                )}

                <div className="td-photo-grid">
                  {filteredAvailablePlayers.map(p => {
                    const imgUrl = getPicture(p.Contributor);
                    const isSelected = slotToEdit.player?.Contributor === p.Contributor;
                    return (
                      <div
                        key={p.Contributor}
                        className={`td-photo-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectPlayer(p)}
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt={p.Contributor} className="td-photo-avatar" />
                        ) : (
                          <div className="td-photo-avatar td-photo-fallback">
                            {(p.Contributor || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="td-photo-name">{p.Contributor}</span>
                        {isSelected && <span className="td-photo-check">✓</span>}
                      </div>
                    );
                  })}

                  {filteredAvailablePlayers.length === 0 && (
                    <div className="td-photo-empty-msg">
                      No players match your filter.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Profile Picture ── */}
            {slotToEdit.player && (
              <div className="td-modal-field">
                <label>Profile Picture</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {getPicture(slotToEdit.player.Contributor) ? (
                    <img
                      src={getPicture(slotToEdit.player.Contributor)}
                      alt="Current"
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }}
                    />
                  ) : (
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', fontWeight: 700, color: '#64748b', border: '2px solid #cbd5e1'
                    }}>
                      {(slotToEdit.player.Contributor || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Managed in Match Report editor
                  </span>
                </div>
              </div>
            )}

            {/* ── Match Rating ── */}
            {slotToEdit.player && (
              <div className="td-modal-field">
                <label>Match Rating (0-10.0):</label>
                <input
                  type="number" min="0" max="10" step="0.1"
                  value={slotToEdit.player.rating !== "" && slotToEdit.player.rating !== undefined ? slotToEdit.player.rating : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSlotToEdit(prev => ({
                      ...prev,
                      player: {
                        ...prev.player,
                        rating: val === "" ? "" : parseFloat(val)
                      }
                    }));
                  }}
                />
              </div>
            )}

            {/* ── Match Stats ── */}
            {slotToEdit.player && slotStats && (
              <div style={{ borderTop: "2px solid #e2e8f0", marginTop: "16px", paddingTop: "12px" }}>
                <h4 style={{ margin: "0 0 8px", fontFamily: "'Oswald', sans-serif", color: "#1e3a8a", textTransform: "uppercase", fontSize: "13px", letterSpacing: "0.1em" }}>
                  ⚽ Match Stats
                </h4>

                <StatStepper label="Goal" value={slotStats.Goal} onChange={(v) => setSlotStats(s => ({ ...s, Goal: v }))} />
                <StatStepper label="Assist" value={slotStats.Assist} onChange={(v) => setSlotStats(s => ({ ...s, Assist: v }))} />

                {getPartner(slotToEdit.player.Contributor) && slotStats.Assist > 0 && (
                  <StatStepper
                    label={`No. of assist to ${getPartner(slotToEdit.player.Contributor)}`}
                    value={slotStats.AssistTo ?? 0}
                    max={slotStats.Assist}
                    onChange={(v) => setSlotStats(s => ({ ...s, AssistTo: v }))}
                  />
                )}

                <StatStepper label="Left Foot" value={slotStats.LeftFoot} onChange={(v) => setSlotStats(s => ({ ...s, LeftFoot: v }))} />
                <StatStepper label="Right Foot" value={slotStats.RightFoot} onChange={(v) => setSlotStats(s => ({ ...s, RightFoot: v }))} />
                <StatStepper label="Head" value={slotStats.Head} onChange={(v) => setSlotStats(s => ({ ...s, Head: v }))} />
                <StatStepper label="Other Body Parts" value={slotStats.OtherBodyParts} onChange={(v) => setSlotStats(s => ({ ...s, OtherBodyParts: v }))} />
                <StatStepper label="Own Goal" value={slotStats.OwnGoal} onChange={(v) => setSlotStats(s => ({ ...s, OwnGoal: v }))} />
                <StatStepper label="Error" value={slotStats.Error} onChange={(v) => setSlotStats(s => ({ ...s, Error: v }))} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Man of the Match</span>
                  <button type="button"
                    onClick={() => setSlotStats(s => ({ ...s, ManOfTheMatch: !s.ManOfTheMatch }))}
                    style={{
                      padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                      fontWeight: 700, fontFamily: "'Oswald', sans-serif", fontSize: "13px",
                      background: slotStats.ManOfTheMatch ? "#facc15" : "#e2e8f0",
                      color: slotStats.ManOfTheMatch ? "#000" : "#64748b"
                    }}>
                    🏆 {slotStats.ManOfTheMatch ? "MOTM" : "No"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="td-modal-actions">
              <button className="td-modal-cancel" onClick={() => {
                setSlotToEdit(null);
                setAddPlayerMode("name");
                setPlayerSearchText("");
                setPlayerFilterGroup("All");
              }}>Cancel</button>
              <button className="td-modal-save" onClick={handleSaveSlot}>
                Save to Pitch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TacticalDashboard;