import React from "react";
import "./HeadToHeadCompare.css"; 
// ✅ FIXED: Goal formula = Left + Right + Head + Other
const getGoals = (m) => {
  const left = parseInt(m.LeftFoot || m['Left Foot'] || m.leftFoot || 0);
  const right = parseInt(m.RightFoot || m['Right Foot'] || m.rightFoot || 0);
  const head = parseInt(m.Head || m['Head'] || m.head || 0);
  const other = parseInt(m.OtherBodyParts || m['Other body parts'] || m.otherBodyParts || 0);
  return { left, right, head, other, total: left + right + head + other };
};

const getAssists = (m) => parseInt(m.Assist || m.assist || 0);
const getErrors = (m) => parseInt(m.Error || m['Error?'] || m.error || 0);

// Rating color helper matching your criteria
const getRatingColor = (rating) => {
  const r = parseFloat(rating);
  if (isNaN(r)) return '#94a3b8';
  if (r >= 9.0) return '#2563eb';
  if (r >= 7.0) return '#16a34a';
  if (r >= 5.0) return '#ea580c';
  return '#dc2626';
};

function HeadToHeadCompare({ open, onClose, compareData }) {
  if (!open || !compareData) return null;

  const { contributor1, match1, contributor2, match2 } = compareData;
  const g1 = getGoals(match1);
  const g2 = getGoals(match2);
  const a1 = getAssists(match1);
  const a2 = getAssists(match2);
  const e1 = getErrors(match1);
  const e2 = getErrors(match2);

  // Determine winner by rating for subtle highlight
  const r1 = parseFloat(match1.rating) || 0;
  const r2 = parseFloat(match2.rating) || 0;

  return (
    <div className="h2h-overlay" onClick={onClose}>
      <div className="h2h-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="h2h-close" onClick={onClose}>✕</button>

        {/* Header */}
        <h2 className="h2h-title">⚔️ Head‑to‑Head</h2>
        <div className="h2h-match-info">
          {match1.date} • {match1.location}{match1.time ? ` • ${match1.time}` : ''}
        </div>

        {/* VS Layout */}
        <div className="h2h-body">
          {/* Player 1 */}
          <div className={`h2h-player ${r1 > r2 ? 'winner' : ''}`}>
            <h3 className="h2h-name">{contributor1}</h3>

            <div className="h2h-rating-badge" style={{ color: getRatingColor(r1) }}>
              {r1.toFixed(1)}
            </div>

            <div className="h2h-stats-grid">
              <div className="h2h-stat">
                <span className="h2h-stat-val">{g1.total}</span>
                <span className="h2h-stat-label">Goals</span>
              </div>
              <div className="h2h-stat">
                <span className="h2h-stat-val">{a1}</span>
                <span className="h2h-stat-label">Assists</span>
              </div>
              <div className="h2h-stat">
                <span className="h2h-stat-val" style={{ color: e1 > 0 ? '#dc2626' : '#16a34a' }}>{e1}</span>
                <span className="h2h-stat-label">Errors</span>
              </div>
            </div>

            {/* Goal Breakdown */}
            <div className="h2h-breakdown">
              <div className="h2h-chip"><span className="h2h-chip-val">{g1.left}</span><span className="h2h-chip-label">L</span></div>
              <div className="h2h-chip"><span className="h2h-chip-val">{g1.right}</span><span className="h2h-chip-label">R</span></div>
              <div className="h2h-chip"><span className="h2h-chip-val">{g1.head}</span><span className="h2h-chip-label">H</span></div>
              <div className="h2h-chip"><span className="h2h-chip-val">{g1.other}</span><span className="h2h-chip-label">O</span></div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="h2h-vs">VS</div>

          {/* Player 2 */}
          <div className={`h2h-player ${r2 > r1 ? 'winner' : ''}`}>
            <h3 className="h2h-name">{contributor2}</h3>

            <div className="h2h-rating-badge" style={{ color: getRatingColor(r2) }}>
              {r2.toFixed(1)}
            </div>

            <div className="h2h-stats-grid">
              <div className="h2h-stat">
                <span className="h2h-stat-val">{g2.total}</span>
                <span className="h2h-stat-label">Goals</span>
              </div>
              <div className="h2h-stat">
                <span className="h2h-stat-val">{a2}</span>
                <span className="h2h-stat-label">Assists</span>
              </div>
              <div className="h2h-stat">
                <span className="h2h-stat-val" style={{ color: e2 > 0 ? '#dc2626' : '#16a34a' }}>{e2}</span>
                <span className="h2h-stat-label">Errors</span>
              </div>
            </div>

            {/* Goal Breakdown */}
            <div className="h2h-breakdown">
              <div className="h2h-chip"><span className="h2h-chip-val">{g2.left}</span><span className="h2h-chip-label">L</span></div>
              <div className="h2h-chip"><span className="h2h-chip-val">{g2.right}</span><span className="h2h-chip-label">R</span></div>
              <div className="h2h-chip"><span className="h2h-chip-val">{g2.head}</span><span className="h2h-chip-label">H</span></div>
              <div className="h2h-chip"><span className="h2h-chip-val">{g2.other}</span><span className="h2h-chip-label">O</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h2h-footer">
          <button className="h2h-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default HeadToHeadCompare;