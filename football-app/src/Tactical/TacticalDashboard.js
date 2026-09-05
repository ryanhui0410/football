import React, { useState, useEffect } from "react";
import MatchLineup from "../EditStats/MatchLineup"; 
import "./TacticalDashboard.css";

function TacticalDashboard() {
  const [matchDetails, setMatchDetails] = useState({ Date: "", Location: "", Time: "" });
  
  const [timeHistory, setTimeHistory] = useState([]);
  const [allLineups, setAllLineups] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  
  const [lineupData, setLineupData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [slotToEdit, setSlotToEdit] = useState(null);

  // ✅ Three-way layout detection:
  //   "vertical"   → portrait phone (vertical pitch)
  //   "landscape"  → landscape phone (subs on top, details left, pitch below)
  //   "horizontal" → desktop (standard horizontal pitch)
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
      fetch(`https://football-stats-xbx6.onrender.com/player-attributes?t=${Date.now()}`).then(res => res.json())
    ])
      .then(([history, lineups, players]) => {
        setTimeHistory(history.times || []);
        setAllLineups(Array.isArray(lineups) ? lineups : []);
        setAvailablePlayers(Array.isArray(players) ? players : []);
      })
      .catch(err => console.error("Failed to fetch initial data", err));
  }, []);

  useEffect(() => {
    if (matchDetails.Date && matchDetails.Location && matchDetails.Time) {
      const existing = allLineups.find(l => 
        l.date === matchDetails.Date && 
        l.location === matchDetails.Location && 
        l.time === matchDetails.Time
      );

      if (existing) {
        setLineupData(existing);
      } else {
        setLineupData({
          date: matchDetails.Date,
          location: matchDetails.Location,
          time: matchDetails.Time,
          teamA: { formation: "4-4-2", players: Array(11).fill(null), subs: [null, null] },
          teamB: { formation: "4-4-2", players: Array(11).fill(null), subs: [null, null] }
        });
      }
    } else if (matchDetails.Date) {
      setLineupData({
        date: matchDetails.Date,
        location: matchDetails.Location,
        time: matchDetails.Time,
        teamA: { formation: "4-4-2", players: Array(11).fill(null), subs: [null, null] },
        teamB: { formation: "4-4-2", players: Array(11).fill(null), subs: [null, null] }
      });
    } else {
      setLineupData(null);
    }
  }, [matchDetails, allLineups]);

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
      
      const cleanPlayers = (teamObj.players || []).map(p => {
        if (!p) return null;
        return { Contributor: p.Contributor, rating: parseFloat(p.rating) || 0, picture: p.picture || `/${p.Contributor}.jpeg` };
      });
      while (cleanPlayers.length < 11) cleanPlayers.push(null);
      
      const cleanSubs = (teamObj.subs || []).map(p => {
        if (!p) return null;
        return { Contributor: p.Contributor, rating: parseFloat(p.rating) || 0, picture: p.picture || `/${p.Contributor}.jpeg` };
      });
      while (cleanSubs.length < 2) cleanSubs.push(null);

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

      setMessage("✅ Tactical Lineup saved AND synced to GitHub!");
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
          <input type="text" name="Location" value={matchDetails.Location} onChange={handleChange} placeholder="e.g. 傑志" />
        </div>
        <div className="td-field">
          <label>🕒 Time</label>
          <input type="text" name="Time" value={matchDetails.Time} onChange={handleChange} placeholder="e.g. 10:30 AM" list="time-history-list" />
          <datalist id="time-history-list">
            {timeHistory.map((time, idx) => <option key={idx} value={time} />)}
          </datalist>
        </div>
      </div>
    </div>
  );

  return (
    <div className="td-wrap">
      <h2 className="td-title">⚔️ Tactical Dashboard</h2>
      
      {message && <div className={`td-toast ${message.includes("✅") ? 'success' : 'warning'}`}>{message}</div>}

      {lineupData && matchDetails.Date.trim() ? (
        <>
          {/* ✅ Details card now INSIDE the pitch container so the landscape
              CSS grid can place it in the left column */}
          <div className="td-pitch-container">
            {renderDetailsCard()}

            <div className="td-remark">
              💡 <strong>Tactical Rule:</strong> Ryan is always assigned to <strong>Team A (Left Side)</strong>.
            </div>

            <MatchLineup 
              matchData={matchDetails} 
              initialLineup={lineupData}
              layout={layout} 
              editMode={true}
              availablePlayers={availablePlayers}
              onLineupChange={(newLineup) => {
                setLineupData(prev => ({ ...prev, ...newLineup }));
              }}
              onSlotClick={(team, idx, player) => {
                setSlotToEdit({ team, idx, player });
              }}
            />
          </div>

          <div className="td-actions">
            <button className="td-save-btn" onClick={handleSaveLineup} disabled={saving}>
              {saving ? "Saving..." : "💾 Save Tactical Lineup"}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* No date yet → details card standalone + placeholder */}
          {renderDetailsCard()}

          <div className="td-placeholder">
            <p>⚽ Please enter a <strong>Match Date</strong> to load the tactical pitch.</p>
          </div>
        </>
      )}

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