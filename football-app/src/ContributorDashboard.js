import React from "react";

function ContributorDashboard({
  contributors,
  activeContributor,
  toggleContributor,
  filterLocation,
  setFilterLocation,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
}) {
  // 获取当前贡献者对象
  const contributor = contributors.find(c => c.name === activeContributor);
  let filteredMatches = contributor ? contributor.getSortedMatches() : [];

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

  // 应用过滤器
  filteredMatches = filteredMatches.filter(m => {
    const dateObj = new Date(m.date);
    const matchYearMonth = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}`;
    const matchSeason = getSeasonLabel(m.date);
    const locationMatch = !filterLocation || m.location === filterLocation;
    const monthMatch = !filterMonth || matchYearMonth === filterMonth;
    const yearMatch = !filterYear || matchSeason === filterYear;
    return locationMatch && monthMatch && yearMatch;
  });

  // 显式按日期降序排序（最新的在前面）
  filteredMatches.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 获取当前贡献者的所有赛季选项
  const getSeasonOptions = () => {
    const currentContributor = contributors.find(c => c.name === activeContributor);
    if (!currentContributor) return [];
    const seasons = new Set(
      currentContributor.matches.map(m => getSeasonLabel(m.date))
    );
    return [...seasons].sort();
  };

  // 获取进球数据（兼容多种字段名）
  const getGoals = (m) => {
    const left = parseInt(m.LeftFoot || m['Left Foot'] || m.leftFoot || 0);
    const right = parseInt(m.RightFoot || m['Right Foot'] || m.rightFoot || 0);
    const head = parseInt(m.Head || m['Head'] || m.head || 0);
    const other = parseInt(m.OtherBodyParts || m['Other body parts'] || m['Other Body Parts'] || m.otherBodyParts || 0);
    return { left, right, head, other, total: left + right + head + other };
  };

  // 获取助攻数
  const getAssists = (m) => parseInt(m.Assist || m.assist || 0);

  // 获取错误数
  const getErrors = (m) => parseInt(m.Error || m['Error?'] || m.error || 0);

  // 获取进球贡献
  const getGoalContribution = (m) => {
    if (m['Goal Contribution'] !== undefined) return parseInt(m['Goal Contribution']);
    if (m.goalContribution !== undefined) return parseInt(m.goalContribution);
    return getGoals(m).total + getAssists(m);
  };

  return (
    <div>
      {contributors.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h2>Contributors</h2>

          {/* Contributor buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {contributors.map((c) => (
              <button
                key={c.name}
                onClick={() => toggleContributor(c.name)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: activeContributor === c.name
                    ? "#d0f0c0"
                    : "#f0f0f0",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "background-color 0.2s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.backgroundColor = activeContributor === c.name ? "#b8e6a8" : "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.backgroundColor = activeContributor === c.name ? "#d0f0c0" : "#f0f0f0";
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Match sections */}
          {activeContributor && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              {/* Sidebar filters */}
              <div style={{ width: "200px", padding: "15px", borderRight: "1px solid #ccc", backgroundColor: "#f0f0f0" }}>
                <h3>Filters</h3>
                <label>
                  Location:
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    style={{ width: "100%", marginBottom: "10px" }}
                  >
                    <option value="">All</option>
                    {[...new Set(
                      contributors.find(c => c.name === activeContributor)?.matches.map(m => m.location).filter(Boolean)
                    )].map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Year/Month:
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ width: "100%", marginBottom: "10px" }}
                  >
                    <option value="">All</option>
                    {[...new Set(
                      contributors.find(c => c.name === activeContributor)?.matches.map(m => {
                        const d = new Date(m.date);
                        return `${d.getFullYear()}/${d.getMonth() + 1}`;
                      })
                    )].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Season:
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">All</option>
                    {getSeasonOptions().map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Match display */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <h3>{activeContributor} - Match History</h3>
                {filteredMatches.map((m, i) => {
                  const ratingValue = parseFloat(m.rating);
                  let ratingColor = "#ccc";
                  if (ratingValue > 8.0) ratingColor = "#4CAF50";
                  else if (ratingValue >= 6.0) ratingColor = "#FFEB3B";
                  else ratingColor = "#F44336";

                  const goals = getGoals(m);
                  const assists = getAssists(m);
                  const errors = getErrors(m);
                  const goalContrib = getGoalContribution(m);

                  return (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        border: "1px solid #ccc",
                        borderRadius: "16px",
                        padding: "0",
                        margin: "15px auto",
                        width: "600px",
                        backgroundColor: "#f9f9f9",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, background-color 0.2s ease",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                        e.currentTarget.style.backgroundColor = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
                        e.currentTarget.style.backgroundColor = "#f9f9f9";
                      }}
                    >
                      {/* ===== FIFA-STYLE HEADER ===== */}
                      <div style={{
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                        {/* Date */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                          <span style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
                            Match Date
                          </span>
                          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>
                            {m.date}
                          </span>
                        </div>

                        {/* Rating Badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* Error badge */}
                          {errors > 0 && (
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                backgroundColor: "#F44336",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: "bold",
                                boxShadow: "0 0 10px rgba(244,67,54,0.5)",
                                border: "2px solid #fff",
                              }}
                              title={`${errors} error${errors > 1 ? 's' : ''}`}
                            >
                              E
                            </div>
                          )}
                          <div style={{
                            backgroundColor: ratingColor,
                            color: ratingValue >= 6 ? "#000" : "#fff",
                            borderRadius: "12px",
                            padding: "4px 14px",
                            fontWeight: "bold",
                            fontSize: "18px",
                            minWidth: "42px",
                            textAlign: "center",
                            boxShadow: `0 0 15px ${ratingColor}66`,
                          }}>
                            {m.rating}
                          </div>
                        </div>
                      </div>

                      {/* ===== FIFA-STYLE BODY ===== */}
                      <div style={{ padding: "16px 20px" }}>
                        {/* Location & Time row */}
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "14px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "16px" }}>📍</span>
                            <span style={{ fontSize: "14px", color: "#555", fontWeight: 500 }}>{m.location}</span>
                          </div>
                          {m.Time && (
                            <span style={{ fontSize: "12px", color: "#888" }}>⏱️ {m.Time}</span>
                          )}
                        </div>

                        {/* Goal Contribution Summary */}
                        <div style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "14px",
                        }}>
                          <span style={{ fontSize: "22px" }}>{m.symbol}</span>
                          <span style={{
                            fontSize: "13px",
                            color: "#666",
                            backgroundColor: "#f0f0f0",
                            padding: "2px 10px",
                            borderRadius: "12px",
                            fontWeight: 500,
                          }}>
                            {goalContrib} contributions
                          </span>
                        </div>

                        {/* ===== FIFA-STYLE GOAL BREAKDOWN ===== */}
                        {goals.total > 0 && (
                          <div style={{
                            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                            borderRadius: "12px",
                            padding: "14px",
                            border: "1px solid #dee2e6",
                          }}>
                            {/* 头部：标题 + 总进球数 */}
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "10px",
                            }}>
                              <span style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#666",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                              }}>
                                Goal Breakdown
                              </span>
                              <span style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "#333",
                              }}>
                                {goals.total} <span style={{ fontSize: "12px", color: "#888", fontWeight: "normal" }}>GOALS</span>
                              </span>
                            </div>

                            {/* 堆叠能量条 */}
                            <div style={{
                              display: "flex",
                              height: "20px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              backgroundColor: "#e0e0e0",
                              marginBottom: "10px",
                            }}>
                              {goals.left > 0 && (
                                <div style={{
                                  width: `${(goals.left / goals.total) * 100}%`,
                                  backgroundColor: "#4CAF50",
                                  transition: "width 0.5s ease",
                                }} />
                              )}
                              {goals.right > 0 && (
                                <div style={{
                                  width: `${(goals.right / goals.total) * 100}%`,
                                  backgroundColor: "#2196F3",
                                  transition: "width 0.5s ease",
                                }} />
                              )}
                              {goals.head > 0 && (
                                <div style={{
                                  width: `${(goals.head / goals.total) * 100}%`,
                                  backgroundColor: "#FF9800",
                                  transition: "width 0.5s ease",
                                }} />
                              )}
                              {goals.other > 0 && (
                                <div style={{
                                  width: `${(goals.other / goals.total) * 100}%`,
                                  backgroundColor: "#9C27B0",
                                  transition: "width 0.5s ease",
                                }} />
                              )}
                            </div>

                            {/* 图例：显示每种类型的进球数量 */}
                            <div style={{
                              display: "flex",
                              justifyContent: "center",
                              gap: "16px",
                              flexWrap: "wrap",
                              fontSize: "13px",
                              color: "#555",
                            }}>
                              {goals.left > 0 && (
                                <span><span style={{ color: "#4CAF50", fontWeight: "bold" }}>●</span> Left: {goals.left}</span>
                              )}
                              {goals.right > 0 && (
                                <span><span style={{ color: "#2196F3", fontWeight: "bold" }}>●</span> Right: {goals.right}</span>
                              )}
                              {goals.head > 0 && (
                                <span><span style={{ color: "#FF9800", fontWeight: "bold" }}>●</span> Head: {goals.head}</span>
                              )}
                              {goals.other > 0 && (
                                <span><span style={{ color: "#9C27B0", fontWeight: "bold" }}>●</span> Other: {goals.other}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Assists row */}
                        {assists > 0 && (
                          <div style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "10px",
                            padding: "6px",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "8px",
                          }}>
                            <span style={{ fontSize: "14px" }}>👟</span>
                            <span style={{ fontSize: "13px", color: "#1976D2", fontWeight: 500 }}>
                              {assists} Assist{assists !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ===== FIFA-STYLE FOOTER ===== */}
                      <div style={{
                        backgroundColor: "#f0f0f0",
                        padding: "8px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #e0e0e0",
                      }}>
                        <span style={{ fontSize: "11px", color: "#888" }}>
                          Source: {m.source || "Unknown"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#aaa" }}>
                          {getSeasonLabel(m.date)} Season
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// FIFA-style goal bar component
function GoalBar({ icon, label, count, color, max }) {
  const percentage = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{icon}</span>
      <span style={{ fontSize: "12px", color: "#555", width: "70px", fontWeight: 500 }}>{label}</span>
      <div style={{
        flex: 1,
        height: "10px",
        backgroundColor: "#e0e0e0",
        borderRadius: "5px",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${percentage}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: "5px",
          transition: "width 0.5s ease",
          boxShadow: `0 0 6px ${color}44`,
        }} />
      </div>
      <span style={{
        fontSize: "14px",
        fontWeight: "bold",
        color: color,
        minWidth: "20px",
        textAlign: "right",
      }}>
        {count}
      </span>
    </div>
  );
}

export default ContributorDashboard;