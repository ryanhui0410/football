import React, { useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import FormTrendGraph from "./FormTrendGraph";
import StreakTracker from "./StreakTracker";
import "./StatsSummary.css"; // Import the new CSS

ChartJS.register(ArcElement, Tooltip, Legend);

function StatsSummary({ stats }) {
  const [filterSeason, setFilterSeason] = useState("");

  const getSeasonLabel = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (month >= 8) return `${year}-${year + 1}`;
    else return `${year - 1}-${year}`;
  };

  const allSeasons = [...new Set(stats.map(s => getSeasonLabel(s.Date)).filter(Boolean))].sort();

  const filteredStats = filterSeason
    ? stats.filter(s => getSeasonLabel(s.Date) === filterSeason)
    : stats;

  const contributorMap = {};

  filteredStats.forEach((s) => {
    const name = s.Contributor?.trim();
    if (!name) return;

    if (!contributorMap[name]) {
      contributorMap[name] = {
        // Added 'other: 0' to track other body parts
        ratings: [], left: 0, right: 0, head: 0, other: 0, assists: 0, errors: 0, wins: 0,
        locationStats: {}, matches: [], 
      };
    }

    const entry = contributorMap[name];
    const rating = parseFloat(s.Rating) || 0;
    const left = parseInt(s["Left Foot"] || 0);
    const right = parseInt(s["Right Foot"] || 0);
    const head = parseInt(s.Head || s["Head"] || 0);
    const other = parseInt(s["Other body parts"] || s.OtherBodyParts || 0); // ← Extract Other
    const assists = parseInt(s.Assist || 0);
    const errors = parseInt(s["Error?"] || 0);
    const wl = s["Win/Loss?"] || s.WinLoss || "";

    entry.ratings.push(rating);
    entry.left += left;
    entry.right += right;
    entry.head += head;
    entry.other += other; // ← Accumulate Other
    entry.assists += assists;
    entry.errors += errors;
    if (wl.toLowerCase() === "win") entry.wins += 1;

    // Updated goals calculation for the Form Trend Graph
    entry.matches.push({ date: s.Date, rating, goals: left + right + head + other, assists });

    const location = s.Location?.trim() || "Unknown";
    if (!entry.locationStats[location]) entry.locationStats[location] = { count: 0, goals: 0, assists: 0 };
    const loc = entry.locationStats[location];
    loc.count += 1;
    // Updated goals calculation for the Location Table
    loc.goals += left + right + head + other; 
    loc.assists += assists;
  });

  Object.values(contributorMap).forEach(entry => {
    entry.matches.sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  return (
    <div className="stats-summary-wrap">
      <h2 className="stats-header">Stats Summary</h2>

      <div className="stats-layout">
        {/* Filter Panel */}
        <div className="filter-panel">
          <h3 className="filter-title">Filters</h3>
          <label className="filter-label">Season:</label>
          <select value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)} className="filter-select">
            <option value="">All Seasons</option>
            {allSeasons.map(season => <option key={season} value={season}>{season}</option>)}
          </select>
          {filterSeason && (
            <div className="filter-active">
              Showing: <strong>{filterSeason}</strong> season
            </div>
          )}
        </div>

        {/* Cards Grid */}
        <div className="cards-grid">
          {Object.entries(contributorMap).map(([name, stats]) => {
            const avgRating = stats.ratings.reduce((sum, r) => sum + r, 0) / (stats.ratings.length || 1);
            
            // ✅ Updated Total Goals Calculation
            const totalGoals = stats.left + stats.right + stats.head + stats.other;
            
            // ✅ Updated Percentages Calculation
            const percentages = totalGoals > 0 ? [
              ((stats.left / totalGoals) * 100).toFixed(1),
              ((stats.right / totalGoals) * 100).toFixed(1),
              ((stats.head / totalGoals) * 100).toFixed(1),
              ((stats.other / totalGoals) * 100).toFixed(1),
            ] : [0, 0, 0, 0];

            // ✅ Updated Pie Chart Data
            const data = {
              labels: [
                `Left Foot (${percentages[0]}%)`, 
                `Right Foot (${percentages[1]}%)`, 
                `Head (${percentages[2]}%)`,
                `Other (${percentages[3]}%)`
              ],
              datasets: [{
                data: [stats.left, stats.right, stats.head, stats.other],
                backgroundColor: ["#4CAF50", "#2196F3", "#FFC107", "#9C27B0"], // Added Purple for "Other"
                borderColor: "#ffffff",
                borderWidth: 3
              }],
            };

            const totalMatches = stats.ratings.length;
            const winRate = totalMatches > 0 ? ((stats.wins || 0) / totalMatches) * 100 : 0;

            const ratingClass = avgRating < 6 ? "low" : avgRating <= 8 ? "mid" : "high";
            const errorClass = stats.errors === 0 ? "none" : stats.errors <= 3 ? "low" : "high";
            const winRateClass = winRate >= 50 ? "high" : winRate > 0 ? "mid" : "low";

            const locationEntries = Object.entries(stats.locationStats).filter(([loc]) => loc !== "Unknown").sort((a, b) => a[0].localeCompare(b[0]));
            const locationData = locationEntries.map(([loc, data]) => {
              const avgGoals = data.count > 0 ? (data.goals / data.count) : 0;
              const avgAssists = data.count > 0 ? (data.assists / data.count) : 0;
              const avgContrib = data.count > 0 ? ((data.goals + data.assists) / data.count) : 0;
              return { loc, data, avgGoals, avgAssists, avgContrib };
            });
            const maxContrib = locationData.length > 0 ? Math.max(...locationData.map(d => d.avgContrib)) : 0;

            return (
              <div key={name} className="player-card">
                <h3 className="player-name">{name}</h3>

                <div className="summary-list">
                  <div className="summary-row">
                    <span className="summary-label">Avg Rating</span>
                    <span className={`badge badge-rating-${ratingClass}`}>{avgRating.toFixed(2)}</span>
                  </div>
                  
                  {/* ✅ Moved Matches above Total Goals */}
                  <div className="summary-row">
                    <span className="summary-label">Matches</span>
                    <span className="plain-value">{totalMatches}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Total Goals</span>
                    <span className="plain-value">{totalGoals}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Assists</span>
                    <span className="plain-value">{stats.assists}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Win Rate</span>
                    <span className={`badge badge-winrate-${winRateClass}`}>{winRate.toFixed(1)}%</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Errors</span>
                    <span className={`badge badge-error-${errorClass}`}>{stats.errors}</span>
                  </div>
                </div>

                {totalGoals > 0 ? (
                  <div className="chart-container">
                    <Pie
                      data={data}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                          legend: { 
                            position: "bottom",
                            labels: { 
                              color: "#475569", 
                              font: { family: "'Barlow', sans-serif", size: 12 } 
                            }
                          } 
                        },
                      }}
                    />
                  </div>
                ) : (
                  <p className="no-data">No goal source data</p>
                )}

                <FormTrendGraph matches={stats.matches} />
                <StreakTracker matches={stats.matches} />

                {locationData.length > 0 && (
                  <div className="location-section">
                    <div className="location-title">📍 地点表现</div>
                    <table className="location-table">
                      <thead>
                        <tr>
                          <th>Location</th>
                          <th>Matches</th>
                          <th>Avg Goals</th>
                          <th>Avg Assists</th>
                          <th>Avg Contrib</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locationData.map(({ loc, data, avgGoals, avgAssists, avgContrib }) => (
                          <tr key={loc} className={avgContrib === maxContrib && maxContrib > 0 ? "highlight" : ""}>
                            <td>{loc}</td>
                            <td>{data.count}</td>
                            <td>{avgGoals.toFixed(2)}</td>
                            <td>{avgAssists.toFixed(2)}</td>
                            <td>{avgContrib.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StatsSummary;