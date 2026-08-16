import React, { useState, useEffect } from "react";
import MatchLineup from "../EditStats/MatchLineup"; 
import "./TacticalDashboard.css";

function TacticalDashboard() {
  const [matchDetails, setMatchDetails] = useState({ Date: "", Location: "", Time: "" });
  
  // History & Data States
  const [timeHistory, setTimeHistory] = useState([]);
  const [allLineups, setAllLineups] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  
  // Lineup Editing States
  const [lineupData, setLineupData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [slotToEdit, setSlotToEdit] = useState(null);

  // 1. Fetch initial data on mount
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/stats-history").then(res => res.json()),
      fetch("http://localhost:5000/match-lineups").then(res => res.json()),
      fetch("http://localhost:5000/player-attributes").then(res => res.json())
    ])
      .then(([history, lineups, players]) => {
        setTimeHistory(history.times || []);
        setAllLineups(Array.isArray(lineups) ? lineups : []);
        setAvailablePlayers(Array.isArray(players) ? players : []);
      })
      .catch(err => console.error("Failed to fetch initial data", err));
  }, []);

  // 2. Auto-load lineup if Date/Location/Time matches an existing record
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
        // Initialize empty 11-slot array format
        setLineupData({
          date: matchDetails.Date,
          location: matchDetails.Location,
          time: matchDetails.Time,
          teamA: { formation: "4-4-2", players: Array(11).fill(null) },
          teamB: { formation: "4-4-2", players: Array(11).fill(null) }
        });
      }
    } else if (matchDetails.Date) {
      // If only date is typed, show empty pitch
      setLineupData({
        date: matchDetails.Date,
        location: matchDetails.Location,
        time: matchDetails.Time,
        teamA: { formation: "4-4-2", players: Array(11).fill(null) },
        teamB: { formation: "4-4-2", players: Array(11).fill(null) }
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

    // ✨ SANITIZE PAYLOAD: Strip EA stats, handle empty slots, ensure 11 items
    const sanitizeTeam = (teamObj) => {
      if (!teamObj) return { formation: "4-4-2", players: Array(11).fill(null) };
      
      const cleanPlayers = (teamObj.players || []).map(p => {
        if (!p) return null; // Keep empty slots as null safely
        return {
          Contributor: p.Contributor,
          rating: parseFloat(p.rating) || 0,
          picture: p.picture || `/${p.Contributor}.jpeg`
        };
      });
      
      // Ensure exactly 11 slots to prevent UI breaking later
      while (cleanPlayers.length < 11) cleanPlayers.push(null);
      
      return {
        formation: teamObj.formation || "4-4-2",
        players: cleanPlayers.slice(0, 11)
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
      const res = await fetch("http://localhost:5000/match-lineups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.isNew) {
        setAllLineups(prev => [...prev, payload]);
      } else {
        setAllLineups(prev => prev.map(l => 
          l.date === payload.date && l.location === payload.location && l.time === payload.time ? payload : l
        ));
      }
      setMessage("✅ Tactical Lineup saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to save. Check server.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="td-wrap">
      <h2 className="td-title">⚔️ Tactical Dashboard</h2>
      
      {message && <div className={`td-toast ${message.includes("✅") ? 'success' : 'warning'}`}>{message}</div>}

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

      {lineupData && matchDetails.Date.trim() ? (
        <>
          <div className="td-pitch-container">
            <MatchLineup 
              matchData={matchDetails} 
              initialLineup={lineupData}
              layout="horizontal" 
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
        <div className="td-placeholder">
          <p>⚽ Please enter a <strong>Match Date</strong> to load the tactical pitch.</p>
        </div>
      )}

      {/* SLOT EDIT MODAL */}
      {slotToEdit && (
        <div className="td-slot-overlay" onClick={() => setSlotToEdit(null)}>
          <div className="td-slot-modal" onClick={e => e.stopPropagation()}>
            <button className="td-slot-close" onClick={() => setSlotToEdit(null)}>✕</button>
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
                        // Keep existing rating if editing, otherwise start empty
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
              <button className="td-modal-save" onClick={() => {
                const { team, idx, player } = slotToEdit;
                const teamKey = team === 'A' ? 'teamA' : 'teamB';
                setLineupData(prev => {
                  const newLineup = JSON.parse(JSON.stringify(prev));
                  if (!Array.isArray(newLineup[teamKey].players)) {
                    newLineup[teamKey].players = Array(11).fill(null);
                  }
                  newLineup[teamKey].players[idx] = player;
                  return newLineup;
                });
                setSlotToEdit(null);
              }}>
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