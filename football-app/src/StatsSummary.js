import React, { useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function StatsSummary({ stats }) {
  const [filterSeason, setFilterSeason] = useState("");

  // 辅助函数：获取赛季标签 (Aug-Jul)
  const getSeasonLabel = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12
    if (month >= 8) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  // 获取所有可用的赛季选项
  const allSeasons = [...new Set(stats.map(s => getSeasonLabel(s.Date)).filter(Boolean))].sort();

  // 按赛季过滤数据
  const filteredStats = filterSeason
    ? stats.filter(s => getSeasonLabel(s.Date) === filterSeason)
    : stats;

  const contributorMap = {};

  filteredStats.forEach((s) => {
    const name = s.Contributor?.trim();
    if (!name) return;

    if (!contributorMap[name]) {
      contributorMap[name] = {
        ratings: [],
        left: 0,
        right: 0,
        head: 0,
        assists: 0,
        errors: 0,
        locationStats: {},
      };
    }

    const entry = contributorMap[name];
    entry.ratings.push(parseFloat(s.Rating) || 0);
    entry.left += parseInt(s["Left Foot"] || 0);
    entry.right += parseInt(s["Right Foot"] || 0);
    entry.head += parseInt(s.Head || s["Head"] || 0);
    entry.assists += parseInt(s.Assist || 0);
    entry.errors += parseInt(s["Error?"] || 0);

    const location = s.Location?.trim() || "Unknown";
    if (!entry.locationStats[location]) {
      entry.locationStats[location] = { count: 0, goals: 0, assists: 0 };
    }
    const loc = entry.locationStats[location];
    loc.count += 1;
    const goals = (parseInt(s["Left Foot"] || 0) + parseInt(s["Right Foot"] || 0) + parseInt(s.Head || s["Head"] || 0));
    loc.goals += goals;
    loc.assists += parseInt(s.Assist || 0);
  });

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>Stats Summary</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        {/* 左侧赛季过滤器 */}
        <div
          style={{
            width: "200px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#f0f0f0",
            height: "fit-content",
            textAlign: "left",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Filters</h3>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>
            Season:
          </label>
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="">All Seasons</option>
            {allSeasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
          {filterSeason && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
              Showing: <strong>{filterSeason}</strong> season
            </div>
          )}
        </div>

        {/* 右侧统计卡片 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "20px",
            flex: 1,
          }}
        >
          {Object.entries(contributorMap).map(([name, stats]) => {
            const avgRating =
              stats.ratings.reduce((sum, r) => sum + r, 0) /
              (stats.ratings.length || 1);

            const totalGoals = stats.left + stats.right + stats.head;
            const percentages =
              totalGoals > 0
                ? [
                    ((stats.left / totalGoals) * 100).toFixed(1),
                    ((stats.right / totalGoals) * 100).toFixed(1),
                    ((stats.head / totalGoals) * 100).toFixed(1),
                  ]
                : [0, 0, 0];

            const data = {
              labels: [
                `Left Foot (${percentages[0]}%)`,
                `Right Foot (${percentages[1]}%)`,
                `Head (${percentages[2]}%)`,
              ],
              datasets: [
                {
                  data: [stats.left, stats.right, stats.head],
                  backgroundColor: ["#4CAF50", "#2196F3", "#FFC107"],
                },
              ],
            };

            const ratingStyle = {
              padding: "4px 8px",
              borderRadius: "8px",
              fontWeight: "bold",
              color: "#fff",
              backgroundColor:
                avgRating < 6 ? "red" : avgRating <= 8 ? "lightgreen" : "green",
            };

            const errorStyle = {
              padding: "4px 8px",
              borderRadius: "8px",
              fontWeight: "bold",
              color: "#fff",
              backgroundColor:
                stats.errors === 0 ? "green" : stats.errors <= 3 ? "#ffb300" : "red",
            };

            // 地点表格数据：过滤掉 Unknown
            const locationEntries = Object.entries(stats.locationStats)
              .filter(([loc]) => loc !== "Unknown")
              .sort((a, b) => a[0].localeCompare(b[0]));

            // 计算每个地点的平均贡献，并找出最大值
            const locationData = locationEntries.map(([loc, data]) => {
              const avgGoals = data.count > 0 ? (data.goals / data.count) : 0;
              const avgAssists = data.count > 0 ? (data.assists / data.count) : 0;
              const avgContrib = data.count > 0 ? ((data.goals + data.assists) / data.count) : 0;
              return { loc, data, avgGoals, avgAssists, avgContrib };
            });

            const maxContrib = locationData.length > 0 ? Math.max(...locationData.map(d => d.avgContrib)) : 0;

            return (
              <div
                key={name}
                style={{
                  flex: "1 1 calc(50% - 20px)",
                  maxWidth: "280px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "15px",
                  backgroundColor: "#f9f9f9",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <h3>{name}</h3>

                {/* 原有统计汇总 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "bold" }}>Avg Rating:</span>
                    <span style={ratingStyle}>{avgRating.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "bold" }}>Total Goals:</span>
                    <span>{totalGoals}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "bold" }}>Matches:</span>
                    <span>{stats.ratings.length}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "bold" }}>Assists:</span>
                    <span>{stats.assists}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "bold" }}>Errors:</span>
                    <span style={errorStyle}>{stats.errors}</span>
                  </div>
                </div>

                {/* 饼图 */}
                {totalGoals > 0 ? (
                  <div style={{ height: "200px", width: "200px", margin: "10px auto 0" }}>
                    <Pie
                      data={data}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "bottom" } },
                      }}
                    />
                  </div>
                ) : (
                  <p style={{ marginTop: "8px" }}>No goal source data</p>
                )}

                {/* 地点表格 */}
                {locationData.length > 0 && (
                  <div style={{ marginTop: "10px", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "6px" }}>
                      📍 地点表现
                    </div>
                    <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#eee" }}>
                          <th style={{ padding: "4px", border: "1px solid #ddd", textAlign: "left" }}>Location</th>
                          <th style={{ padding: "4px", border: "1px solid #ddd", textAlign: "center" }}>Matches</th>
                          <th style={{ padding: "4px", border: "1px solid #ddd", textAlign: "center" }}>Avg Goals</th>
                          <th style={{ padding: "4px", border: "1px solid #ddd", textAlign: "center" }}>Avg Assists</th>
                          <th style={{ padding: "4px", border: "1px solid #ddd", textAlign: "center" }}>Avg Contrib</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locationData.map(({ loc, data, avgGoals, avgAssists, avgContrib }) => {
                          const isMax = avgContrib === maxContrib && maxContrib > 0;
                          return (
                            <tr
                              key={loc}
                              style={{
                                backgroundColor: isMax ? "#e6f7ff" : "transparent",
                              }}
                            >
                              <td style={{ padding: "4px", border: "1px solid #ddd", textAlign: "left" }}>{loc}</td>
                              <td style={{ padding: "4px", border: "1px solid #ddd", textAlign: "center" }}>{data.count}</td>
                              <td style={{ padding: "4px", border: "1px solid #ddd", textAlign: "center" }}>{avgGoals.toFixed(2)}</td>
                              <td style={{ padding: "4px", border: "1px solid #ddd", textAlign: "center" }}>{avgAssists.toFixed(2)}</td>
                              <td style={{ padding: "4px", border: "1px solid #ddd", textAlign: "center" }}>{avgContrib.toFixed(2)}</td>
                            </tr>
                          );
                        })}
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