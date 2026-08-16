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
  const [matchStatsData, setMatchStatsData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [slotToEdit, setSlotToEdit] = useState(null);
  const [editedLineup, setEditedLineup] = useState(null);
  const [lineupVersion, setLineupVersion] = useState(0);
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

  const getRatingColor = (rating) => {
    const r = parseFloat(rating);
    if (isNaN(r)) return '#9e9e9e';
    if (r >= 9.0) return '#2563eb';
    if (r >= 7.0) return '#16a34a';
    if (r >= 5.0) return '#ea580c';
    return '#dc2626';
  };

  const getRatingBgColor = (rating) => {
    const r = parseFloat(rating);
    if (isNaN(r)) return '#e2e8f0';
    if (r > 9) return '#3b82f6';
    if (r >= 7) return '#22c55e';
    if (r >= 5) return '#eab308';
    return '#ef4444';
  };

  const splitSymbols = (symbolStr) => {
    if (!symbolStr) return [];
    const chars = [...symbolStr];
    const rows = [];
    const chunkSize = 5;
    for (let i = 0; i < chars.length; i += chunkSize) {
      rows.push(chars.slice(i, i + chunkSize));
    }
    return rows;
  };

  const calcTeamAverage = (teamObj) => {
    if (!teamObj?.players) return null;
    const ratings = Object.values(teamObj.players)
      .map(p => parseFloat(p.rating))
      .filter(r => !isNaN(r));
    if (ratings.length === 0) return null;
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
  };

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

    const enrichLineupWithMotm = (lineup) => {
    if (!lineup || !matchStatsData.length) return lineup;
    const enriched = JSON.parse(JSON.stringify(lineup));
    ['teamA', 'teamB'].forEach(team => {
      if (!enriched[team]?.players) return;
      
      // NEW ARRAY LOGIC
      if (Array.isArray(enriched[team].players)) {
        enriched[team].players = enriched[team].players.map(player => {
          if (!player) return null;
          const stat = getPlayerMatchStats(
            player.Contributor,
            enriched.date,
            enriched.location,
            enriched.time
          );
          return {
            ...player,
            isMotm: stat?.["Man of the Match"] === true,
            goals: parseInt(stat?.Goal) || 0,
            assists: parseInt(stat?.Assist) || 0,
          };
        });
      } else {
        // Fallback for old object format just in case
        Object.keys(enriched[team].players).forEach(slotId => {
          const player = enriched[team].players[slotId];
          const stat = getPlayerMatchStats(player.Contributor, enriched.date, enriched.location, enriched.time);
          player.isMotm = stat?.["Man of the Match"] === true;
          player.goals = parseInt(stat?.Goal) || 0;
          player.assists = parseInt(stat?.Assist) || 0;
        });
      }
    });
    return enriched;
  };

    const fetchAndOpenReport = async (isEditMode = false) => {
    try {
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
        setEditedLineup(JSON.parse(JSON.stringify(found)));
        setMatchStatsData(stats);
        setIsEditingReport(isEditMode);
        setLineupVersion(v => v + 1);
        
        // Fetch player cards if entering edit mode
        if (isEditMode && availablePlayers.length === 0) {
          const pRes = await fetch("http://localhost:5000/player-attributes");
          const pData = await pRes.json();
          setAvailablePlayers(Array.isArray(pData) ? pData : []);
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

    const handleSaveReportLineup = async () => {
    if (!editedLineup) return;

    // ✨ Same sanitization logic
    const sanitizeTeam = (teamObj) => {
      if (!teamObj) return { formation: "4-4-2", players: Array(11).fill(null) };
      const cleanPlayers = (teamObj.players || []).map(p => {
        if (!p) return null;
        return {
          Contributor: p.Contributor,
          rating: parseFloat(p.rating) || 0,
          picture: p.picture || `/${p.Contributor}.jpeg`
        };
      });
      while (cleanPlayers.length < 11) cleanPlayers.push(null);
      return { formation: teamObj.formation || "4-4-2", players: cleanPlayers.slice(0, 11) };
    };

    const payload = {
      date: editedLineup.date,
      location: editedLineup.location,
      time: editedLineup.time,
      teamA: sanitizeTeam(editedLineup.teamA),
      teamB: sanitizeTeam(editedLineup.teamB),
    };

    try {
      const res = await fetch("http://localhost:5000/match-lineups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      console.log("📥 Server response:", result);
      alert("✅ Match Report saved!");
      
      setIsEditingReport(false);
      setMatchReport(JSON.parse(JSON.stringify({ ...editedLineup, teamA: payload.teamA, teamB: payload.teamB }))); 
      setLineupVersion(v => v + 1); 
    } catch (err) {
      console.error("Save failed:", err);
      alert("❌ Failed to save match report");
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
                  <th className="md-th md-th-date">Date & Location</th>
                  <th className="md-th md-th-result center">Match Result</th>
                  <th className="md-th md-th-contrib center">Contributions</th>
                  <th className="md-th md-th-stats center">Goals / Assists</th>
                  <th className="md-th md-th-rating center">Rating</th>
                  <th className="md-th md-th-action center">Action</th>
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
                        <div className={`md-result-box ${match.winLoss ? match.winLoss.toLowerCase() : ''}`}>
                          <div className="md-score">{match.matchResult || "—"}</div>
                          {match.winLoss && <div className={`md-outcome ${match.winLoss.toLowerCase()}`}>{match.winLoss}</div>}
                        </div>
                      </td>
                      <td className="md-td center" data-label="Contributions">
                        {match.symbol ? (
                          <div className="md-symbols-wrapper">
                            {splitSymbols(match.symbol).map((row, rowIdx) => (
                              <div key={rowIdx} className="md-symbols-row">
                                {row.map((ch, idx) => (
                                  <span key={idx} className="md-symbol-icon">{ch}</span>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="md-symbols empty">No symbols</span>
                        )}
                      </td>
                      <td className="md-td center" data-label="Goals / Assists">
                        <div className="md-stat-box">
                          <div className="md-stat"><div className="md-stat-val">{goals}</div><div className="md-stat-label">Goals</div></div>
                          <div className="md-stat"><div className="md-stat-val">{match.assist || 0}</div><div className="md-stat-label">Assists</div></div>
                        </div>
                      </td>
                      <td className="md-td center" data-label="Rating">
                        {match.manOfTheMatch ? (
                          <span className="md-rating-motm-wrapper">
                            <span 
                              className="md-rating md-rating-motm" 
                              style={{ backgroundColor: getRatingBgColor(match.rating) }}
                            >
                              {match.rating || "—"}
                            </span>
                          </span>
                        ) : (
                          <span 
                            className="md-rating" 
                            style={{ backgroundColor: getRatingBgColor(match.rating) }}
                          >
                            {match.rating || "—"}
                          </span>
                        )}
                      </td>
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

      {/* VIEW MATCH REPORT OVERLAY (Read-only) */}
      {matchReport && (
        <div className="report-overlay" onClick={() => { setMatchReport(null); }}>
          <div className="report-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '25px' }}>
            <button className="report-close" onClick={() => { setMatchReport(null); }}>✕</button>
            <h2 className="report-title">⚽ Match Report: {matchReport.date}</h2>
            {matchReport.location && <p className="report-meta">📍 {matchReport.location} {matchReport.time && `• 🕒 ${matchReport.time}`}</p>}

            {/* SMART RESULT HEADER */}
            {(() => {
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
              let leftLabel = 'Team A', rightLabel = 'Team B';
              let leftAvg = avgA, rightAvg = avgB;
              let leftColor = getRatingColor(avgA), rightColor = getRatingColor(avgB);
              if (matchResult) {
                const parts = matchResult.split('-').map(s => parseInt(s.trim(), 10));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  if (parts[0] >= parts[1]) {
                    leftLabel = 'Team A'; leftAvg = avgA; leftColor = getRatingColor(avgA);
                    rightLabel = 'Team B'; rightAvg = avgB; rightColor = getRatingColor(avgB);
                  } else {
                    leftLabel = 'Team B'; leftAvg = avgB; leftColor = getRatingColor(avgB);
                    rightLabel = 'Team A'; rightAvg = avgA; rightColor = getRatingColor(avgA);
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

            {/* TACTICAL PITCH LINEUP (Read-only / Editable) */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#444' }}>
                {isEditingReport ? "✏️ Edit Tactical Lineup" : "Tactical Lineup"}
              </h3>
              <MatchLineup
                key={`lineup-${isEditingReport ? 'edit' : 'view'}-${lineupVersion}`}
                matchData={{ Date: matchReport.date, Location: matchReport.location, Time: matchReport.time }}
                initialLineup={enrichLineupWithMotm(isEditingReport ? editedLineup : matchReport)}
                readOnly={!isEditingReport}
                editMode={isEditingReport}
                layout="horizontal"
                availablePlayers={availablePlayers}
                getRatingColor={getRatingColor}
                getPlayerMatchStats={getPlayerMatchStats}
                onLineupChange={(newLineup) => {
                  setEditedLineup(prev => ({ ...prev, ...newLineup }));
                }}
                onSlotClick={(team, idx, player) => {
                  setSlotToEdit({ team, idx, player });
                }}
              />

              {isEditingReport && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => { setIsEditingReport(false); setEditedLineup(null); setLineupVersion(v => v + 1); }}
                    style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveReportLineup}
                    style={{ 
                      padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', 
                      borderRadius: '6px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                    }}
                  >
                    💾 Save Lineup
                  </button>
                </div>
              )}
            </div>
                  {/* SLOT EDIT MODAL */}
      {slotToEdit && (
        <div className="slot-edit-overlay" onClick={() => setSlotToEdit(null)}>
          <div className="slot-edit-modal" onClick={e => e.stopPropagation()}>
            <button className="slot-edit-close" onClick={() => setSlotToEdit(null)}>✕</button>
            <h3>{slotToEdit.player ? "Edit Player" : "Add Player"}</h3>
            
                        <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>Select Player:</label>
              <select 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
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
                        rating: prev.player?.rating !== undefined ? prev.player.rating : "" // FIX: Changed from 50 to ""
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
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>Match Rating (0-10.0):</label>
                <input 
                  type="number" min="0" max="10" step="0.1"
                  value={slotToEdit.player.rating !== "" && slotToEdit.player.rating !== undefined ? slotToEdit.player.rating : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSlotToEdit(prev => ({
                      ...prev,
                      player: { ...prev.player, rating: val === "" ? "" : parseFloat(val) }
                    }));
                  }}
                />
              </div>
            )}
            
            {slotToEdit.player && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>Match Rating (1-99):</label>
                <input 
                  type="number" min="0" max="10" step="0.1"
                  value={slotToEdit.player.rating !== "" && slotToEdit.player.rating !== undefined ? slotToEdit.player.rating : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSlotToEdit(prev => ({
                      ...prev,
                      player: { ...prev.player, rating: val === "" ? "" : parseFloat(val) }
                    }));
                  }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSlotToEdit(null)} style={{ padding: '10px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => {
                const { team, idx, player } = slotToEdit;
                const teamKey = team === 'A' ? 'teamA' : 'teamB';
                setEditedLineup(prev => {
                  const newLineup = JSON.parse(JSON.stringify(prev));
                  if (!Array.isArray(newLineup[teamKey].players)) {
                    newLineup[teamKey].players = Array(11).fill(null);
                  }
                  newLineup[teamKey].players[idx] = player;
                  return newLineup;
                });
                setLineupVersion(v => v + 1); // Refresh the pitch visually
                setSlotToEdit(null);
              }} style={{ padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                Save to Pitch
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModifyDashboard;