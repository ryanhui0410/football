import React, { useState, useEffect } from "react";
import MatchLineup from "../EditStats/MatchLineup"; 
import "./TacticalDashboard.css";

// ✅ Inline stat stepper for the slot modal (same pattern as Add Stats)
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
// ✅ Us–Them scoreline stepper: {no}-{no}   ← MUST BE HERE (top level)
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
// ✅ Inline calendar picker — outputs M/D/YYYY (e.g. 8/13/2026)
function CalendarPicker({ value, onChange }) {
  const parts = (value || "").split("/").map(Number);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parts[2] && !isNaN(parts[2]) ? parts[2] : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(
    parts[0] && !isNaN(parts[0]) ? parts[0] - 1 : new Date().getMonth() // 0-based
  );

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    onChange(`${viewMonth + 1}/${day}/${viewYear}`); // M/D/YYYY, no leading zeros
    setOpen(false);
  };

  // Which day is currently selected (to highlight)
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
          {/* Month navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <button type="button" onClick={prevMonth}
              style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#475569", padding: "4px 8px" }}>◀</button>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth}
              style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#475569", padding: "4px 8px" }}>▶</button>
          </div>

          {/* Weekday header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 700, color: "#94a3b8", padding: "4px 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
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

          {/* Close row */}
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

// ✨ Derive outcome from score + team (Team A = first number, Team B = second)
function deriveOutcome(matchResult, team) {
  const parts = (matchResult || "").split("-").map(s => parseInt(s.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return "";
  const [a, b] = parts;
  if (team === "A") return a > b ? "Win" : a < b ? "Loss" : "Draw";
  return b > a ? "Win" : b < a ? "Loss" : "Draw";
}

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
  // ✅ Per-player match stats, keyed by Contributor name
  const [playerStats, setPlayerStats] = useState({});
  // Working copy while the slot modal is open
  const [slotStats, setSlotStats] = useState(null);

  // Helper: GitHub raw URL for a player, or null if not uploaded yet
  const getPicture = (name) =>
    name ? pictureMap[name.trim().toLowerCase()] || null : null;

  // ✨ Ryan↔Darren partner helper
  const getPartner = (name) => {
    const n = (name || "").trim().toLowerCase();
    if (n === "ryan") return "Darren";
    if (n === "darren") return "Ryan";
    return null;
  };

  // ✅ Three-way layout detection
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
        teamA: { formation: "4-4-2", players: Array(11).fill(null), subs: [null, null] },
        teamB: { formation: "4-4-2", players: Array(11).fill(null), subs: [null, null] }
      };
    });
  }, [matchDetails.Date, matchDetails.Location, matchDetails.Time, allLineups]);

  const handleChange = (e) => {
    setMatchDetails({ ...matchDetails, [e.target.name]: e.target.value });
  };

  const handleSaveLineup = async () => {
    if (!matchDetails.Date || !matchDetails.Location || !matchDetails.Time) {
      setMessage("⚠️ Please fill in Date, Location, and Time before saving.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSaving(true);

    const sanitizeTeam = (teamObj) => {
      if (!teamObj) return { formation: "4-4-2", players: Array(11).fill(null), subs: [null, null] };

      const cleanPlayer = (p) => {
        if (!p) return null;
        const s = playerStats[p.Contributor] || {};
        const partner = getPartner(p.Contributor);
        const assistToCount = partner ? (parseInt(s.AssistTo) || 0) : 0;
        return {
          Contributor: p.Contributor,
          rating: parseFloat(p.rating) || 0,
          picture: getPicture(p.Contributor) || p.picture || `/${p.Contributor}.jpeg`,
          // ✅ Persist match stats into match_lineups.json (all players)
          goal: s.Goal ?? 0,
          assist: s.Assist ?? 0,
          leftFoot: s.LeftFoot ?? 0,
          rightFoot: s.RightFoot ?? 0,
          head: s.Head ?? 0,
          other: s.OtherBodyParts ?? 0,
          error: s.Error ?? 0,
          manOfTheMatch: !!s.ManOfTheMatch,
          // ✅ Ryan↔Darren assist-to detail
          assistTo: partner && assistToCount > 0 ? partner : "",
          assistToCount,
        };
      };

      const cleanPlayers = (teamObj.players || []).map(cleanPlayer);
      const cleanSubs = (teamObj.subs || []).map(cleanPlayer);

      return {
        formation: teamObj.formation || "4-4-2",
        players: cleanPlayers.slice(0, 11),
        subs: cleanSubs.slice(0, 2)
      };
    };

    const payload = {
      date: matchDetails.Date,
      location: matchDetails.Location,
      time: matchDetails.Time,
      teamA: sanitizeTeam(lineupData.teamA),
      teamB: sanitizeTeam(lineupData.teamB),
    };

    try {
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

      setMessage("✅ Tactical Lineup saved! Syncing player stats...");

      // ── Build one stats payload per placed player ──
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
            Error: s.Error ?? 0,
            ManOfTheMatch: !!s.ManOfTheMatch,
            // ✅ Ryan↔Darren assist-to count (formatStat pairs it automatically)
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
        setMessage("✅ Lineup + player stats saved AND synced to GitHub!");
        setPlayerStats({}); // fresh slate for the next match
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
        const teamASubs = lineupData.teamA?.subs || [null, null];
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
        if (!Array.isArray(newLineup[teamKey].subs)) newLineup[teamKey].subs = [null, null];
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
  };

  // ✅ Reusable details card (rendered standalone OR inside the grid)
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
                if (player) {
                  setSlotStats(playerStats[player.Contributor] || {
                    Goal: 0, Assist: 0, LeftFoot: 0, RightFoot: 0, Head: 0, OtherBodyParts: 0, Error: 0, ManOfTheMatch: false, AssistTo: 0
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

      {/* SLOT EDIT MODAL */}
      {slotToEdit && (
        <div className="td-slot-overlay" onClick={() => setSlotToEdit(null)}>
          <div className="td-slot-modal" onClick={e => e.stopPropagation()}>
            <h3>{slotToEdit.player ? "Edit Player" : "Add Player"}</h3>

            <div className="td-modal-field">
              <label>Select Player:</label>
              <select 
                value={slotToEdit.player?.Contributor || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSlotToEdit(prev => ({ ...prev, player: null }));
                    if (slotToEdit.player?.Contributor) {
                      setPlayerStats(prev => {
                        const next = { ...prev };
                        delete next[slotToEdit.player.Contributor];
                        return next;
                      });
                    }
                    setSlotStats(null);
                  } else {
                    const selected = availablePlayers.find(p => p.Contributor === val);
                    setSlotToEdit(prev => ({
                      ...prev,
                      player: {
                        Contributor: selected.Contributor,
                        picture: getPicture(selected.Contributor) || `/${selected.Contributor}.jpeg`,
                        rating: prev.player?.rating !== undefined ? prev.player.rating : ""
                      }
                    }));
                    setSlotStats(playerStats[selected.Contributor] || {
                      Goal: 0, Assist: 0, LeftFoot: 0, RightFoot: 0, Head: 0, OtherBodyParts: 0, Error: 0, ManOfTheMatch: false, AssistTo: 0
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

            {/* ✅ MATCH STATS — entered right here in the Tactical Dashboard */}
            {slotToEdit.player && slotStats && (
              <div style={{ borderTop: "2px solid #e2e8f0", marginTop: "16px", paddingTop: "12px" }}>
                <h4 style={{ margin: "0 0 8px", fontFamily: "'Oswald', sans-serif", color: "#1e3a8a", textTransform: "uppercase", fontSize: "13px", letterSpacing: "0.1em" }}>
                  ⚽ Match Stats
                </h4>

                <StatStepper label="Goal" value={slotStats.Goal} onChange={(v) => setSlotStats(s => ({ ...s, Goal: v }))} />
                <StatStepper label="Assist" value={slotStats.Assist} onChange={(v) => setSlotStats(s => ({ ...s, Assist: v }))} />

                {/* ✅ Ryan↔Darren assist-to detail — how many assists went to the partner */}
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
            
            <div className="td-modal-actions">
              <button className="td-modal-cancel" onClick={() => setSlotToEdit(null)}>Cancel</button>
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