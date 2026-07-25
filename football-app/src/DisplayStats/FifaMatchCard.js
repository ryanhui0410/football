import React from "react";

// Helper to format season (Aug–Jul)
const getSeasonLabel = (dateStr) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (month >= 8) return `${year}-${year + 1}`;
  else return `${year - 1}-${year}`;
};

// Goal breakdown helper (same as before)
const getGoals = (m) => {
  const left = parseInt(m.LeftFoot || m['Left Foot'] || m.leftFoot || 0);
  const right = parseInt(m.RightFoot || m['Right Foot'] || m.rightFoot || 0);
  const head = parseInt(m.Head || m['Head'] || m.head || 0);
  const other = parseInt(m.OtherBodyParts || m['Other body parts'] || m.otherBodyParts || 0);
  return { left, right, head, other, total: left + right + head + other };
};

const getAssists = (m) => parseInt(m.Assist || m.assist || 0);
const getErrors = (m) => parseInt(m.Error || m['Error?'] || m.error || 0);

const getGoalContribution = (m) => {
  if (m['Goal Contribution'] !== undefined) return parseInt(m['Goal Contribution']);
  if (m.goalContribution !== undefined) return parseInt(m.goalContribution);
  return getGoals(m).total + getAssists(m);
};

function FifaMatchCard({ match, onCompare, showCompare }) {
  const ratingValue = parseFloat(match.rating);
  let ratingColor = "#ccc";
  if (ratingValue > 8.0) ratingColor = "#4CAF50";
  else if (ratingValue >= 6.0) ratingColor = "#FFEB3B";
  else ratingColor = "#F44336";

  const goals = getGoals(match);
  const assists = getAssists(match);
  const errors = getErrors(match);
  const goalContrib = getGoalContribution(match);

  return (
    <div
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
        transition:
          "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, background-color 0.2s ease",
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
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Match Date
          </span>
          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>{match.date}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {errors > 0 && (
            <div
              style={{
                width: "28px", height: "28px", borderRadius: "50%",
                backgroundColor: "#F44336", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: "bold",
                boxShadow: "0 0 10px rgba(244,67,54,0.5)", border: "2px solid #fff",
              }}
              title={`${errors} error${errors > 1 ? 's' : ''}`}
            >
              E
            </div>
          )}
          <div
            style={{
              backgroundColor: ratingColor,
              color: ratingValue >= 6 ? "#000" : "#fff",
              borderRadius: "12px",
              padding: "4px 14px",
              fontWeight: "bold",
              fontSize: "18px",
              minWidth: "42px",
              textAlign: "center",
              boxShadow: `0 0 15px ${ratingColor}66`,
            }}
          >
            {match.rating}
          </div>
        </div>
      </div>

      {/* ===== FIFA-STYLE BODY ===== */}
      <div style={{ padding: "16px 20px" }}>
        {/* Location & Time */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>📍</span>
            <span style={{ fontSize: "14px", color: "#555", fontWeight: 500 }}>{match.location}</span>
          </div>
          {match.time && <span style={{ fontSize: "12px", color: "#888" }}>⏱️ {match.time}</span>}
        </div>

        {/* Goal Contribution Summary */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "22px" }}>{match.symbol}</span>
          <span
            style={{
              fontSize: "13px", color: "#666",
              backgroundColor: "#f0f0f0", padding: "2px 10px",
              borderRadius: "12px", fontWeight: 500,
            }}
          >
            {goalContrib} contributions
          </span>
        </div>

        {/* Goal Breakdown */}
        {goals.total > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
              borderRadius: "12px", padding: "14px", border: "1px solid #dee2e6",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>
                Goal Breakdown
              </span>
              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
                {goals.total} <span style={{ fontSize: "12px", color: "#888", fontWeight: "normal" }}>GOALS</span>
              </span>
            </div>

            <div style={{ display: "flex", height: "20px", borderRadius: "10px", overflow: "hidden", backgroundColor: "#e0e0e0", marginBottom: "10px" }}>
              {goals.left > 0 && <div style={{ width: `${(goals.left / goals.total) * 100}%`, backgroundColor: "#4CAF50" }} />}
              {goals.right > 0 && <div style={{ width: `${(goals.right / goals.total) * 100}%`, backgroundColor: "#2196F3" }} />}
              {goals.head > 0 && <div style={{ width: `${(goals.head / goals.total) * 100}%`, backgroundColor: "#FF9800" }} />}
              {goals.other > 0 && <div style={{ width: `${(goals.other / goals.total) * 100}%`, backgroundColor: "#9C27B0" }} />}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "#555" }}>
              {goals.left > 0 && <span><span style={{ color: "#4CAF50", fontWeight: "bold" }}>●</span> Left: {goals.left}</span>}
              {goals.right > 0 && <span><span style={{ color: "#2196F3", fontWeight: "bold" }}>●</span> Right: {goals.right}</span>}
              {goals.head > 0 && <span><span style={{ color: "#FF9800", fontWeight: "bold" }}>●</span> Head: {goals.head}</span>}
              {goals.other > 0 && <span><span style={{ color: "#9C27B0", fontWeight: "bold" }}>●</span> Other: {goals.other}</span>}
            </div>
          </div>
        )}

        {/* Assists row */}
        {assists > 0 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "10px", padding: "6px", backgroundColor: "#e3f2fd", borderRadius: "8px" }}>
            <span style={{ fontSize: "14px" }}>👟</span>
            <span style={{ fontSize: "13px", color: "#1976D2", fontWeight: 500 }}>
              {assists} Assist{assists !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Compare Button */}
        {showCompare && (
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompare();
              }}
              style={{
                padding: "6px 16px", borderRadius: "20px",
                border: "1px solid #2196F3", backgroundColor: "#fff",
                color: "#2196F3", fontWeight: "bold", cursor: "pointer",
                fontSize: "13px", transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e3f2fd"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
            >
              ⚔️ Compare with another contributor
            </button>
          </div>
        )}
      </div>

      {/* ===== FIFA-STYLE FOOTER ===== */}
      <div style={{ backgroundColor: "#f0f0f0", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e0e0e0" }}>
        <span style={{ fontSize: "11px", color: "#888" }}>Source: {match.source || "Unknown"}</span>
        <span style={{ fontSize: "11px", color: "#aaa" }}>{getSeasonLabel(match.date)} Season</span>
      </div>
    </div>
  );
}

// GoalBar component (kept here if needed elsewhere)
export function GoalBar({ icon, label, count, color, max }) {
  const percentage = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{icon}</span>
      <span style={{ fontSize: "12px", color: "#555", width: "70px", fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: "10px", backgroundColor: "#e0e0e0", borderRadius: "5px", overflow: "hidden" }}>
        <div style={{ width: `${percentage}%`, height: "100%", backgroundColor: color, borderRadius: "5px", boxShadow: `0 0 6px ${color}44` }} />
      </div>
      <span style={{ fontSize: "14px", fontWeight: "bold", color: color, minWidth: "20px", textAlign: "right" }}>{count}</span>
    </div>
  );
}

export default FifaMatchCard;