  import React, { useState, useEffect } from "react";
  import "./MatchLineup.css";

  // Standardized 11-slot formations
  // Each formation has an array of 11 labels and 11 coordinate pairs
  const FORMATIONS = {
    "4-4-2": {
      labels: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
      coords: [
        { x: 5, y: 50 }, { x: 16, y: 15 }, { x: 16, y: 38 }, { x: 16, y: 62 }, { x: 16, y: 85 },
        { x: 28, y: 15 }, { x: 28, y: 38 }, { x: 28, y: 62 }, { x: 28, y: 85 },
        { x: 43, y: 35 }, { x: 43, y: 65 } 
      ]
    },
    "4-3-3": {
      labels: ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CM", "LW", "ST", "RW"],
      coords: [
        { x: 5, y: 50 }, { x: 16, y: 15 }, { x: 16, y: 38 }, { x: 16, y: 62 }, { x: 16, y: 85 },
        { x: 26, y: 50 }, { x: 30, y: 30 }, { x: 30, y: 70 },
        { x: 40, y: 15 }, { x: 43, y: 50 }, { x: 40, y: 85 }
      ]
    },
    "3-5-2": {
      labels: ["GK", "CB", "CB", "CB", "LWB", "CM", "CM", "CM", "RWB", "ST", "ST"],
      coords: [
        { x: 5, y: 50 }, { x: 16, y: 30 }, { x: 16, y: 50 }, { x: 16, y: 70 },
        { x: 26, y: 10 }, { x: 30, y: 35 }, { x: 30, y: 50 }, { x: 30, y: 65 }, { x: 26, y: 90 },
        { x: 43, y: 35 }, { x: 43, y: 65 }
      ]
    },
    "4-2-3-1": {
      labels: ["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "LAM", "CAM", "RAM", "ST"],
      coords: [
        { x: 5, y: 50 }, { x: 16, y: 15 }, { x: 16, y: 38 }, { x: 16, y: 62 }, { x: 16, y: 85 },
        { x: 26, y: 35 }, { x: 26, y: 65 },
        { x: 36, y: 20 }, { x: 36, y: 50 }, { x: 36, y: 80 }, { x: 43, y: 50 }
      ]
    },
  };

  // Helper to migrate old data format (DEF0, MID1) to new array format
  function migrateLineupData(oldLineup) {
    if (!oldLineup) return { formation: "4-4-2", players: Array(11).fill(null) };
    
    // If already an array, ensure it's exactly 11 elements
    if (Array.isArray(oldLineup.players)) {
      const players = [...oldLineup.players];
      while (players.length < 11) players.push(null);
      return { formation: oldLineup.formation || "4-4-2", players };
    }

    // Old format migration
    const players = Array(11).fill(null);
    const mapping = {
      "GK0": 0,
      "DEF0": 1, "DEF1": 2, "DEF2": 3, "DEF3": 4,
      "MID0": 5, "MID1": 6, "MID2": 7, "MID3": 8, "MID4": 6,
      "FWD0": 9, "FWD1": 10, "FWD2": 9,
      "AM0": 6
    };
    
    Object.entries(oldLineup.players || {}).forEach(([key, player]) => {
      const idx = mapping[key] !== undefined ? mapping[key] : 0;
      if (player && player.Contributor) players[idx] = player;
    });
    
    return { formation: oldLineup.formation || "4-4-2", players };
  }

  function MatchLineup({ 
    matchData, 
    initialLineup, 
    layout = "horizontal", 
    getRatingColor, 
    getPlayerMatchStats,
    editMode = false,
    onLineupChange,
    onSlotClick // New prop for handling clicks in edit mode
  }) {
    const isVertical = layout === "vertical";
    const [teamAFormation, setTeamAFormation] = useState("4-4-2");
    const [teamBFormation, setTeamBFormation] = useState("4-4-2");
    const [teamAPlayers, setTeamAPlayers] = useState(Array(11).fill(null));
    const [teamBPlayers, setTeamBPlayers] = useState(Array(11).fill(null));

    useEffect(() => {
      if (initialLineup) {
        const migratedA = migrateLineupData(initialLineup.teamA);
        const migratedB = migrateLineupData(initialLineup.teamB);
        
        setTeamAFormation(migratedA.formation);
        setTeamBFormation(migratedB.formation);
        setTeamAPlayers(migratedA.players);
        setTeamBPlayers(migratedB.players);
      }
    }, [initialLineup]);

      const getSlotPosition = (pos, team) => {
    if (!isVertical) {
      // Horizontal: Team A attacks Left->Right, Team B attacks Right->Left
      return { 
        left: `${team === "A" ? pos.x : 100 - pos.x}%`, 
        top: `${team === "A" ? pos.y : 100 - pos.y}%` // ✨ Mirror Y-axis for Team B
      };
    } else {
      // Vertical: Team A attacks Bottom->Top, Team B attacks Top->Bottom
      return { 
        left: `${team === "A" ? pos.y : 100 - pos.y}%`, // Mirror X-axis for Team B
        top: `${team === "A" ? 100 - pos.x : pos.x}%`   // Team A at bottom, Team B at top
      };
    }
  };
    const handleSlotClick = (team, idx, currentPlayer) => {
      if (editMode && onSlotClick) {
        onSlotClick(team, idx, currentPlayer);
      }
    };

      const renderSlots = (formation, team, playersArr) => {
      const formationDef = FORMATIONS[formation] || FORMATIONS["4-4-2"];
      
      return formationDef.coords.map((pos, idx) => {
        const player = playersArr[idx];
        const label = formationDef.labels[idx];
        const slotStyle = getSlotPosition(pos, team);

        return (
          <div
            key={`${team}-${idx}`}
            className={`pitch-slot ${player ? "filled" : "empty"} ${editMode ? 'editable' : ''}`}
            style={slotStyle}
            onClick={() => handleSlotClick(team, idx, player)}
          >
            {player ? (
              <div className={`slot-card ${player.isMotm ? 'motm' : ''}`}>
                {player.isMotm && <span className="motm-badge">⭐ MOTM</span>}
                
                {/* Goal/Assist symbols for Ryan/Darren */}
                {(() => {
                  const name = (player.Contributor || "").trim().toLowerCase();
                  if (name !== "ryan" && name !== "darren") return null;
                  const goals = player.goals || 0;
                  const assists = player.assists || 0;
                  if (goals === 0 && assists === 0) return null;
                  const symbols = [...Array(goals).fill('⚽'), ...Array(assists).fill('👟')];
                  return (
                    <div className="slot-symbols">
                      {symbols.map((s, i) => <span key={i} className="slot-symbol">{s}</span>)}
                    </div>
                  );
                })()}

                <img src={player.picture || `/${player.Contributor}.jpeg`} alt={player.Contributor} />
                <div className="slot-info">
                  <span className="slot-name">{player.Contributor}</span>
                  <span className="slot-rating" style={{ color: getRatingColor ? getRatingColor(player.rating) : undefined }}>
                    {player.rating != null ? parseFloat(player.rating).toFixed(1) : '—'}
                  </span>
                </div>
              </div>
            ) : (
              // ✨ NEW EMPTY SLOT DESIGN
              <div className="empty-slot-card">
                <div className="empty-slot-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span className="empty-slot-label">{label}</span>
                {editMode && <span className="empty-slot-hint">Click to add</span>}
              </div>
            )}
          </div>
        );
      });
    };

    const handleFormationChange = (team, newFormation) => {
      if (team === "A") {
        setTeamAFormation(newFormation);
        onLineupChange && onLineupChange({ teamA: { formation: newFormation, players: teamAPlayers }, teamB: { formation: teamBFormation, players: teamBPlayers } });
      } else {
        setTeamBFormation(newFormation);
        onLineupChange && onLineupChange({ teamA: { formation: teamAFormation, players: teamAPlayers }, teamB: { formation: newFormation, players: teamBPlayers } });
      }
    };

    return (
      <div className={`match-lineup-container ${isVertical ? "layout-vertical" : "layout-horizontal"}`}>
        <div className="lineup-content">
          <div className="pitch-and-controls">
            <div className="formations-select" style={{ pointerEvents: editMode ? 'auto' : 'none', opacity: editMode ? 1 : 0.7 }}>
              <div className="team-select">
                <label>Team A:</label>
                <select 
                  value={teamAFormation} 
                  onChange={(e) => handleFormationChange("A", e.target.value)}
                  disabled={!editMode}
                  style={{ marginLeft: 8, padding: '4px 8px', borderRadius: '4px' }}
                >
                  {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="team-select">
                <label>Team B:</label>
                <select 
                  value={teamBFormation} 
                  onChange={(e) => handleFormationChange("B", e.target.value)}
                  disabled={!editMode}
                  style={{ marginLeft: 8, padding: '4px 8px', borderRadius: '4px' }}
                >
                  {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className={`pitch-wrapper ${isVertical ? "vertical" : ""}`}>
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
          </div>
        </div>
      </div>
    );
  }

  export default MatchLineup;