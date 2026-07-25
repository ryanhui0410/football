import React from "react";

function StreakTracker({ matches }) {
  // matches: sorted chronologically ascending (oldest first)
  if (!matches || matches.length === 0) return null;

  // --- Helper: compute longest streak for a given property (goals or assists) ---
  const computeLongestStreak = (key) => {
    let longestLength = 0;
    let longestStart = null;
    let longestEnd = null;

    let currentLength = 0;
    let currentStart = null;

    matches.forEach((m, idx) => {
      if (m[key] > 0) {
        if (currentLength === 0) {
          currentStart = m.date;
        }
        currentLength++;
        // Check if it's the last match – then we need to update longest
        if (idx === matches.length - 1) {
          if (currentLength > longestLength) {
            longestLength = currentLength;
            longestStart = currentStart;
            longestEnd = m.date;
          }
        }
      } else {
        // streak broken
        if (currentLength > longestLength) {
          longestLength = currentLength;
          longestStart = currentStart;
          longestEnd = matches[idx - 1].date; // end date of last successful match
        }
        // reset
        currentLength = 0;
        currentStart = null;
      }
    });

    return { length: longestLength, start: longestStart, end: longestEnd };
  };

  const longestGoals = computeLongestStreak("goals");
  const longestAssists = computeLongestStreak("assists");

  // --- Compute current streaks (most recent matches) ---
  const reversed = [...matches].reverse();
  const computeCurrentStreak = (key) => {
    let streak = 0;
    for (let m of reversed) {
      if (m[key] > 0) streak++;
      else break;
    }
    return streak;
  };

  const currentGoalStreak = computeCurrentStreak("goals");
  const currentAssistStreak = computeCurrentStreak("assists");

  // Date formatting helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={{ marginTop: "10px", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "6px" }}>
        🔥 Streaks
      </div>

      {/* Goal streaks */}
      <div style={{ marginBottom: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>⚽ Current goal streak: <strong>{currentGoalStreak}</strong></span>
        </div>
        {longestGoals.length > 0 && (
          <div style={{ fontSize: "12px", color: "#555" }}>
            Longest goal streak: <strong>{longestGoals.length}</strong> matches
            ({formatDate(longestGoals.start)} – {formatDate(longestGoals.end)})
          </div>
        )}
      </div>

      {/* Assist streaks */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>🎯 Current assist streak: <strong>{currentAssistStreak}</strong></span>
        </div>
        {longestAssists.length > 0 && (
          <div style={{ fontSize: "12px", color: "#555" }}>
            Longest assist streak: <strong>{longestAssists.length}</strong> matches
            ({formatDate(longestAssists.start)} – {formatDate(longestAssists.end)})
          </div>
        )}
      </div>
    </div>
  );
}

export default StreakTracker;