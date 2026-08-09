import React, { useState, useEffect } from "react";
import "./MatchLineup.css";

// Formation coordinates (Left side X: 8% to 44%)
const FORMATIONS = {
  "4-3-3": {
    GK: [{ x: 8, y: 50 }],
    DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }],
    MID: [{ x: 32, y: 30 }, { x: 32, y: 50 }, { x: 32, y: 70 }],
    FWD: [{ x: 44, y: 25 }, { x: 44, y: 50 }, { x: 44, y: 75 }]
  },
  "4-4-2": {
    GK: [{ x: 8, y: 50 }],
    DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }],
    MID: [{ x: 32, y: 20 }, { x: 32, y: 40 }, { x: 32, y: 60 }, { x: 32, y: 80 }],
    FWD: [{ x: 44, y: 35 }, { x: 44, y: 65 }]
  },
  "4-5-1": {
    GK: [{ x: 8, y: 50 }],
    DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }],
    MID: [{ x: 32, y: 15 }, { x: 32, y: 32 }, { x: 32, y: 50 }, { x: 32, y: 68 }, { x: 32, y: 85 }],
    FWD: [{ x: 44, y: 50 }]
  },
  "3-5-2": {
    GK: [{ x: 8, y: 50 }],
    DEF: [{ x: 20, y: 30 }, { x: 20, y: 50 }, { x: 20, y: 70 }],
    MID: [{ x: 28, y: 15 }, { x: 34, y: 35 }, { x: 34, y: 50 }, { x: 34, y: 65 }, { x: 28, y: 85 }],
    FWD: [{ x: 44, y: 35 }, { x: 44, y: 65 }]
  }
};

function MatchLineup({ matchData }) {
  const [allPlayers, setAllPlayers] = useState([]);
  const [teamAFormation, setTeamAFormation] = useState("4-3-3");
  const [teamBFormation, setTeamBFormation] = useState("4-4-2");
  const [teamAPlayers, setTeamAPlayers] = useState({});
  const [teamBPlayers, setTeamBPlayers] = useState({});
  const [ratingModal, setRatingModal] = useState(null);
  const [tempRating, setTempRating] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/player-attributes")
      .then(res => res.json())
      .then(data => setAllPlayers(Array.isArray(data) ? data : []));
  }, []);

  const handleDragStart = (e, player) => {
    e.dataTransfer.setData("application/json", JSON.stringify(player));
  };

  const handleDrop = (e, team, slotId) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const player = JSON.parse(e.dataTransfer.getData("application/json"));
    setRatingModal({ team, slotId, player });
    setTempRating("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const confirmRating = () => {
    const { team, slotId, player } = ratingModal;
    const rating = parseFloat(tempRating);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      alert("Please enter a valid rating between 0 and 10.");
      return;
    }
    
    const setter = team === "A" ? setTeamAPlayers : setTeamBPlayers;
    setter(prev => ({ ...prev, [slotId]: { ...player, rating } }));
    setRatingModal(null);
  };

  const removePlayer = (team, slotId) => {
    const setter = team === "A" ? setTeamAPlayers : setTeamBPlayers;
    setter(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
  };

  const saveLineup = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:5000/match-lineups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: matchData.Date,
          teamA: { formation: teamAFormation, players: teamAPlayers },
          teamB: { formation: teamBFormation, players: teamBPlayers }
        })
      });
      alert("✅ Lineup saved successfully!");
    } catch (err) {
      alert("❌ Failed to save lineup.");
    } finally {
      setSaving(false);
    }
  };

  const renderSlots = (formation, team, playersObj) => {
    const coords = FORMATIONS[formation];
    const slots = [];
    
    Object.entries(coords).forEach(([line, positions]) => {
      positions.forEach((pos, idx) => {
        const slotId = `${line}${idx}`;
        // Mirror X coordinate for Team B (Right Side)
        const x = team === "A" ? pos.x : 100 - pos.x; 
        const y = pos.y;
        const player = playersObj[slotId];

        slots.push(
          <div 
            key={`${team}-${slotId}`}
            className={`pitch-slot ${player ? "filled" : ""}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, team, slotId)}
          >
            {player ? (
              <div className="slot-card">
                <img src={player.picture || `/${player.Contributor}.jpeg`} alt={player.Contributor} />
                <div className="slot-info">
                  <span className="slot-name">{player.Contributor}</span>
                  <span className="slot-rating">{player.rating}</span>
                </div>
                <button className="slot-remove" onClick={(e) => { e.stopPropagation(); removePlayer(team, slotId); }}>×</button>
              </div>
            ) : (
              <span className="slot-label">{slotId}</span>
            )}
          </div>
        );
      });
    });
    return slots;
  };

  return (
    <div className="match-lineup-container">
      <h2 className="lineup-title">⚽ Match Lineup & Ratings</h2>
      
      <div className="formations-select">
        <div className="team-select">
          <label>Team A Formation:</label>
          <select value={teamAFormation} onChange={e => setTeamAFormation(e.target.value)}>
            {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="team-select">
          <label>Team B Formation:</label>
          <select value={teamBFormation} onChange={e => setTeamBFormation(e.target.value)}>
            {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="pitch-wrapper">
        <div className="pitch-lines">
          <div className="pitch-outline" />
          <div className="center-line" />
          <div className="center-circle" />
          <div className="penalty-box-left" />
          <div className="penalty-box-right" />
        </div>
        
        {renderSlots(teamAFormation, "A", teamAPlayers)}
        {renderSlots(teamBFormation, "B", teamBPlayers)}
      </div>

      <div className="player-pool">
        <h3>Available Players (Drag to Pitch)</h3>
        <div className="pool-grid">
          {allPlayers.map(p => (
            <div 
              key={p.Contributor} 
              className="pool-card" 
              draggable="true" 
              onDragStart={(e) => handleDragStart(e, p)}
            >
              <img src={p.picture || `/${p.Contributor}.jpeg`} alt={p.Contributor} />
              <div className="name">{p.Contributor}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lineup-actions">
        <button className="save-lineup-btn" onClick={saveLineup} disabled={saving}>
          {saving ? "Saving..." : "💾 Save Lineup & Ratings"}
        </button>
      </div>

      {ratingModal && (
        <div className="rating-modal-overlay" onClick={() => setRatingModal(null)}>
          <div className="rating-modal" onClick={e => e.stopPropagation()}>
            <h3>Rate {ratingModal.player.Contributor}</h3>
            <input 
              type="number" 
              min="0" 
              max="10" 
              step="0.1"
              className="rating-input" 
              value={tempRating}
              onChange={e => setTempRating(e.target.value)}
              placeholder="0.0 - 10.0"
              autoFocus
            />
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