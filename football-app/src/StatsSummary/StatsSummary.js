import React, { useState, useEffect, useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import FormTrendGraph from "./FormTrendGraph";
import StreakTracker from "./StreakTracker";
import "./StatsSummary.css";

ChartJS.register(ArcElement, Tooltip, Legend);

function getSeasonFromDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  let month, year;
  if (parts.length === 3) {
    month = parseInt(parts[0], 10);
    year = parseInt(parts[2], 10);
  } else {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    month = d.getMonth() + 1;
    year = d.getFullYear();
  }
  if (isNaN(month) || isNaN(year)) return "";
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

// ✅ Helper: Normalize names to avoid whitespace/case mismatches
const normalizeName = (name) => (name || "").trim().toLowerCase();
// ✅ Capitalize first letter for display
const prettyName = (name) => {
  if (!name) return "";
  // Improved to handle names like "S Joe" -> "S Joe" instead of "S joe"
  return name.split(' ').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
};

function StatsSummary({ stats }) {
  const [filterSeason, setFilterSeason] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("Ryan");
  const [lineups, setLineups] = useState([]);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    setDebugInfo("⏳ Loading lineups...");
    fetch(`https://football-stats-xbx6.onrender.com/match-lineups?t=${Date.now()}`)
  .then((res) => res.json())
  .then((data) => {
    let arr = [];
    if (Array.isArray(data)) {
      arr = data;
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.lineups)) arr = data.lineups;
      else if (Array.isArray(data.matches)) arr = data.matches;
      else arr = Object.values(data).filter((m) => m && (m.date || m.teamA || m.teamB));
    }
    console.log("lineups raw:", data, "→ parsed:", arr.length, "matches");
    setLineups(arr);
    setDebugInfo(`✅ Loaded ${arr.length} match lineups`);
  })
  }, []);

  const dropdownPlayers = useMemo(() => {
    const names = new Set();
    
    stats.forEach(s => {
      if (s.Contributor) names.add(prettyName(s.Contributor));
    });
    
    lineups.forEach(match => {
      const teams = [match.teamA, match.teamB].filter(Boolean);
      teams.forEach(team => {
        const players = Array.isArray(team.players) ? team.players : Object.values(team.players || {});
        players.forEach(p => {
          if (p && p.Contributor) names.add(prettyName(p.Contributor));
        });
        if (Array.isArray(team.subs)) {
          team.subs.forEach(p => {
            if (p && p.Contributor) names.add(prettyName(p.Contributor));
          });
        }
      });
    });

    return Array.from(names).filter(Boolean).sort();
  }, [stats, lineups]);
  const getLineupTotals = (playerName) => {
  const playerData = lineupStats[normalizeName(playerName)];
  if (!playerData) return null;
  let matches = 0, totalRating = 0;
  Object.entries(playerData).forEach(([season, d]) => {
    if (!filterSeason || season === filterSeason) {
      matches += d.matches;
      totalRating += d.totalRating;
    }
  });
  return {
    matches,
    avgRating: matches > 0 ? totalRating / matches : 0,
  };
};
  const lineupStats = useMemo(() => {
    const map = {};

    lineups.forEach((match) => {
      if (!match || !match.date) return;
      const season = getSeasonFromDate(match.date);
      if (!season) return;

      const teams = [match.teamA, match.teamB].filter(Boolean);

      teams.forEach((team) => {
        const allPlayers = [];
        const players = Array.isArray(team.players) ? team.players : Object.values(team.players || {});
        allPlayers.push(...players);
        
        if (Array.isArray(team.subs)) {
          allPlayers.push(...team.subs);
        }
        
        allPlayers.forEach((player) => {
          if (!player || !player.Contributor) return;

          const name = normalizeName(player.Contributor);
          const rating = parseFloat(player.rating) || 0;

          if (!map[name]) map[name] = {};
          if (!map[name][season]) map[name][season] = { matches: 0, totalRating: 0 };

          map[name][season].matches += 1;
          map[name][season].totalRating += rating;
        });
      });
    });

    Object.keys(map).forEach((name) => {
      Object.keys(map[name]).forEach((season) => {
        const d = map[name][season];
        d.avgRating = d.matches > 0 ? d.totalRating / d.matches : 0;
      });
    });

    return map;
  }, [lineups]);

  const allSeasons = [...new Set(stats.map((s) => getSeasonFromDate(s.Date)).filter(Boolean))].sort();
  const filteredStats = filterSeason
    ? stats.filter((s) => getSeasonFromDate(s.Date) === filterSeason)
    : stats;

  const motmStats = useMemo(() => {
    const map = {};
    stats.forEach((s) => {
      const name = normalizeName(s.Contributor);
      if (!name) return;
      const season = getSeasonFromDate(s.Date);
      if (!season) return;
      if (!map[name]) map[name] = {};
      if (!map[name][season]) map[name][season] = 0;
      if (s["Man of the Match"] === true) {
        map[name][season] += 1;
      }
    });
    return map;
  }, [stats]);

  const getDetailedPlayerStats = (playerName) => {
    // 🐛 FIX 1: Normalize the target playerName so it matches the lowercase keys in stats
    const normalizedTarget = normalizeName(playerName);
    const playerStats = filteredStats.filter((s) => normalizeName(s.Contributor) === normalizedTarget);
    if (playerStats.length === 0) return null;

    const entry = {
      ratings: [], left: 0, right: 0, head: 0, other: 0, assists: 0, errors: 0, wins: 0,
      locationStats: {}, matches: [],
    };

    playerStats.forEach((s) => {
      const rating = parseFloat(s.Rating) || 0;
      const left = parseInt(s["Left Foot"] || 0);
      const right = parseInt(s["Right Foot"] || 0);
      const head = parseInt(s.Head || 0);
      const other = parseInt(s["Other body parts"] || 0);
      const assists = parseInt(s.Assist || 0);
      const errors = parseInt(s["Error?"] || 0);
      const wl = s["Win/Loss?"] || "";

      entry.ratings.push(rating);
      entry.left += left; entry.right += right; entry.head += head; entry.other += other;
      entry.assists += assists; entry.errors += errors;
      if (wl.toLowerCase() === "win") entry.wins += 1;
      entry.matches.push({ date: s.Date, rating, goals: left + right + head + other, assists });

      const location = normalizeName(s.Location) || "Unknown";
      if (!entry.locationStats[location]) entry.locationStats[location] = { count: 0, goals: 0, assists: 0 };
      const loc = entry.locationStats[location];
      loc.count += 1; loc.goals += left + right + head + other; loc.assists += assists;
    });

    entry.matches.sort((a, b) => new Date(a.date) - new Date(b.date));
    return entry;
  };

  const renderDetailedProfile = (playerName) => {
    const statsData = getDetailedPlayerStats(playerName);
    if (!statsData) return null; // Returns null if player has no detailed stats

    const avgRating = statsData.ratings.reduce((sum, r) => sum + r, 0) / (statsData.ratings.length || 1);
    const totalGoals = statsData.left + statsData.right + statsData.head + statsData.other;
    const percentages = totalGoals > 0 ? [
      ((statsData.left / totalGoals) * 100).toFixed(1),
      ((statsData.right / totalGoals) * 100).toFixed(1),
      ((statsData.head / totalGoals) * 100).toFixed(1),
      ((statsData.other / totalGoals) * 100).toFixed(1),
    ] : [0, 0, 0, 0];

    const pieData = {
      labels: [`Left Foot (${percentages[0]}%)`, `Right Foot (${percentages[1]}%)`, `Head (${percentages[2]}%)`, `Other (${percentages[3]}%)`],
      datasets: [{ data: [statsData.left, statsData.right, statsData.head, statsData.other], backgroundColor: ["#4CAF50", "#2196F3", "#FFC107", "#9C27B0"], borderColor: "#ffffff", borderWidth: 3 }],
    };

    const totalMatches = statsData.ratings.length;
    const winRate = totalMatches > 0 ? ((statsData.wins || 0) / totalMatches) * 100 : 0;
    const ratingClass = avgRating < 6 ? "low" : avgRating <= 8 ? "mid" : "high";
    const errorClass = statsData.errors === 0 ? "none" : statsData.errors <= 3 ? "low" : "high";
    const winRateClass = winRate >= 50 ? "high" : winRate > 0 ? "mid" : "low";

    // 🐛 FIX 2: Use normalizeName for motmStats lookup
    const normName = normalizeName(playerName);
    const playerMotm = motmStats[normName] || {};
    const totalMotm = filterSeason
      ? (playerMotm[filterSeason] || 0)
      : Object.values(playerMotm).reduce((a, b) => a + b, 0);

    // 🐛 FIX 3: Use normalized names for Assist tracking logic
    const targetAssistPlayer = (normName === "ryan") ? "Darren" : (normName === "darren") ? "Ryan" : null;
    let totalAssistTo = 0;
    if (targetAssistPlayer) {
      const relevantStats = filterSeason
        ? stats.filter(s => getSeasonFromDate(s.Date) === filterSeason)
        : stats;
      relevantStats.forEach(s => {
        if (normalizeName(s.Contributor) === normName && normalizeName(s["Assist to"]) === normalizeName(targetAssistPlayer)) {
          totalAssistTo += parseInt(s["Assist to count"]) || 0;
        }
      });
    }

    const locationEntries = Object.entries(statsData.locationStats).filter(([loc]) => loc !== "Unknown").sort((a, b) => a[0].localeCompare(b[0]));
    const locationData = locationEntries.map(([loc, data]) => {
      const avgGoals = data.count > 0 ? data.goals / data.count : 0;
      const avgAssists = data.count > 0 ? data.assists / data.count : 0;
      const avgContrib = data.count > 0 ? (data.goals + data.assists) / data.count : 0;
      return { loc, data, avgGoals, avgAssists, avgContrib };
    });
    const maxContrib = locationData.length > 0 ? Math.max(...locationData.map((d) => d.avgContrib)) : 0;
    const lineupTotals = getLineupTotals(playerName);
    return (
      
      <div className="player-card">
        <h3 className="player-name">⚔️ {playerName} - Attacking Stats</h3>
        <div className="summary-list">
          <div className="summary-row"><span className="summary-label">Avg Rating</span><span className={`badge badge-rating-${ratingClass}`}>{avgRating.toFixed(2)}</span></div>
          <div className="summary-row"><span className="summary-label">Matches</span><span className="plain-value">{totalMatches}</span></div>
          <div className="summary-row"><span className="summary-label">Total Goals</span><span className="plain-value">{totalGoals}</span></div>
          <div className="summary-row"><span className="summary-label">Assists</span><span className="plain-value">{statsData.assists}</span></div>
          {targetAssistPlayer && (
            <div className="summary-row">
              <span className="summary-label">Assists to {targetAssistPlayer}</span>
              <span className="plain-value">{totalAssistTo}</span>
            </div>
          )}
          <div className="summary-row"><span className="summary-label">Win Rate</span><span className={`badge badge-winrate-${winRateClass}`}>{winRate.toFixed(1)}%</span></div>
          <div className="summary-row"><span className="summary-label">Errors</span><span className={`badge badge-error-${errorClass}`}>{statsData.errors}</span></div>
          <div className="summary-row">
            <span className="summary-label">MOTM</span>
            <span className="plain-value">{totalMotm}</span>
          </div>
        </div>
        {totalGoals > 0 ? (
          <div className="chart-container">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#475569", font: { family: "'Barlow', sans-serif", size: 12 } } } } }} />
          </div>
        ) : (<p className="no-data">No goal source data</p>)}
        <FormTrendGraph matches={statsData.matches} />
        <StreakTracker matches={statsData.matches} />
        {lineupTotals && lineupTotals.matches > 0 && (
  <>
    <div className="summary-row">
      <span className="summary-label">Lineup Matches</span>
      <span className="plain-value">{lineupTotals.matches}</span>
    </div>
    <div className="summary-row">
      <span className="summary-label">Lineup Avg Rating</span>
      <span className="plain-value">{lineupTotals.avgRating.toFixed(2)}</span>
    </div>
  </>
)}
        {locationData.length > 0 && (
          <div className="location-section">
            <div className="location-title">📍 地点表现</div>
            <table className="location-table">
              <thead><tr><th>Location</th><th>Matches</th><th>Avg Goals</th><th>Avg Assists</th><th>Avg Contrib</th></tr></thead>
              <tbody>
                {locationData.map(({ loc, data, avgGoals, avgAssists, avgContrib }) => (
                  <tr key={loc} className={avgContrib === maxContrib && maxContrib > 0 ? "highlight" : ""}>
                    <td>{loc}</td><td>{data.count}</td><td>{avgGoals.toFixed(2)}</td><td>{avgAssists.toFixed(2)}</td><td>{avgContrib.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderSeasonalProfile = (playerName) => {
    const playerData = lineupStats[normalizeName(playerName)];
    const playerMotm = motmStats[normalizeName(playerName)] || {};
    const totalMotm = Object.values(playerMotm).reduce((a, b) => a + b, 0);

    if (!playerData || Object.keys(playerData).length === 0) {
      return (
        <div className="player-card simple-card">
          <h3 className="player-name">{playerName}</h3>
          <div className="summary-list">
            <div className="summary-row">
              <span className="summary-label">MOTM</span>
              <span className="plain-value">{totalMotm}</span>
            </div>
          </div>
          <div className="no-data">
            No lineup records found for <strong>{playerName}</strong>.
          </div>
        </div>
      );
    }

    const seasons = Object.keys(playerData).sort().reverse();

    let totalMatches = 0;
    let totalRating = 0;
    seasons.forEach((s) => {
      totalMatches += playerData[s].matches;
      totalRating += playerData[s].totalRating;
    });
    const overallAvg = totalMatches > 0 ? totalRating / totalMatches : 0;
    const ratingClass = overallAvg < 6 ? "low" : overallAvg <= 8 ? "mid" : "high";

    return (
      <div className="player-card simple-card">
        <h3 className="player-name">🛡️ {playerName} - Lineup Stats</h3>
        <div className="summary-list">
          <div className="summary-row">
            <span className="summary-label">Overall Avg Rating</span>
            <span className={`badge badge-rating-${ratingClass}`}>{overallAvg.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Total Lineup Matches</span>
            <span className="plain-value">{totalMatches}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">MOTM</span>
            <span className="plain-value">{totalMotm}</span>
          </div>
        </div>
        
        {seasons.length > 0 && (
          <div className="location-section">
            <div className="location-title">📅 Season Breakdown</div>
            <table className="location-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Matches</th>
                  <th>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map(season => {
                  const sData = playerData[season];
                  const avg = sData.matches > 0 ? sData.totalRating / sData.matches : 0;
                  const sRatingClass = avg < 6 ? "low" : avg <= 8 ? "mid" : "high";
                  return (
                    <tr key={season}>
                      <td>{season}</td>
                      <td>{sData.matches}</td>
                      <td><span className={`badge badge-rating-${sRatingClass}`}>{avg.toFixed(2)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="stats-summary-wrap">
      <h2 className="stats-header">Stats Summary</h2>
      {debugInfo && (
        <div style={{
          textAlign: "center", 
          color: debugInfo.includes("❌") ? "#ef4444" : "#64748b", 
          fontSize: "13px", 
          marginBottom: "15px",
          padding: "8px 12px",
          background: debugInfo.includes("❌") ? "#fef2f2" : "#f8fafc",
          borderRadius: "6px"
        }}>
          {debugInfo}
        </div>
      )}
      <div className="stats-layout">
        <div className="filter-panel">
          <h3 className="filter-title">Filters</h3>

          <label className="filter-label">Player:</label>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="filter-select"
            style={{ marginBottom: "20px" }}
          >
            {dropdownPlayers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Show Season Filter if the selected player has detailed stats available */}
          {getDetailedPlayerStats(selectedPlayer) && (
            <>
              <label className="filter-label">Season (Attacking Stats):</label>
              <select value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)} className="filter-select">
                <option value="">All Seasons</option>
                {allSeasons.map((season) => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
              {filterSeason && (
                <div className="filter-active">
                  Showing: <strong>{filterSeason}</strong> season
                </div>
              )}
            </>
          )}
        </div>

        <div className="cards-grid">
          {/* 🐛 FIX 4: Render Detailed Profile for ANY player who has stats. Fallback to Seasonal if they don't. */}
          {renderDetailedProfile(selectedPlayer) || renderSeasonalProfile(selectedPlayer)}
        </div>
      </div>
    </div>
  );
}

export default StatsSummary;