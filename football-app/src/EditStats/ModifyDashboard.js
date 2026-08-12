import React, { useState, useEffect } from "react";
import EditMatchModal from "./EditMatchModal";
import HeadToHeadCompare from "./HeadToHeadCompare"; 
import MatchStatsModal from "./MatchStatsModal"; 
import "./ModifyDashboard.css";
import MatchLineup from "./MatchLineup"; 

function ModifyDashboard({ contributors, onSave }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [compareMenu, setCompareMenu] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);
  const [choiceMatch, setChoiceMatch] = useState(null); 
  const [matchReport, setMatchReport] = useState(null); 
  const [isEditingReport, setIsEditingReport] = useState(false); 
  
  const [editedLineup, setEditedLineup] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null); 
  const [matchStatsData, setMatchStatsData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const contributorNames = ["All", ...contributors.map(c => c.name)];
  const filteredContributors = activeFilter === "All" ? contributors : contributors.filter(c => c.name === activeFilter);

  const openModal = (match, contributorName) => setSelectedMatch({ ...match, contributorName });
  const openStatsModal = (match, contributorName) => {
    setSelectedStats({ ...match, contributorName });
    setStatsModalOpen(true);
  };

  const closeModal = () => setSelectedMatch(null);
  const closeCompare = () => setCompareData(null);

  useEffect(() => {
    const handleClickOutside = () => setCompareMenu(null);
    if (compareMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [compareMenu]);

  const getSameMatchPlayers = (currentMatch, currentContributorName) => {
    const players = [];
    contributors.forEach(contrib => {
      if (contrib.name !== currentContributorName) {
        const matchingMatch = contrib.matches.find(m => 
          m.date === currentMatch.date && m.location === currentMatch.location && m.time === currentMatch.time
        );
        if (matchingMatch) players.push({ name: contrib.name, match: matchingMatch });
      }
    });
    return players;
  };

  const handleCompareClick = (e, currentMatch, currentContributorName) => {
    e.stopPropagation();
    const players = getSameMatchPlayers(currentMatch, currentContributorName);
    if (players.length === 1) {
      setCompareData({
        contributor1: currentContributorName, match1: currentMatch,
        contributor2: players[0].name, match2: players[0].match
      });
    } else if (players.length > 1) {
      setCompareMenu({ match: currentMatch, contributorName: currentContributorName, players });
    } else {
      alert("No other contributors found for this exact match.");
    }
  };

  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.length === 10 && dateStr.includes("-")) return dateStr;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    return dateStr;
  };

  const selectCompareTarget = (target) => {
    setCompareData({
      contributor1: compareMenu.contributorName, match1: compareMenu.match,
      contributor2: target.name, match2: target.match
    });
    setCompareMenu(null);
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parts[2], parts[0] - 1, parts[1]); 
    return new Date(dateStr);
  };

  // --- REPLACE the existing getRatingColor with this ---
  const getRatingColor = (rating) => {
    const r = parseFloat(rating);
    if (isNaN(r)) return '#9e9e9e';
    if (r >= 9.0) return '#2563eb'; // Blue
    if (r >= 7.0) return '#16a34a'; // Green
    if (r >= 5.0) return '#ea580c'; // Orange
    return '#dc2626';               // Red
  };

  // --- ADD this helper above the return statement ---
  const calcTeamAverage = (teamObj) => {
    if (!teamObj?.players) return null;
    const ratings = Object.values(teamObj.players)
      .map(p => parseFloat(p.rating))
      .filter(r => !isNaN(r));
    if (ratings.length === 0) return null;
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
  };

  // --- EDIT MODE LOGIC ---
  const getRemainingPlayers = () => {
    if (!editedLineup) return contributors;
    const assignedPlayers = new Set();
    ['teamA', 'teamB'].forEach(team => {
      if (editedLineup[team]?.players) {
        Object.values(editedLineup[team].players).forEach(p => {
          if (p.Contributor) assignedPlayers.add(p.Contributor);
        });
      }
    });
    return contributors.filter(c => !assignedPlayers.has(c.name));
  };

  const handleAssignPlayer = (player) => {
    if (!assignTarget) return;
    const { posKey, team } = assignTarget;
    const newLineup = JSON.parse(JSON.stringify(editedLineup));
    
    if (!newLineup[team].players) newLineup[team].players = {};
    
    newLineup[team].players[posKey] = {
      ...newLineup[team].players[posKey],
      Contributor: player.name,
      rating: newLineup[team].players[posKey]?.rating || 5.0,
      position: newLineup[team].players[posKey]?.position || posKey,
      picture: player.picture || ""
    };
    
    setEditedLineup(newLineup);
    setAssignTarget(null);
  };

  const handleRemovePlayer = (posKey, team) => {
    const newLineup = JSON.parse(JSON.stringify(editedLineup));
    if (newLineup[team]?.players?.[posKey]) {
      delete newLineup[team].players[posKey];
      setEditedLineup(newLineup);
    }
  };

  const handleRatingChange = (posKey, team, newRating) => {
    const newLineup = JSON.parse(JSON.stringify(editedLineup));
    if (newLineup[team]?.players?.[posKey]) {
      newLineup[team].players[posKey].rating = parseFloat(newRating) || 0;
      setEditedLineup(newLineup);
    }
  };

  const handleSaveEditedReport = async () => {
  try {
    const res = await fetch(`http://localhost:5000/match-lineups`, {
      method: 'POST',  // ← Changed from 'PUT' to 'POST'
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editedLineup)
    });
    
    if (res.ok) {
      alert("Match report saved successfully!");
      setIsEditingReport(false);
      setMatchReport(null);
      setEditedLineup(null);
    } else {
      alert("Failed to save match report.");
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("Error saving match report.");
  }
};
  // ADD this helper function inside ModifyDashboard
  const getPlayerMatchStats = (playerName, matchDate, matchLocation, matchTime) => {
    if (!playerName || !matchStatsData.length) return null;
    const normDate = normalizeDate(matchDate);
    return matchStatsData.find(s =>
      (s.Contributor || "").trim().toLowerCase() === playerName.trim().toLowerCase() &&
      normalizeDate(s.Date) === normDate &&
      (s.Location || "").trim().toLowerCase() === (matchLocation || "").trim().toLowerCase() &&
      (s.Time || "").trim().toLowerCase() === (matchTime || "").trim().toLowerCase()
    ) || null;
  };
  const fetchAndOpenReport = async (editMode = false) => {
  try {
    // ✅ Fetch BOTH lineups and stats in parallel
    const [lineupsRes, statsRes] = await Promise.all([
      fetch("http://localhost:5000/match-lineups"),
      fetch("http://localhost:5000/stats")
    ]);
    const lineups = await lineupsRes.json();
    const stats = await statsRes.json();

    const targetDate = normalizeDate(choiceMatch.match.date);
    const targetLocation = (choiceMatch.match.location || "").trim();
    const targetTime = (choiceMatch.match.time || "").trim();

    const found = lineups.find(l =>
      normalizeDate(l.date) === targetDate &&
      (l.location || "").trim() === targetLocation &&
      (l.time || "").trim() === targetTime
    );

    if (found) {
      setMatchReport(found);
      setMatchStatsData(stats); // ✅ Store stats for symbol lookup
      if (editMode) {
        setEditedLineup(JSON.parse(JSON.stringify(found)));
        setIsEditingReport(true);
      }
    } else {
      alert(`No tactical report found.`);
    }
    setChoiceMatch(null);
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Failed to fetch match report.");
  }
};

  return (
    <div className="md-wrap">
      <div className="md-filter-bar">
        <span className="md-filter-label">Filter by Player:</span>
        <div className="md-filter-pills">
          {contributorNames.map(name => (
            <button key={name} className={`md-pill ${activeFilter === name ? 'active' : ''}`} onClick={() => setActiveFilter(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {filteredContributors.map((contributor) => {
        const sortedMatches = [...contributor.matches].sort((a, b) => parseDate(b.date) - parseDate(a.date));
        return (
          <div key={contributor.name} className="md-contributor-section">
            <div className="md-contributor-header">
              <h2 className="md-contributor-name">{contributor.name}</h2>
              <span className="md-match-count">{sortedMatches.length} Matches</span>
            </div>
            <table className="md-table">
              <thead className="md-thead">
                <tr>
                  <th className="md-th">Date & Location</th>
                  <th className="md-th center">Match Result</th>
                  <th className="md-th center">Contributions</th>
                  <th className="md-th center">Goals / Assists</th>
                  <th className="md-th center">Rating</th>
                  <th className="md-th center">Action</th>
                </tr>
              </thead>
              <tbody className="md-tbody">
                {sortedMatches.map((match, idx) => {
                  const goals = Math.max(0, (match.goalContribution || 0) - (match.assist || 0));
                  const sameMatchPlayers = getSameMatchPlayers(match, contributor.name);
                  return (
                    <tr key={idx} className="md-row" onClick={() => setChoiceMatch({ match: match, name: contributor.name })}>
                      <td className="md-td" data-label="Date & Location">
                        <div className="md-date">{match.date}</div>
                        <div className="md-location">📍 {match.location || "Unknown"}</div>
                      </td>
                      <td className="md-td center" data-label="Match Result">
                        <div className="md-result-box">
                          <div className="md-score">{match.matchResult || "—"}</div>
                          {match.winLoss && <div className={`md-outcome ${match.winLoss.toLowerCase()}`}>{match.winLoss}</div>}
                        </div>
                      </td>
                      <td className="md-td center" data-label="Contributions">
                        <div className={`md-symbols ${!match.symbol ? 'empty' : ''}`}>{match.symbol || "No symbols"}</div>
                      </td>
                      <td className="md-td center" data-label="Goals / Assists">
                        <div className="md-stat-box">
                          <div className="md-stat"><div className="md-stat-val">{goals}</div><div className="md-stat-label">Goals</div></div>
                          <div className="md-stat"><div className="md-stat-val">{match.assist || 0}</div><div className="md-stat-label">Assists</div></div>
                        </div>
                      </td>
                      <td className="md-td center" data-label="Rating"><span className="md-rating">{match.rating || "—"}</span></td>
                      <td className="md-td center" data-label="Action">
                        <div className="md-action-btns">
                          <button className="md-edit-btn" onClick={(e) => { e.stopPropagation(); openModal(match, contributor.name); }}>Edit</button>
                          {sameMatchPlayers.length > 0 && (
                            <button className="md-compare-btn" title="Compare" onClick={(e) => handleCompareClick(e, match, contributor.name)}>⚔️</button>
                          )}
                          {compareMenu && compareMenu.match === match && compareMenu.contributorName === contributor.name && (
                            <div className="md-compare-dropdown" onClick={(e) => e.stopPropagation()}>
                              {compareMenu.players.map((p, pIdx) => (
                                <div key={pIdx} className="md-compare-option" onClick={(e) => { e.stopPropagation(); selectCompareTarget(p); }}>vs {p.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {selectedMatch && <EditMatchModal match={selectedMatch} onClose={closeModal} onSave={onSave} />}
      <HeadToHeadCompare open={!!compareData} onClose={closeCompare} compareData={compareData} />
      <MatchStatsModal open={statsModalOpen} match={selectedStats} onClose={() => setStatsModalOpen(false)} />
      
      {/* CHOICE MODAL */}
      {choiceMatch && !matchReport && (
        <div className="choice-overlay" onClick={() => setChoiceMatch(null)}>
          <div className="choice-modal" onClick={e => e.stopPropagation()}>
            <button className="choice-close" onClick={() => setChoiceMatch(null)}>✕</button>
            <h3>Match on {choiceMatch.match.date}</h3>
            <p className="choice-subtitle">What would you like to view for <strong>{choiceMatch.name}</strong>?</p>
            <div className="choice-buttons">
              <button className="choice-btn stats" onClick={() => { openStatsModal(choiceMatch.match, choiceMatch.name); setChoiceMatch(null); }}>
                📊 <span>View Individual Stats</span>
              </button>
              <button className="choice-btn report" onClick={() => fetchAndOpenReport(false)}>
                ⚽ <span>View Match Report</span>
              </button>
              <button className="choice-btn edit-report" onClick={() => fetchAndOpenReport(true)}>
                ✏️ <span>Edit Match Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 VIEW MODE OVERLAY (Stats summary removed, colors passed to Pitch) */}
      {matchReport && !isEditingReport && (
        <div className="report-overlay" onClick={() => setMatchReport(null)}>
          <div className="report-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '25px' }}>
            <button className="report-close" onClick={() => setMatchReport(null)}>✕</button>
            <h2 className="report-title">⚽ Match Report: {matchReport.date}</h2>
            {matchReport.location && <p className="report-meta">📍 {matchReport.location} {matchReport.time && `• 🕒 ${matchReport.time}`}</p>}

            {/* ✅ SMART RESULT HEADER: Score in middle, teams assigned by score */}
            {(() => {
              // Find match result from any player's stats
              const allPlayers = [
                ...Object.values(matchReport.teamA?.players || {}),
                ...Object.values(matchReport.teamB?.players || {})
              ];
              let matchResult = '', winLoss = '';
              for (const p of allPlayers) {
                const stat = getPlayerMatchStats(p.Contributor, matchReport.date, matchReport.location, matchReport.time);
                if (stat && stat["Match result"]) {
                  matchResult = stat["Match result"];
                  winLoss = stat["Win/Loss?"] || '';
                  break;
                }
              }

              const avgA = calcTeamAverage(matchReport.teamA);
              const avgB = calcTeamAverage(matchReport.teamB);

              // Parse scores to determine left/right assignment
              let leftLabel = 'Team A', rightLabel = 'Team B';
              let leftAvg = avgA, rightAvg = avgB;
              let leftColor = getRatingColor(avgA), rightColor = getRatingColor(avgB);
              let leftScore = '', rightScore = '';

              if (matchResult) {
                const parts = matchResult.split('-').map(s => parseInt(s.trim(), 10));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  if (parts[0] >= parts[1]) {
                    // Left side gets the higher/equal score → assign Team A to left
                    leftLabel = 'Team A'; leftAvg = avgA; leftColor = getRatingColor(avgA);
                    rightLabel = 'Team B'; rightAvg = avgB; rightColor = getRatingColor(avgB);
                    leftScore = parts[0]; rightScore = parts[1];
                  } else {
                    // Right side has higher score → swap so higher score is on left
                    leftLabel = 'Team B'; leftAvg = avgB; leftColor = getRatingColor(avgB);
                    rightLabel = 'Team A'; rightAvg = avgA; rightColor = getRatingColor(avgA);
                    leftScore = parts[1]; rightScore = parts[0];
                  }
                }
              }

              return (
                <div className="report-result-header">
                  <div className="result-team-side">
                    <span className="result-team-name">{leftLabel}</span>
                    <span className="result-team-avg" style={{ color: leftColor }}>{leftAvg ?? '—'}</span>
                  </div>
                  <div className="result-score-center">
                    <span className="result-score">{matchResult || '—'}</span>
                    {winLoss && <span className={`result-wl ${winLoss.toLowerCase()}`}>{winLoss}</span>}
                  </div>
                  <div className="result-team-side right">
                    <span className="result-team-name">{rightLabel}</span>
                    <span className="result-team-avg" style={{ color: rightColor }}>{rightAvg ?? '—'}</span>
                  </div>
                </div>
              );
            })()}

            {/* TACTICAL PITCH LINEUP */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#444' }}>Tactical Lineup</h3>
              <MatchLineup
                matchData={{ Date: matchReport.date, Location: matchReport.location, Time: matchReport.time }}
                initialLineup={matchReport}
                readOnly={true}
                layout="horizontal"
                getRatingColor={getRatingColor}
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODE OVERLAY */}
      {matchReport && isEditingReport && editedLineup && (
        <div className="report-overlay" onClick={() => { setIsEditingReport(false); setMatchReport(null); }}>
          <div className="report-modal edit-mode" onClick={e => e.stopPropagation()}>
            <button className="report-close" onClick={() => { setIsEditingReport(false); setMatchReport(null); }}>✕</button>
            <h2 className="report-title">✏️ Edit Match Report: {editedLineup.date}</h2>
            
            <div className="edit-layout">
              <div className="pitch-container">
                <MatchLineup 
                  matchData={{ Date: editedLineup.date }} 
                  initialLineup={editedLineup} 
                  readOnly={false} 
                  layout="horizontal"
                  isEditing={true}
                  onPositionClick={(posKey, team) => setAssignTarget({ posKey, team })}
                  onPlayerRemove={handleRemovePlayer}
                  onRatingChange={handleRatingChange}
                  getRatingColor={getRatingColor} // ⬅️ Passed to Pitch
                />
              </div>
            </div>

            <div className="edit-actions">
              <button className="save-btn" onClick={handleSaveEditedReport}>💾 Save Changes</button>
              <button className="cancel-btn" onClick={() => { setIsEditingReport(false); setMatchReport(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModifyDashboard;