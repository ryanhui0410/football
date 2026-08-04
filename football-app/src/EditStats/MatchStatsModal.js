import React from "react";
import "./MatchStatsModal.css";

function MatchStatsModal({ open, match, onClose }) {
  if (!open || !match) return null;

  const goals = Math.max(0, (match.goalContribution || 0) - (match.assist || 0));
  
  return (
    <div className="msm-overlay" onClick={onClose}>
      <div className="msm-container" onClick={(e) => e.stopPropagation()}>
        <button className="msm-close-btn" onClick={onClose}>✕</button>
        
        <div className="msm-header">
          <div>
            <span className="msm-kicker">MATCH REPORT</span>
            <h1 className="msm-player">{match.contributorName}</h1>
          </div>
          <div className="msm-date-badge">
            <span className="msm-date">{match.date}</span>
            {match.season && <span className="msm-season">{match.season}</span>}
          </div>
        </div>

        <div className="msm-grid">
          {/* LEFT COLUMN */}
          <div className="msm-col">
            <div className="msm-card msm-highlight">
              <h3 className="msm-card-title">Match Overview</h3>
              <div className="msm-overview-row">
                <div className="msm-ov-item">
                  <span className="msm-ov-label">Location</span>
                  <span className="msm-ov-val">📍 {match.location || "—"}</span>
                </div>
                <div className="msm-ov-item">
                  <span className="msm-ov-label">Time</span>
                  <span className="msm-ov-val">🕒 {match.time || "—"}</span>
                </div>
              </div>
              {match.matchResult && (
                <div className="msm-result-strip">
                  <span className="msm-scoreline">{match.matchResult}</span>
                  {match.winLoss && (
                    <span className={`msm-wl ${match.winLoss.toLowerCase()}`}>
                      {match.winLoss}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="msm-card">
              <h3 className="msm-card-title">Performance Rating</h3>
              <div className="msm-rating-hero">{match.rating || "—"}</div>
            </div>
              {/* NEW: Assists Given Card */}
            <div className="msm-card">
              <h3 className="msm-card-title">Assists Given</h3>
              <div className="msm-overview-row">
                <div className="msm-ov-item">
                  <span className="msm-ov-label">Assisted Player</span>
                  {/* Fallbacks ensure it works whether it reads from the Match class or raw JSON */}
                  <span className="msm-ov-val">👟 {match.assistTo || match["Assist to"] || "—"}</span>
                </div>
                <div className="msm-ov-item">
                  <span className="msm-ov-label">Assist Count</span>
                  <span className="msm-ov-val">{match.assistToCount || match["Assist to count"] || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="msm-col">
            <div className="msm-card">
              <h3 className="msm-card-title">Goal Contributions</h3>
              <div className="msm-symbols">
                {match.symbol ? match.symbol : <span className="msm-empty">No symbols</span>}
              </div>
              <div className="msm-stat-row">
                <div className="msm-stat">
                  <div className="msm-stat-num">{goals}</div>
                  <div className="msm-stat-label">Goals</div>
                </div>
                <div className="msm-stat">
                  <div className="msm-stat-num">{match.assist || 0}</div>
                  <div className="msm-stat-label">Assists</div>
                </div>
                <div className="msm-stat highlight">
                  <div className="msm-stat-num">{match.goalContribution || 0}</div>
                  <div className="msm-stat-label">Total</div>
                </div>
              </div>
            </div>

            <div className="msm-card">
              <h3 className="msm-card-title">Goal Breakdown</h3>
              <div className="msm-breakdown">
                <div className="msm-chip">
                  <span className="msm-chip-val">{match.leftFoot || 0}</span>
                  <span className="msm-chip-label">Left</span>
                </div>
                <div className="msm-chip">
                  <span className="msm-chip-val">{match.rightFoot || 0}</span>
                  <span className="msm-chip-label">Right</span>
                </div>
                <div className="msm-chip">
                  <span className="msm-chip-val">{match.head || 0}</span>
                  <span className="msm-chip-label">Head</span>
                </div>
                <div className="msm-chip">
                  <span className="msm-chip-val">{match.other || 0}</span>
                  <span className="msm-chip-label">Other</span>
                </div>
              </div>
            </div>

            <div className="msm-card msm-source">
              <span className="msm-source-label">Source:</span>
              <span className="msm-source-val">{match.source || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatchStatsModal;