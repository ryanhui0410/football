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

    // Add this state at the top of ModifyDashboard
  const [reportEditMode, setReportEditMode] = useState(false);
  // ✅ ADD THIS: Update matchReport state when lineup changes
  const handleLineupChange = (newLineup) => {
    setMatchReport(prev => ({
      ...prev,
      teamA: newLineup.teamA,
      teamB: newLineup.teamB,
    }));
  };
  // Update fetchAndOpenReport to accept editMode flag
  const fetchAndOpenReport = async (editMode = false) => {
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
        setMatchStatsData(stats);
        setReportEditMode(editMode); // ✅ Store edit mode
      } else {
        // If no report exists yet and user wants to edit, create empty template
        if (editMode) {
          setMatchReport({
            date: targetDate,
            location: targetLocation,
            time: targetTime,
            teamA: { formation: "4-4-2", players: {} },
            teamB: { formation: "4-4-2", players: {} }
          });
          setMatchStatsData(stats);
          setReportEditMode(true);
        } else {
          alert(`No tactical report found.`);
        }
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
              <button className="choice-btn report" onClick={() => fetchAndOpenReport()}>
                ⚽ <span>View Match Report</span>
              </button>
              {/* ✅ NEW EDIT BUTTON */}
              <button 
                className="choice-btn edit-report" 
                onClick={() => {
                  // Navigate to edit mode or set state to open editable lineup
                  // For now, we'll reuse the report overlay but in edit mode
                  fetchAndOpenReport(true); // Pass true for editMode
                }}
              >
                ✏️ <span>Edit Match Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE OVERLAY */}
            {/* VIEW/EDIT MODE OVERLAY */}
      {matchReport && (
        <div className="report-overlay" onClick={() => { setMatchReport(null); setReportEditMode(false); }}>
          <div className="report-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '25px' }}>
            <button className="report-close" onClick={() => { setMatchReport(null); setReportEditMode(false); }}>✕</button>
            <h2 className="report-title">
              {reportEditMode ? '✏️ Edit Match Report' : '⚽ Match Report'}: {matchReport.date}
            </h2>
            {matchReport.location && <p className="report-meta">📍 {matchReport.location} {matchReport.time && `• 🕒 ${matchReport.time}`}</p>}

            {/* SMART RESULT HEADER (only in view mode) */}
            {!reportEditMode && (() => {
              // ... existing smart result header code stays the same ...
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

            {/* TACTICAL PITCH LINEUP */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#444' }}>
                {reportEditMode ? 'Edit Lineup & Ratings' : 'Tactical Lineup'}
              </h3>
              <MatchLineup
                  matchData={{ Date: matchReport.date, Location: matchReport.location, Time: matchReport.time }}
                  initialLineup={matchReport}
                  readOnly={!reportEditMode}
                  editMode={reportEditMode}
                  layout="horizontal"
                  getRatingColor={getRatingColor}
                  onLineupChange={handleLineupChange}   // ✅ ADD THIS LINE
                  availablePlayers={reportEditMode ? contributors.flatMap(c => c.matches.map(m => ({ Contributor: c.name, position: m.position }))) : []}
                  getPlayerMatchStats={getPlayerMatchStats}
                />
            </div>

            {/* ✅ SAVE BUTTON (only in edit mode) */}
            {reportEditMode && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                  className="md-edit-btn" 
                  style={{ padding: '12px 32px', fontSize: '16px' }}
                  onClick={async () => {
                    try {
                      await fetch("http://localhost:5000/match-lineups", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(matchReport)
                      });
                      alert("✅ Match report saved!");
                      setReportEditMode(false);
                      setMatchReport(null);
                      onSave(); // Refresh parent data
                    } catch (err) {
                      alert("❌ Failed to save");
                    }
                  }}
                >
                  💾 Save Match Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModifyDashboard;