import React, { useState, useEffect } from "react";
import "./MatchLineup.css";

// ✅ Import or define FILTER_GROUPS directly so MatchLineup 
// always knows about ALL players regardless of /player-attributes
const FILTER_GROUPS = {
  Barry: ['Lu', 'Nick', 'Jacob', '普巴', 'Chris', '局長', 'Eugene', '大嚿', 'Barry', 'Chun', '子睿', 'Steve', 'Alex', 'hong', 'R', 'Ken', 'Derek', 'Marco', 'Nin', 'Dave', 'S Joe', 'Po', 'QC', 'Raymond'],
  'The Bros': ['Ryan', 'Darren'],
  馬哲: ['Tony', '馬俊翔'],
};

// Derive a deduplicated master list of ALL known players
const ALL_KNOWN_PLAYERS = [...new Set(
  Object.values(FILTER_GROUPS).flat()
)];

const FORMATIONS = {
  // ... keep your existing FORMATIONS object unchanged ...
  "4-3-3": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }], MID: [{ x: 32, y: 30 }, { x: 32, y: 50 }, { x: 32, y: 70 }], FWD: [{ x: 44, y: 25 }, { x: 44, y: 50 }, { x: 44, y: 75 }] },
  "4-4-2": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }], MID: [{ x: 32, y: 20 }, { x: 32, y: 40 }, { x: 32, y: 60 }, { x: 32, y: 80 }], FWD: [{ x: 44, y: 35 }, { x: 44, y: 65 }] },
  "4-5-1": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }], MID: [{ x: 32, y: 15 }, { x: 32, y: 32 }, { x: 32, y: 50 }, { x: 32, y: 68 }, { x: 32, y: 85 }], FWD: [{ x: 44, y: 50 }] },
  "3-5-2": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 30 }, { x: 20, y: 50 }, { x: 20, y: 70 }], MID: [{ x: 28, y: 15 }, { x: 34, y: 35 }, { x: 34, y: 50 }, { x: 34, y: 65 }, { x: 28, y: 85 }], FWD: [{ x: 44, y: 35 }, { x: 44, y: 65 }] },
  "4-3-1-2": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }], MID: [{ x: 30, y: 30 }, { x: 30, y: 50 }, { x: 30, y: 70 }], AM: [{ x: 38, y: 50 }], FWD: [{ x: 46, y: 35 }, { x: 46, y: 65 }] },
  "4-2-3-1": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 }, { x: 20, y: 80 }], MID: [{ x: 28, y: 35 }, { x: 28, y: 65 }], AM: [{ x: 38, y: 25 }, { x: 38, y: 50 }, { x: 38, y: 75 }], FWD: [{ x: 46, y: 50 }] },
  "3-4-3": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 30 }, { x: 20, y: 50 }, { x: 20, y: 70 }], MID: [{ x: 32, y: 20 }, { x: 32, y: 40 }, { x: 32, y: 60 }, { x: 32, y: 80 }], FWD: [{ x: 44, y: 25 }, { x: 44, y: 50 }, { x: 44, y: 75 }] },
  "3-4-1-2": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 30 }, { x: 20, y: 50 }, { x: 20, y: 70 }], MID: [{ x: 30, y: 20 }, { x: 30, y: 40 }, { x: 30, y: 60 }, { x: 30, y: 80 }], AM: [{ x: 38, y: 50 }], FWD: [{ x: 46, y: 35 }, { x: 46, y: 65 }] },
  "5-3-2": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 15 }, { x: 20, y: 32 }, { x: 20, y: 50 }, { x: 20, y: 68 }, { x: 20, y: 85 }], MID: [{ x: 32, y: 30 }, { x: 32, y: 50 }, { x: 32, y: 70 }], FWD: [{ x: 44, y: 35 }, { x: 44, y: 65 }] },
  "5-4-1": { GK: [{ x: 8, y: 50 }], DEF: [{ x: 20, y: 15 }, { x: 20, y: 32 }, { x: 20, y: 50 }, { x: 20, y: 68 }, { x: 20, y: 85 }], MID: [{ x: 32, y: 20 }, { x: 32, y: 40 }, { x: 32, y: 60 }, { x: 32, y: 80 }], FWD: [{ x: 44, y: 50 }] }
};

function MatchLineup({ 
  matchData, initialLineup, readOnly, editMode, layout, 
  availablePlayers: propAvailablePlayers, // still accept if passed
  getRatingColor, onLineupChange, getPlayerMatchStats 
}) {
  const isVertical = layout === "vertical";
  const [teamAFormation, setTeamAFormation] = useState("4-4-2");
  const [teamBFormation, setTeamBFormation] = useState("4-4-2");
  const [teamAPlayers, setTeamAPlayers] = useState({});
  const [teamBPlayers, setTeamBPlayers] = useState({});

  // ✅ NEW: Build available players from FILTER_GROUPS + merge attribute data
  const [availablePlayers, setAvailablePlayers] = useState([]);

  useEffect(() => {
    // Fetch attributes to enrich FILTER_GROUPS names with pictures/positions
    fetch("http://localhost:5000/player-attributes")
      .then(res => res.json())
      .then(attrs => {
        const attrMap = {};
        (Array.isArray(attrs) ? attrs : []).forEach(a => {
          attrMap[a.Contributor] = a;
        });

        // Build full player list from FILTER_GROUPS, enriched with attribute data
        const players = ALL_KNOWN_PLAYERS.map(name => ({
          Contributor: name,
          picture: attrMap[name]?.picture || "",
          position: attrMap[name]?.position || "",
          overall: attrMap[name]?.overall || null,
          ...attrMap[name], // spread all attributes if they exist
        }));

        setAvailablePlayers(players);
      })
      .catch(err => {
        console.error("Failed to load player attributes:", err);
        // Fallback: just use names from FILTER_GROUPS without attributes
        setAvailablePlayers(ALL_KNOWN_PLAYERS.map(name => ({
          Contributor: name,
          picture: "",
          position: "",
        })));
      });
  }, []);

  // Player Picker State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pickerRating, setPickerRating] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");

  useEffect(() => {
    if (initialLineup) {
      setTeamAFormation(initialLineup.teamA?.formation || "4-4-2");
      setTeamBFormation(initialLineup.teamB?.formation || "4-4-2");
      setTeamAPlayers(initialLineup.teamA?.players || {});
      setTeamBPlayers(initialLineup.teamB?.players || {});
    }
  }, [initialLineup]);

  // Notify parent of changes
  useEffect(() => {
    if (editMode && onLineupChange) {
      onLineupChange({
        teamA: { formation: teamAFormation, players: teamAPlayers },
        teamB: { formation: teamBFormation, players: teamBPlayers }
      });
    }
  }, [teamAFormation, teamBFormation, teamAPlayers, teamBPlayers, editMode, onLineupChange]);

  // --- Player Picker Logic ---
  const handleEmptySlotClick = (team, slotId, position) => {
    if (!editMode) return;
    setSelectedSlot({ team, slotId, position });
    setPickerRating("");
    setPickerSearch("");
    setPickerOpen(true);
  };

  const assignedNames = new Set([
    ...Object.values(teamAPlayers).map(p => p.Contributor),
    ...Object.values(teamBPlayers).map(p => p.Contributor)
  ]);

  // ✅ Filter available players by search AND exclude already-assigned
  const filteredPlayers = availablePlayers.filter(p =>
    !assignedNames.has(p.Contributor) &&
    (p.Contributor.toLowerCase().includes(pickerSearch.toLowerCase()) ||
     (p.position && p.position.toLowerCase().includes(pickerSearch.toLowerCase())))
  );

  const handleAssignPlayer = (player) => {
    if (!selectedSlot) return;
    const rating = parseFloat(pickerRating);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      alert("Please enter a valid rating (0-10)");
      return;
    }

    const assignment = {
      Contributor: player.Contributor,
      picture: player.picture || "",
      position: selectedSlot.position,
      rating: rating
    };

    if (selectedSlot.team === "A") {
      setTeamAPlayers(prev => ({ ...prev, [selectedSlot.slotId]: assignment }));
    } else {
      setTeamBPlayers(prev => ({ ...prev, [selectedSlot.slotId]: assignment }));
    }

    setPickerOpen(false);
    setSelectedSlot(null);
  };

  const removePlayer = (team, slotId) => {
    if (team === "A") setTeamAPlayers(prev => { const n = {...prev}; delete n[slotId]; return n; });
    else setTeamBPlayers(prev => { const n = {...prev}; delete n[slotId]; return n; });
  };

  const getSlotPosition = (pos, team, isVert) => {
    if (!isVert) return { left: `${team === "A" ? pos.x : 100 - pos.x}%`, top: `${pos.y}%` };
    return team === "A" ? { left: `${pos.y}%`, top: `${100 - pos.x}%` } : { left: `${100 - pos.y}%`, top: `${pos.x}%` };
  };

  const renderSlots = (formation, team, playersObj) => {
    const slots = [];
    const formationDef = FORMATIONS[formation] || FORMATIONS["4-4-2"];

    Object.entries(formationDef).forEach(([line, positions]) => {
      positions.forEach((pos, idx) => {
        const slotId = `${line}${idx}`;
        const player = playersObj[slotId];

        slots.push(
          <div
            key={`${team}-${slotId}`}
            className={`pitch-slot ${player ? "filled" : ""} ${!player && editMode ? "editable" : ""}`}
            style={getSlotPosition(pos, team, isVertical)}
            onClick={() => !player && handleEmptySlotClick(team, slotId, line)}
          >
            {player ? (
              <div className="slot-card">
                {/* Symbols for Ryan/Darren in read-only */}
                {readOnly && getPlayerMatchStats && (() => {
                  const name = (player.Contributor || "").trim();
                  const lowerName = name.toLowerCase();
                  if (lowerName !== "ryan" && lowerName !== "darren") return null;
                  const stats = getPlayerMatchStats(name, matchData.Date, matchData.Location, matchData.Time);
                  if (!stats) return null;
                  const goals = parseInt(stats.Goal) || 0;
                  const assists = parseInt(stats.Assist) || 0;
                  if (goals === 0 && assists === 0) return null;
                  const symbols = [...Array(goals).fill('⚽'), ...Array(assists).fill('👟')];
                  return (
                    <div className="slot-symbols">
                      {symbols.map((s, i) => <span key={i} className="slot-symbol">{s}</span>)}
                    </div>
                  );
                })()}

                {/* ✅ FIXED IMAGE PATH */}
                <img src={player.picture || `/${player.Contributor}.jpeg`} alt={player.Contributor} />
                <div className="slot-info">
                  <span className="slot-name">{player.Contributor}</span>
                  <span className="slot-rating" style={{ color: getRatingColor ? getRatingColor(player.rating) : undefined }}>
                    {player.rating != null ? parseFloat(player.rating).toFixed(1) : '—'}
                  </span>
                </div>
                {editMode && (
                  <button className="slot-remove" onClick={(e) => { e.stopPropagation(); removePlayer(team, slotId); }}>×</button>
                )}
              </div>
            ) : (
              <span className="slot-label">{editMode ? `+ ${line}` : slotId}</span>
            )}
          </div>
        );
      });
    });
    return slots;
  };

  return (
    <div className={`match-lineup-container ${isVertical ? "layout-vertical" : "layout-horizontal"}`}>
      {!readOnly && <h2 className="lineup-title">⚽ Edit Tactical Lineup</h2>}

      <div className="lineup-content">
        <div className="pitch-and-controls">
          {/* Formation Selectors */}
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

          {/* Pitch */}
          <div className={`pitch-wrapper ${isVertical ? "vertical" : ""}`}>
            <div className="pitch-lines">
              <div className="pitch-outline" /><div className="center-line" /><div className="center-circle" />
              <div className="penalty-box-left" /><div className="penalty-box-right" />
            </div>
            {renderSlots(teamAFormation, "A", teamAPlayers)}
            {renderSlots(teamBFormation, "B", teamBPlayers)}
          </div>
        </div>
      </div>

      {/* ===== PLAYER PICKER POPUP ===== */}
      {pickerOpen && selectedSlot && (
        <div className="picker-overlay" onClick={() => setPickerOpen(false)}>
          <div className="picker-modal" onClick={e => e.stopPropagation()}>
            <button className="picker-close" onClick={() => setPickerOpen(false)}>✕</button>
            <h3>Add Player to {selectedSlot.position} ({selectedSlot.team === 'A' ? 'Team A' : 'Team B'})</h3>

            {/* Rating Input */}
            <div className="picker-rating-row">
              <label>Rating:</label>
              <input
                type="number" min="0" max="10" step="0.1"
                value={pickerRating}
                onChange={e => setPickerRating(e.target.value)}
                placeholder="0.0 – 10.0"
                autoFocus
              />
            </div>

            {/* Search Input */}
            <input
              className="picker-search"
              type="text"
              placeholder="Search player name or position..."
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
            />

            {/* Player List */}
            <div className="picker-list">
              {filteredPlayers.length === 0 && (
                <div className="picker-empty">No available players found</div>
              )}
              {filteredPlayers.map((p, i) => (
                <div key={i} className="picker-item" onClick={() => handleAssignPlayer(p)}>
                  {/* ✅ FIXED IMAGE PATH */}
                  <img src={p.picture || `/${p.Contributor}.jpeg`} alt={p.Contributor} />
                  <span className="picker-name">{p.Contributor}</span>
                  <span className="picker-pos">{p.position || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchLineup;