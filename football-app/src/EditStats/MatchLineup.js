import React, { useState, useEffect } from "react";
import "./MatchLineup.css";

const FORMATIONS = {
  "4-3-3": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }], MID: [{ x: 32, y: 30 }, { x: 32, y: 50 }, { x: 32, y: 70 }], FWD: [{ x: 44, y: 25 }, { x: 44, y: 50 }, { x: 44, y: 75 }] },
  "4-4-2": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }], MID: [{ x: 32, y: 20 }, { x: 32, y: 40 }, { x: 32, y: 60 }, { x: 32, y: 80 }], FWD: [{ x: 44, y: 35 }, { x: 44, y: 65 }] },
  "4-5-1": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }], MID: [{ x: 32, y: 15 }, { x: 32, y: 32 }, { x: 32, y: 50 }, { x: 32, y: 68 }, { x: 32, y: 85 }], FWD: [{ x: 44, y: 50 }] },
  "3-5-2": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 30 }, { x: 20, y: 50 }, { x: 20, y: 70 }], MID: [{ x: 28, y: 15 }, { x: 34, y: 35 }, { x: 34, y: 50 }, { x: 34, y: 65 }, { x: 28, y: 85 }], FWD: [{ x: 44, y: 35 }, { x: 44, y: 65 }] }
};

function MatchLineup({ matchData, layout = "horizontal", initialLineup, readOnly = false }) {
  const isVertical = layout === "vertical";
  const [allPlayers, setAllPlayers] = useState([]);
  const [teamAFormation, setTeamAFormation] = useState("4-3-3");
  const [teamBFormation, setTeamBFormation] = useState("4-4-2");
  const [teamAPlayers, setTeamAPlayers] = useState({});
  const [teamBPlayers, setTeamBPlayers] = useState({});
  const [ratingModal, setRatingModal] = useState(null);
  const [tempRating, setTempRating] = useState("");
  const [saving, setSaving] = useState(false);

  // 1. Load initial saved data if viewing a past report
  useEffect(() => {
    if (initialLineup) {
      setTeamAFormation(initialLineup.teamA?.formation || "4-3-3");
      setTeamBFormation(initialLineup.teamB?.formation || "4-4-2");
      setTeamAPlayers(initialLineup.teamA?.players || {});
      setTeamBPlayers(initialLineup.teamB?.players || {});
    }
  }, [initialLineup]);

  // 2. Only fetch full player pool if we are in Edit mode (not readOnly)
  useEffect(() => {
    if (!readOnly) {
      fetch("http://localhost:5000/player-attributes")
        .then(res => res.json())
        .then(data => setAllPlayers(Array.isArray(data) ? data : []));
    }
  }, [readOnly]);

  const handleDragStart = (e, player) => e.dataTransfer.setData("application/json", JSON.stringify(player));
  const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); };
  const handleDragLeave = (e) => e.currentTarget.classList.remove("drag-over");
  
  const handleDrop = (e, team, slotId) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const player = JSON.parse(e.dataTransfer.getData("application/json"));
    setRatingModal({ team, slotId, player });
    setTempRating("");
  };

  const confirmRating = () => {
    const { team, slotId, player } = ratingModal;
    const rating = parseFloat(tempRating);
    if (isNaN(rating) || rating < 0 || rating > 10) return alert("Invalid rating (0-10).");
    
    // ✨ OPTIMIZATION: Only save essential data, NOT the 28 individual stats
    const essentialPlayer = {
      Contributor: player.Contributor,
      picture: player.picture,
      position: player.position,
      rating: rating
    };

    const setter = team === "A" ? setTeamAPlayers : setTeamBPlayers;
    setter(prev => ({ ...prev, [slotId]: essentialPlayer }));
    setRatingModal(null);
  };

  const removePlayer = (team, slotId) => {
    const setter = team === "A" ? setTeamAPlayers : setTeamBPlayers;
    setter(prev => { const u = { ...prev }; delete u[slotId]; return u; });
  };

  const saveLineup = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:5000/match-lineups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: matchData.Date, location: matchData.Location, time: matchData.Time,
          teamA: { formation: teamAFormation, players: teamAPlayers },
          teamB: { formation: teamBFormation, players: teamBPlayers }
        })
      });
      alert("✅ Lineup saved successfully!");
    } catch (err) { alert("❌ Failed to save lineup."); } 
    finally { setSaving(false); }
  };

  const getSlotPosition = (pos, team, isVert) => {
    if (!isVert) return { left: `${team === "A" ? pos.x : 100 - pos.x}%`, top: `${pos.y}%` };
    return team === "A" ? { left: `${pos.y}%`, top: `${100 - pos.x}%` } : { left: `${100 - pos.y}%`, top: `${pos.x}%` };
  };

  const renderSlots = (formation, team, playersObj) => {
    const slots = [];
    Object.entries(FORMATIONS[formation]).forEach(([line, positions]) => {
      positions.forEach((pos, idx) => {
        const slotId = `${line}${idx}`;
        const player = playersObj[slotId];
        slots.push(
          <div key={`${team}-${slotId}`} className={`pitch-slot ${player ? "filled" : ""}`}
            style={getSlotPosition(pos, team, isVertical)}
            onDragOver={readOnly ? undefined : handleDragOver}
            onDragLeave={readOnly ? undefined : handleDragLeave}
            onDrop={readOnly ? undefined : (e) => handleDrop(e, team, slotId)}>
            {player ? (
              <div className="slot-card">
                <img src={player.picture || `/${player.Contributor}.jpeg`} alt={player.Contributor} />
                <div className="slot-info">
                  <span className="slot-name">{player.Contributor}</span>
                  <span className="slot-rating">{player.rating}</span>
                </div>
                {!readOnly && <button className="slot-remove" onClick={(e) => { e.stopPropagation(); removePlayer(team, slotId); }}>×</button>}
              </div>
            ) : (
              !readOnly && <span className="slot-label">{slotId}</span>
            )}
          </div>
        );
      });
    });
    return slots;
  };

  const PlayerPoolComponent = (
    <div className={`player-pool ${isVertical ? "vertical-pool" : ""}`}>
      <h3>{isVertical ? "Squad" : "Available Players (Drag to Pitch)"}</h3>
      <div className={`pool-grid ${isVertical ? "vertical-grid" : ""}`}>
        {allPlayers.map(p => (
          <div key={p.Contributor} className="pool-card" draggable="true" onDragStart={(e) => handleDragStart(e, p)}>
            <img src={p.picture || `/${p.Contributor}.jpeg`} alt={p.Contributor} />
            <div className="name">{p.Contributor}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`match-lineup-container ${isVertical ? "layout-vertical" : "layout-horizontal"}`}>
      {!readOnly && <h2 className="lineup-title">⚽ Match Lineup & Ratings</h2>}
      
      <div className="lineup-content">
        {isVertical && !readOnly && PlayerPoolComponent}

        <div className="pitch-and-controls">
          <div className="formations-select">
            <div className="team-select">
              <label>Team A Formation:</label>
              <select value={teamAFormation} onChange={e => setTeamAFormation(e.target.value)} disabled={readOnly}>
                {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="team-select">
              <label>Team B Formation:</label>
              <select value={teamBFormation} onChange={e => setTeamBFormation(e.target.value)} disabled={readOnly}>
                {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className={`pitch-wrapper ${isVertical ? "vertical" : ""}`}>
            <div className="pitch-lines">
              <div className="pitch-outline" /><div className="center-line" /><div className="center-circle" />
              <div className="penalty-box-left" /><div className="penalty-box-right" />
            </div>
            {renderSlots(teamAFormation, "A", teamAPlayers)}
            {renderSlots(teamBFormation, "B", teamBPlayers)}
          </div>

          {!isVertical && !readOnly && PlayerPoolComponent}
        </div>
      </div>

      {!readOnly && (
        <div className="lineup-actions">
          <button className="save-lineup-btn" onClick={saveLineup} disabled={saving}>
            {saving ? "Saving..." : "💾 Save Lineup & Ratings"}
          </button>
        </div>
      )}

      {ratingModal && (
        <div className="rating-modal-overlay" onClick={() => setRatingModal(null)}>
          <div className="rating-modal" onClick={e => e.stopPropagation()}>
            <h3>Rate {ratingModal.player.Contributor}</h3>
            <input type="number" min="0" max="10" step="0.1" className="rating-input" value={tempRating} onChange={e => setTempRating(e.target.value)} placeholder="0.0 - 10.0" autoFocus />
            <div className="rating-actions">
              <button className="btn-cancel" onClick={() => setRatingModal(null)}>Cancel</button>
              <button className="btn-confirm" onClick={confirmRating}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchLineup;