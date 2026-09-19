import React, { useState, useEffect } from "react";
import "./MatchLineup.css";
const GITHUB_OWNER = "ryanhui0410";
const GITHUB_REPO = "football";   // ← repo name is "football", NOT "football/football-app"
const IMAGES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/football-app/public/images`;
// Standardized 11-slot formations
const FORMATIONS = {
  "4-4-2": {
    labels: ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
    coords: [
      { x: 3, y: 50 }, { x: 16, y: 15 }, { x: 16, y: 38 }, { x: 16, y: 62 }, { x: 16, y: 85 },
      { x: 29.5, y: 15 }, { x: 29.5, y: 38 }, { x: 29.5, y: 62 }, { x: 29.5, y: 85 },
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

// Helper to migrate old data format to new array format (including subs)
function migrateLineupData(oldLineup) {
  if (!oldLineup) return { formation: "4-4-2", players: Array(11).fill(null), subs: [null, null] };
  
  if (Array.isArray(oldLineup.players)) {
    const players = [...oldLineup.players];
    while (players.length < 11) players.push(null);
    const subs = Array.isArray(oldLineup.subs) ? [...oldLineup.subs] : [null, null];
    while (subs.length < 2) subs.push(null);
    return { formation: oldLineup.formation || "4-4-2", players, subs };
  }

  // Old format migration
  const players = Array(11).fill(null);
  const mapping = { "GK0": 0, "DEF0": 1, "DEF1": 2, "DEF2": 3, "DEF3": 4, "MID0": 5, "MID1": 6, "MID2": 7, "MID3": 8, "MID4": 6, "FWD0": 9, "FWD1": 10, "FWD2": 9, "AM0": 6 };
  Object.entries(oldLineup.players || {}).forEach(([key, player]) => {
    const idx = mapping[key] !== undefined ? mapping[key] : 0;
    if (player && player.Contributor) players[idx] = player;
  });
  
  return { formation: oldLineup.formation || "4-4-2", players, subs: [null, null] };
}

function MatchLineup({ 
  matchData, 
  initialLineup, 
  layout = "horizontal", 
  getRatingColor, 
  getPlayerMatchStats,
  editMode = false,
  onLineupChange,
  onSlotClick,
  pictureMap: pictureMapProp,
}) {
  const isVertical = layout === "vertical";
  
  // ALL STATE INSIDE THE COMPONENT
  const [teamAFormation, setTeamAFormation] = useState("4-4-2");
  const [teamBFormation, setTeamBFormation] = useState("4-4-2");
  const [teamAPlayers, setTeamAPlayers] = useState(Array(11).fill(null));
  const [teamBPlayers, setTeamBPlayers] = useState(Array(11).fill(null));
  const [teamASubs, setTeamASubs] = useState([null, null]);
  const [teamBSubs, setTeamBSubs] = useState([null, null]);
  const [ownPictureMap, setOwnPictureMap] = useState({});
    useEffect(() => {
    if (pictureMapProp && Object.keys(pictureMapProp).length > 0) return; // parent supplied one
    let cancelled = false;
    fetch(`${IMAGES_API_URL}?t=${Date.now()}`)
      .then(res => res.ok ? res.json() : [])
      .then(files => {
        if (cancelled || !Array.isArray(files)) return;
        const map = {};
        files
          .filter(f => /\.(jpe?g|png)$/i.test(f.name))
          .forEach(f => {
            map[f.name.replace(/\.(jpe?g|png)$/i, "").toLowerCase()] = f.download_url;
          });
        setOwnPictureMap(map);
      })
      .catch(err => console.error("Failed to fetch GitHub images:", err));
    return () => { cancelled = true; };
  }, [pictureMapProp]);

  const pictureMap = pictureMapProp && Object.keys(pictureMapProp).length > 0
    ? pictureMapProp
    : ownPictureMap;
  // SINGLE useEffect to load all initial data
  useEffect(() => {
    if (initialLineup) {
      const migratedA = migrateLineupData(initialLineup.teamA);
      const migratedB = migrateLineupData(initialLineup.teamB);
      
      setTeamAFormation(migratedA.formation);
      setTeamBFormation(migratedB.formation);
      setTeamAPlayers(migratedA.players);
      setTeamBPlayers(migratedB.players);
      setTeamASubs(migratedA.subs || [null, null]);
      setTeamBSubs(migratedB.subs || [null, null]);
    }
  }, [initialLineup]);
  // ── Team average rating (players + subs, null-safe) ──
const calcTeamAvg = (players, subs) => {
  const all = [...(players || []), ...(subs || [])];
  const ratings = all
    .filter(p => p && p.rating != null && !isNaN(parseFloat(p.rating)))
    .map(p => parseFloat(p.rating));
  if (ratings.length === 0) return null;
  return (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1);
};

const avgA = calcTeamAvg(teamAPlayers, teamASubs);
const avgB = calcTeamAvg(teamBPlayers, teamBSubs);

// Same color logic as the pitch avg badges — uses parent's getRatingColor if given
const getAvgColor = (avg) => {
  if (getRatingColor) return getRatingColor(avg);
  const r = parseFloat(avg);
  if (isNaN(r)) return '#9e9e9e';
  if (r >= 9.0) return '#2563eb';
  if (r >= 7.0) return '#16a34a';
  if (r >= 5.0) return '#ea580c';
  return '#dc2626';
};
  const getSlotPosition = (pos, team) => {
    if (!isVertical) {
      return { 
        left: `${team === "A" ? pos.x : 100 - pos.x}%`, 
        top: `${team === "A" ? pos.y : 100 - pos.y}%` 
      };
    } else {
      return { 
        left: `${team === "A" ? pos.y : 100 - pos.y}%`, 
        top: `${team === "A" ? 100 - pos.x : pos.x}%`   
      };
    }
  };

  const handleSlotClick = (team, idx, currentPlayer) => {
    if (editMode && onSlotClick) {
      onSlotClick(team, idx, currentPlayer);
    }
  };

  // Render Substitute Slots
  const renderSubSlot = (team, subIdx) => {
    const subsArr = team === "A" ? teamASubs : teamBSubs;
    const player = subsArr[subIdx];

    return (
      <div
        key={`${team}-sub-${subIdx}`}
        className={`sub-slot ${player ? "filled" : "empty"} ${editMode ? 'editable' : ''}`}
        onClick={() => handleSlotClick(team, `sub${subIdx}`, player)}
      >
        {player ? (
          <div className={`slot-card ${player.isMotm ? 'motm' : ''}`}>

            {player.isMotm && <div className="motm-badge">MOTM</div>}
            
            <div 
              className="card-rating-badge" 
              style={{ backgroundColor: getRatingColor ? getRatingColor(player.rating) : '#9e9e9e' }}
            >
              {player.rating != null ? parseFloat(player.rating).toFixed(1) : '—'}
            </div>

                        <div className="player-icon-wrapper">
              <img 
                src={
                  pictureMap?.[player.Contributor?.toLowerCase()]
                  || ""   // nothing found — hide instead of guessing a path
                } 
                alt={player.Contributor}
                style={{ visibility: pictureMap?.[player.Contributor?.toLowerCase()] ? "visible" : "hidden" }}
              />
              
              {/* Assists Icons */}
              {player.assists > 0 && (
                <div className="stat-badge assists">
                  {[...Array(player.assists)].map((_, i) => (
                    <span key={`sub-assist-${i}`} className="icon">👟</span>
                  ))}
                </div>
              )}
              
              {/* Goals Icons */}
              {player.goals > 0 && (
                <div className="stat-badge goals">
                  {[...Array(player.goals)].map((_, i) => (
                    <span key={`sub-goal-${i}`} className="icon">⚽</span>
                  ))}
                </div>
              )}
            </div>

            <div className="slot-info">
              <span className="slot-name">{player.Contributor}</span>
            </div>
          </div>
        ) : (
          <div className="empty-sub-card">
            <span className="empty-sub-label">SUB {subIdx + 1}</span>
          </div>
        )}
      </div>
    );
  };

  // Render Pitch Slots
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

              {player.isMotm && <div className="motm-badge">MOTM</div>}
              
              {/* 1. Top-Right Rating Badge */}
              <div 
                className="card-rating-badge" 
                style={{ backgroundColor: getRatingColor ? getRatingColor(player.rating) : '#9e9e9e' }}
              >
                {player.rating != null ? parseFloat(player.rating).toFixed(1) : '—'}
              </div>

              {/* 2. Icon Wrapper (Holds Image + Stats) */}
                            {/* 2. Icon Wrapper (Holds Image + Stats) */}
              <div className="player-icon-wrapper">
                <img 
                  src={
                    pictureMap?.[player.Contributor?.toLowerCase()]
                    || ""   // nothing found — hide instead of guessing a path
                  } 
                  alt={player.Contributor}
                  style={{ visibility: pictureMap?.[player.Contributor?.toLowerCase()] ? "visible" : "hidden" }}
                />
                
                {/* Bottom-Left: Assists Icons */}
                {player.assists > 0 && (
                  <div className="stat-badge assists">
                    {[...Array(player.assists)].map((_, i) => (
                      <span key={`pitch-assist-${i}`} className="icon">👟</span>
                    ))}
                  </div>
                )}
                
                {/* Bottom-Right: Goals Icons */}
                {player.goals > 0 && (
                  <div className="stat-badge goals">
                    {[...Array(player.goals)].map((_, i) => (
                      <span key={`pitch-goal-${i}`} className="icon">⚽</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="slot-info">
                <span className="slot-name">{player.Contributor}</span>
              </div>
            </div>
          ) : (
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

  // Updated to include subs so they don't get wiped when changing formations
  const handleFormationChange = (team, newFormation) => {
    if (team === "A") {
      setTeamAFormation(newFormation);
      onLineupChange && onLineupChange({ 
        teamA: { formation: newFormation, players: teamAPlayers, subs: teamASubs }, 
        teamB: { formation: teamBFormation, players: teamBPlayers, subs: teamBSubs } 
      });
    } else {
      setTeamBFormation(newFormation);
      onLineupChange && onLineupChange({ 
        teamA: { formation: teamAFormation, players: teamAPlayers, subs: teamASubs }, 
        teamB: { formation: newFormation, players: teamBPlayers, subs: teamBSubs } 
      });
    }
  };

    return (
    <div className={`match-lineup-container ${isVertical ? "layout-vertical" : "layout-horizontal"}`}>
      <div className="lineup-content">
        <div className="pitch-and-controls">

          {/* THE PITCH */}
                    {/* THE PITCH */}
          <div className={`pitch-wrapper ${isVertical ? "vertical" : ""}`}>
            
            {/* ✅ CORNER LABELS (Inside the pitch) */}
            {/* ✅ CORNER LABELS with live average rating */}
            <div className="team-label team-b-label">
              Team B
              {avgB && <span className="team-avg" style={{ color: getAvgColor(avgB) }}>{avgB}</span>}
            </div>
            <div className="team-label team-a-label">
              Team A
              {avgA && <span className="team-avg" style={{ color: getAvgColor(avgA) }}>{avgA}</span>}
            </div>

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


          {/* === SUBSTITUTES BENCH (Added Below Pitch) === */}
          <div className="subs-container">
            <div className="subs-team">
              <h4 className="subs-label">Team A Subs</h4>
              <div className="subs-row">
                {renderSubSlot("A", 0)}
                {renderSubSlot("A", 1)}
              </div>
            </div>
            <div className="subs-team">
              <h4 className="subs-label">Team B Subs</h4>
              <div className="subs-row">
                {renderSubSlot("B", 0)}
                {renderSubSlot("B", 1)}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MatchLineup;