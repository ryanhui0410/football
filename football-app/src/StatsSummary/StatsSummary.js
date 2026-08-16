import React, { useState, useEffect, useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import FormTrendGraph from "./FormTrendGraph";
import StreakTracker from "./StreakTracker";
import "./StatsSummary.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const FILTER_GROUPS = {
  Barry: ['Lu', 'Nick', 'Jacob', '普巴', 'Chris', '局長', 'Eugene', '大嚿', 'Barry', 'Chun', '子睿', 'Steve', 'Alex', 'hong', 'R', 'Ken', 'Derek', 'Marco', 'Nin', 'Dave', 'S Joe', 'Po', 'QC', 'Raymond'],
  'The Bros': ['Ryan', 'Darren'],
  馬哲: ['Tony', '馬俊翔'],
};

// ✅ FIXED: Robust date parser that handles "8/9/2026" format
function getSeasonFromDate(dateStr) {
  if (!dateStr) return "";
  
  // Try splitting by "/" first (handles "8/9/2026")
  const parts = dateStr.split("/");
  let month, year;
  
  if (parts.length === 3) {
    month = parseInt(parts[0], 10);
    year = parseInt(parts[2], 10);
  } else {
    // Fallback to Date object
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    month = d.getMonth() + 1;
    year = d.getFullYear();
  }
  
  if (isNaN(month) || isNaN(year)) return "";
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function StatsSummary({ stats }) {
  const [filterSeason, setFilterSeason] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("Ryan");
  const [lineups, setLineups] = useState([]);
  const [debugInfo, setDebugInfo] = useState(""); // ✅ Visible debug

  // ✅ Fetch lineups with error handling
  useEffect(() => {
    fetch("http://localhost:5000/match-lineups")
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setLineups(arr);
        setDebugInfo(`✅ Loaded ${arr.length} lineup records`);
      })
      .catch((err) => {
        setDebugInfo(`❌ Fetch error: ${err.message}`);
      });
  }, []);

  // ✅ Build dropdown player list
  const dropdownPlayers = useMemo(() => {
    const allNames = [
      ...(FILTER_GROUPS['Barry'] || []),
      ...(FILTER_GROUPS['馬哲'] || []),
      ...(FILTER_GROUPS['The Bros'] || []),
    ];
    return [...new Set(allNames)].sort();
  }, []);

  // ✅ FIXED: Build lineup stats with explicit teamA/teamB access
  const lineupStats = useMemo(() => {
    const map = {};

    lineups.forEach((match) => {
      if (!match || !match.date) return;
      
      const season = getSeasonFromDate(match.date);
      if (!season) return;

      // ✅ Explicitly check teamA and teamB
      const teams = [];
      if (match.teamA && match.teamA.players) teams.push(match.teamA);
      if (match.teamB && match.teamB.players) teams.push(match.teamB);
      // Also check any other team keys generically
      Object.keys(match).forEach((key) => {
        if (key !== "teamA" && key !== "teamB" && match[key] && match[key].players) {
          teams.push(match[key]);
        }
      });

      teams.forEach((team) => {
        Object.values(team.players).forEach((player) => {
          if (!player || !player.Contributor) return;

          const name = player.Contributor.trim();
          const rating = parseFloat(player.rating) || 0;

          if (!map[name]) map[name] = {};
          if (!map[name][season]) map[name][season] = { matches: 0, totalRating: 0 };

          map[name][season].matches += 1;
          map[name][season].totalRating += rating;
        });
      });
    });

    // Calculate averages
    Object.keys(map).forEach((name) => {
      Object.keys(map[name]).forEach((season) => {
        const d = map[name][season];
        d.avgRating = d.matches > 0 ? d.totalRating / d.matches : 0;
      });
    });

    return map;
  }, [lineups]);

  // ✅ Get all seasons from stats
  const allSeasons = [...new Set(stats.map((s) => getSeasonFromDate(s.Date)).filter(Boolean))].sort();
  const filteredStats = filterSeason
    ? stats.filter((s) => getSeasonFromDate(s.Date) === filterSeason)
    : stats;

  // ===== ✅ NEW: Compute MOTM stats per player per season =====
  const motmStats = useMemo(() => {
    const map = {};
    stats.forEach((s) => {
      const name = s.Contributor?.trim();
      if (!name) return;
      const season = getSeasonFromDate(s.Date);
      if (!season) return;
      if (!map[name]) map[name] = {};
      if (!map[name][season]) map[name][season] = 0;
      // Field name is "Man of the Match" (with spaces) as per your JSON
      if (s["Man of the Match"] === true) {
        map[name][season] += 1;
      }
    });
    return map;
  }, [stats]);

  // ===== Detailed stats for Ryan/Darren =====
  const getDetailedPlayerStats = (playerName) => {
    const playerStats = filteredStats.filter((s) => s.Contributor?.trim() === playerName);
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

      const location = s.Location?.trim() || "Unknown";
      if (!entry.locationStats[location]) entry.locationStats[location] = { count: 0, goals: 0, assists: 0 };
      const loc = entry.locationStats[location];
      loc.count += 1; loc.goals += left + right + head + other; loc.assists += assists;
    });

    entry.matches.sort((a, b) => new Date(a.date) - new Date(b.date));
    return entry;
  };

  // ===== Render: Detailed profile (Ryan/Darren) =====
  const renderDetailedProfile = (playerName) => {
  const statsData = getDetailedPlayerStats(playerName);
  if (!statsData) return null;

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

  const playerMotm = motmStats[playerName] || {};
  const totalMotm = filterSeason
    ? (playerMotm[filterSeason] || 0)
    : Object.values(playerMotm).reduce((a, b) => a + b, 0);

  // ---- 新增：计算助攻给对方的总数 ----
  const targetAssistPlayer = (playerName === "Ryan") ? "Darren" : (playerName === "Darren") ? "Ryan" : null;
  let totalAssistTo = 0;
  if (targetAssistPlayer) {
    const relevantStats = filterSeason
      ? stats.filter(s => getSeasonFromDate(s.Date) === filterSeason)
      : stats;
    relevantStats.forEach(s => {
      if (s.Contributor?.trim() === playerName && s["Assist to"]?.trim() === targetAssistPlayer) {
        totalAssistTo += parseInt(s["Assist to count"]) || 0;
      }
    });
  }
  // ---- 新增结束 ----

  const locationEntries = Object.entries(statsData.locationStats).filter(([loc]) => loc !== "Unknown").sort((a, b) => a[0].localeCompare(b[0]));
  const locationData = locationEntries.map(([loc, data]) => {
    const avgGoals = data.count > 0 ? data.goals / data.count : 0;
    const avgAssists = data.count > 0 ? data.assists / data.count : 0;
    const avgContrib = data.count > 0 ? (data.goals + data.assists) / data.count : 0;
    return { loc, data, avgGoals, avgAssists, avgContrib };
  });
  const maxContrib = locationData.length > 0 ? Math.max(...locationData.map((d) => d.avgContrib)) : 0;

  return (
    <div className="player-card">
      <h3 className="player-name">⚔️ {playerName} - Attacking Stats</h3>
      <div className="summary-list">
        <div className="summary-row"><span className="summary-label">Avg Rating</span><span className={`badge badge-rating-${ratingClass}`}>{avgRating.toFixed(2)}</span></div>
        <div className="summary-row"><span className="summary-label">Matches</span><span className="plain-value">{totalMatches}</span></div>
        <div className="summary-row"><span className="summary-label">Total Goals</span><span className="plain-value">{totalGoals}</span></div>
        <div className="summary-row"><span className="summary-label">Assists</span><span className="plain-value">{statsData.assists}</span></div>
        {/* ---- 新增：助攻给对方的行 ---- */}
        {targetAssistPlayer && (
          <div className="summary-row">
            <span className="summary-label">Assists to {targetAssistPlayer}</span>
            <span className="plain-value">{totalAssistTo}</span>
          </div>
        )}
        {/* ---- 新增结束 ---- */}
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

  // ===== Render: Seasonal profile (other players) =====
  const renderSeasonalProfile = (playerName) => {
    const playerData = lineupStats[playerName];
    const availablePlayers = Object.keys(lineupStats);

    // ✅ Calculate total MOTM across all seasons
    const playerMotm = motmStats[playerName] || {};
    const totalMotm = Object.values(playerMotm).reduce((a, b) => a + b, 0);

    if (!playerData || Object.keys(playerData).length === 0) {
      return (
        <div className="player-card simple-card">
          <h3 className="player-name">{playerName}</h3>
          <div className="summary-list">
            {/* ✅ Show MOTM even when no lineup records */}
            <div className="summary-row">
              <span className="summary-label">MOTM</span>
              <span className="plain-value">{totalMotm}</span>
            </div>
          </div>
          <div className="no-data">
            No lineup records found for <strong>{playerName}</strong>.
            <br /><br />
            <small style={{ color: "#94a3b8" }}>
              Players found in lineups: {availablePlayers.length > 0 ? availablePlayers.join(", ") : "(none)"}
            </small>
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
  };

  // ===== Main Render =====
  return (
    <div className="stats-summary-wrap">
      <h2 className="stats-header">Stats Summary</h2>
      <div className="stats-layout">
        {/* Filter Panel */}
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

          {(selectedPlayer === "Ryan" || selectedPlayer === "Darren") && (
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

        {/* Content Area */}
        <div className="cards-grid">
          {(selectedPlayer === "Ryan" || selectedPlayer === "Darren") && renderDetailedProfile(selectedPlayer)}
          {renderSeasonalProfile(selectedPlayer)}
        </div>
      </div>
    </div>
  );
}

export default StatsSummary;