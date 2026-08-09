import React, { useState, useEffect } from "react";
import EditMatchModal from "./EditMatchModal";
import HeadToHeadCompare from "./HeadToHeadCompare"; 
import MatchStatsModal from "./MatchStatsModal"; 
import "./ModifyDashboard.css";
import MatchLineup from "./MatchLineup"; // Import the pitch component

function ModifyDashboard({ contributors, onSave }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [compareMenu, setCompareMenu] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);
  const [choiceMatch, setChoiceMatch] = useState(null); // Holds { index, date, name }
  const [matchReport, setMatchReport] = useState(null); // Holds the fetched lineup data
  // NEW: Filter State
  const [activeFilter, setActiveFilter] = useState("All");

  // Get unique contributor names for the filter pills
  const contributorNames = ["All", ...contributors.map(c => c.name)];

  // Filter contributors based on activeFilter
  const filteredContributors = activeFilter === "All" 
    ? contributors 
    : contributors.filter(c => c.name === activeFilter);

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
          m.date === currentMatch.date && 
          m.location === currentMatch.location && 
          m.time === currentMatch.time
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
    // Helper to normalize dates for matching (Converts "8/9/2026" and "2026-08-09" to "2026-08-09")
  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.length === 10 && dateStr.includes("-")) return dateStr; // Already YYYY-MM-DD
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
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

  // Helper to parse dates safely for sorting (handles M/D/YYYY format reliably)
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // parts[0] = Month, parts[1] = Day, parts[2] = Year
      return new Date(parts[2], parts[0] - 1, parts[1]); 
    }
    return new Date(dateStr);
  };

  return (
    <div className="md-wrap">
      {/* NEW: Attractive Filter UI */}
      <div className="md-filter-bar">
        <span className="md-filter-label">Filter by Player:</span>
        <div className="md-filter-pills">
          {contributorNames.map(name => (
            <button
              key={name}
              className={`md-pill ${activeFilter === name ? 'active' : ''}`}
              onClick={() => setActiveFilter(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {filteredContributors.map((contributor) => {
        // NEW: Sort matches by newest date descending
        const sortedMatches = [...contributor.matches].sort((a, b) => 
          parseDate(b.date) - parseDate(a.date)
        );

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
                    <tr 
                      key={idx} 
                      className="md-row" 
                      onClick={() => setChoiceMatch({ match: match, name: contributor.name })} // ✅ NEW
                    >
                      <td className="md-td" data-label="Date & Location">
                        <div className="md-date">{match.date}</div>
                        <div className="md-location">📍 {match.location || "Unknown"}</div>
                      </td>
                      
                      <td className="md-td center" data-label="Match Result">
                        <div className="md-result-box">
                          <div className="md-score">{match.matchResult || "—"}</div>
                          {match.winLoss && (
                            <div className={`md-outcome ${match.winLoss.toLowerCase()}`}>
                              {match.winLoss}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="md-td center" data-label="Contributions">
                        <div className={`md-symbols ${!match.symbol ? 'empty' : ''}`}>
                          {match.symbol || "No symbols"}
                        </div>
                      </td>
                      <td className="md-td center" data-label="Goals / Assists">
                        <div className="md-stat-box">
                          <div className="md-stat">
                            <div className="md-stat-val">{goals}</div>
                            <div className="md-stat-label">Goals</div>
                          </div>
                          <div className="md-stat">
                            <div className="md-stat-val">{match.assist || 0}</div>
                            <div className="md-stat-label">Assists</div>
                          </div>
                        </div>
                      </td>
                      <td className="md-td center" data-label="Rating">
                        <span className="md-rating">{match.rating || "—"}</span>
                      </td>
                      <td className="md-td center" data-label="Action">
                        <div className="md-action-btns">
                          <button className="md-edit-btn" onClick={(e) => { e.stopPropagation(); openModal(match, contributor.name); }}>
                            Edit
                          </button>
                          {sameMatchPlayers.length > 0 && (
                            <button className="md-compare-btn" title="Compare" onClick={(e) => handleCompareClick(e, match, contributor.name)}>
                              ⚔️
                            </button>
                          )}
                          {compareMenu && compareMenu.match === match && compareMenu.contributorName === contributor.name && (
                            <div className="md-compare-dropdown" onClick={(e) => e.stopPropagation()}>
                              {compareMenu.players.map((p, pIdx) => (
                                <div key={pIdx} className="md-compare-option" onClick={(e) => { e.stopPropagation(); selectCompareTarget(p); }}>
                                  vs {p.name}
                                </div>
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
            {/* 1. THE CHOICE MODAL */}
      {choiceMatch && !matchReport && (
        <div className="choice-overlay" onClick={() => setChoiceMatch(null)}>
          <div className="choice-modal" onClick={e => e.stopPropagation()}>
            <button className="choice-close" onClick={() => setChoiceMatch(null)}>✕</button>
            <h3>Match on {choiceMatch.match.date}</h3>
            <p className="choice-subtitle">What would you like to view for <strong>{choiceMatch.name}</strong>?</p>
            
            <div className="choice-buttons">
              {/* ✅ CHANGED: Now opens MatchStatsModal instead of EditMatchModal */}
              <button className="choice-btn stats" onClick={() => {
                openStatsModal(choiceMatch.match, choiceMatch.name); 
                setChoiceMatch(null);
              }}>
                📊 <span>View Individual Stats</span>
              </button>
              
                            <button className="choice-btn report" onClick={async () => {
                try {
                  const res = await fetch("http://localhost:5000/match-lineups");
                  const lineups = await res.json();
                  
                  // 1. Normalize the date and TRIM the location to remove hidden spaces
                  const targetDate = normalizeDate(choiceMatch.match.date);
                  const targetLocation = (choiceMatch.match.location || "").trim();
                  
                  // 🕵️ DEBUG: Open your browser console (F12) to see exactly what is being compared!
                  console.log("🔍 Searching for -> Date:", targetDate, "| Location:", targetLocation);
                  console.log("📂 Available Lineups in DB:", lineups.map(l => ({ 
                      date: normalizeDate(l.date), 
                      location: (l.location || "").trim() 
                  })));

                  // 2. Find the match using trimmed locations
                  const found = lineups.find(l => 
                    normalizeDate(l.date) === targetDate && 
                    (l.location || "").trim() === targetLocation
                  );

                  if (found) {
                    setMatchReport(found);
                  } else {
                    alert(`No tactical report found.\n\nCheck the browser console (F12) to see the exact Date and Location strings being compared. There might be a hidden space or typo!`);
                    setChoiceMatch(null);
                  }
                } catch (err) {
                  console.error("Fetch error:", err);
                  alert("Failed to fetch match report.");
                }
              }}>
                ⚽ <span>View Match Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. THE MATCH REPORT VIEWER */}
      {matchReport && (
        <div className="report-overlay" onClick={() => setMatchReport(null)}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <button className="report-close" onClick={() => setMatchReport(null)}>✕</button>
            <h2 className="report-title">⚽ Match Report: {matchReport.date}</h2>
            {matchReport.location && <p className="report-meta">📍 {matchReport.location} {matchReport.time && `• 🕒 ${matchReport.time}`}</p>}
            
            <MatchLineup 
              matchData={{ Date: matchReport.date }} 
              initialLineup={matchReport} 
              readOnly={true} 
              layout="horizontal" 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ModifyDashboard;