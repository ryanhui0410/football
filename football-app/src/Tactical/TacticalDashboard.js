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

function TacticalDashboard() {
  const [matchDetails, setMatchDetails] = useState({ Date: "", Location: "", Time: "" });
  const GITHUB_OWNER = "ryanhui0410";
  const GITHUB_REPO = "football";
  const IMAGES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/football-app/public/images`;

  const [history, setHistory] = useState({ contributors: [], locations: [], times: [], sources: [] });
  const [allLineups, setAllLineups] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);

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

        // Build: lowercase player name → raw GitHub URL
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
      // ✅ Already showing this exact match? Keep the current object (no reset)
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
    return {
      Contributor: p.Contributor,
      rating: parseFloat(p.rating) || 0,
      picture: getPicture(p.Contributor) || p.picture || `/${p.Contributor}.jpeg`,
      // ✅ Persist match stats into match_lineups.json
      goal: s.Goal ?? 0,
      assist: s.Assist ?? 0,
      leftFoot: s.LeftFoot ?? 0,
      rightFoot: s.RightFoot ?? 0,
      head: s.Head ?? 0,
      other: s.OtherBodyParts ?? 0,
      error: s.Error ?? 0,
      manOfTheMatch: !!s.ManOfTheMatch,
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
        [...(team?.players || []), ...(team?.subs || [])].forEach(p => {
          if (!p?.Contributor) return;
          const s = playerStats[p.Contributor] || {};
          statRecords.push({
            Date: matchDetails.Date,
            Contributor: p.Contributor,
            Rating: p.rating ?? 0,
            Location: matchDetails.Location,
            Time: matchDetails.Time,
            Goal: s.Goal ?? 0,
            Assist: s.Assist ?? 0,
            LeftFoot: s.LeftFoot ?? 0,
            RightFoot: s.RightFoot ?? 0,
            Head: s.Head ?? 0,
            OtherBodyParts: s.OtherBodyParts ?? 0,
            Error: s.Error ?? 0,
            ManOfTheMatch: !!s.ManOfTheMatch,
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

    // ✅ Persist this player's stats into the per-match map
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
        <div className="td-field">
          <label>📅 Match Date</label>
          <input type="text" name="Date" value={matchDetails.Date} onChange={handleChange} placeholder="e.g. 8/9/2026" />
        </div>
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
      </div>
    </div>
  );

  return (
    <div className="td-wrap">
      <h2 className="td-title">⚔️ Tactical Dashboard</h2>

      {message && <div className={`td-toast ${message.includes("✅") ? 'success' : 'warning'}`}>{message}</div>}

      {/* ✅ ALWAYS rendered — the details card never unmounts while typing */}
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
                  // Load any previously entered stats for this player, or blank
                  setSlotStats(playerStats[player.Contributor] || {
                    Goal: 0, Assist: 0, LeftFoot: 0, RightFoot: 0, Head: 0, OtherBodyParts: 0, Error: 0, ManOfTheMatch: false
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
                    // ✅ Clear stale stats when a player is removed
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
                    // ✅ Load existing stats for the newly selected player
                    setSlotStats(playerStats[selected.Contributor] || {
                      Goal: 0, Assist: 0, LeftFoot: 0, RightFoot: 0, Head: 0, OtherBodyParts: 0, Error: 0, ManOfTheMatch: false
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