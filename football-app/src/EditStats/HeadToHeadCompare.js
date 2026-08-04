import React from "react";

// Helpers – same as used elsewhere
const getGoals = (m) => {
  const left = parseInt(m.LeftFoot || m['Left Foot'] || m.leftFoot || 0);
  const right = parseInt(m.RightFoot || m['Right Foot'] || m.rightFoot || 0);
  const head = parseInt(m.Head || m['Head'] || m.head || 0);
  const other = parseInt(m.OtherBodyParts || m['Other body parts'] || m.otherBodyParts || 0);
  return { left, right, head, other, total: left + right + head + other };
};

const getAssists = (m) => parseInt(m.Assist || m.assist || 0);
const getErrors = (m) => parseInt(m.Error || m['Error?'] || m.error || 0);

function HeadToHeadCompare({ open, onClose, compareData }) {
  if (!open || !compareData) return null;

  const { contributor1, match1, contributor2, match2 } = compareData;
  const g1 = getGoals(match1);
  const g2 = getGoals(match2);
  const a1 = getAssists(match1);
  const a2 = getAssists(match2);
  const e1 = getErrors(match1);
  const e2 = getErrors(match2);

  // Color variables for cleaner text hierarchy
  const labelColor = "#444444"; // Darker grey for the words
  const valueColor = "#111111"; // Very dark for the actual numbers/names

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
      justifyContent: "center", alignItems: "center", zIndex: 9999,
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "24px",
        maxWidth: "550px", width: "90%", boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
        color: labelColor // Apply darker grey to all text by default
      }}>
        <h2 style={{ marginTop: 0, textAlign: "center", color: valueColor }}>⚔️ Head‑to‑Head</h2>
        <div style={{ textAlign: "center", color: "#666", marginBottom: "15px" }}>
          {match1.date} • {match1.location} {match1.time ? `• ${match1.time}` : ''}
        </div>

        <div style={{ display: "flex", justifyContent: "space-around", gap: "10px" }}>
          {/* Contributor 1 */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <h3 style={{ marginBottom: "10px", color: valueColor }}>{contributor1}</h3>
            <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
              <div>⭐ Rating: <strong style={{ color: valueColor }}>{match1.rating}</strong></div>
              <div>⚽ Goals: <strong style={{ color: valueColor }}>{g1.total}</strong></div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                (L: {g1.left} | R: {g1.right} | H: {g1.head}{g1.other ? ` | O: ${g1.other}` : ''})
              </div>
              <div>👟 Assists: <strong style={{ color: valueColor }}>{a1}</strong></div>
              <div style={{ color: e1 > 0 ? "#d32f2f" : "#388e3c" }}>
                ❌ Errors: <strong style={{ color: e1 > 0 ? "#d32f2f" : "#388e3c" }}>{e1}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", fontSize: "24px", color: "#888", fontWeight: "bold" }}>
            VS
          </div>

          {/* Contributor 2 */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <h3 style={{ marginBottom: "10px", color: valueColor }}>{contributor2}</h3>
            <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
              <div>⭐ Rating: <strong style={{ color: valueColor }}>{match2.rating}</strong></div>
              <div>⚽ Goals: <strong style={{ color: valueColor }}>{g2.total}</strong></div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                (L: {g2.left} | R: {g2.right} | H: {g2.head}{g2.other ? ` | O: ${g2.other}` : ''})
              </div>
              <div>👟 Assists: <strong style={{ color: valueColor }}>{a2}</strong></div>
              <div style={{ color: e2 > 0 ? "#d32f2f" : "#388e3c" }}>
                ❌ Errors: <strong style={{ color: e2 > 0 ? "#d32f2f" : "#388e3c" }}>{e2}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Removed the "Winner highlight" section as requested */}

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button onClick={onClose}
            style={{
              padding: "10px 30px", borderRadius: "8px", border: "none",
              backgroundColor: "#2196F3", color: "#fff", cursor: "pointer",
              fontWeight: "bold", fontSize: "14px", boxShadow: "0 4px 10px rgba(33, 150, 243, 0.3)"
            }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default HeadToHeadCompare;