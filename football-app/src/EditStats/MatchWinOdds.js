import React from "react";
import "./MatchWinOdds.css";

/**
 * Calculates the arithmetic mean of player overall ratings on a team.
 */
export function getTeamAvgRating(teamObj, availablePlayers = []) {
  if (!teamObj) return null;
  const playersArr = Array.isArray(teamObj.players)
    ? teamObj.players
    : Object.values(teamObj.players || {});
  const subsArr = Array.isArray(teamObj.subs)
    ? teamObj.subs
    : Object.values(teamObj.subs || {});
  const roster = [...playersArr, ...subsArr].filter((p) => p && p.Contributor);
  if (!roster.length) return null;

  const ratings = roster.map((p) => {
    const target = p.Contributor.trim().toLowerCase();
    const prof = availablePlayers.find(
      (ap) => (ap.Contributor || "").trim().toLowerCase() === target
    );
    // Try: profile overall → profile PAC → lineup match rating → default 70
    const val = prof?.overall ?? prof?.PAC ?? prof?.DIV ?? p.rating;
    const num = parseFloat(val);
    return isNaN(num) ? 70 : num;
  });

  return ratings.reduce((sum, n) => sum + n, 0) / ratings.length;
}

/**
 * Predicts Team A Win %, Draw %, and Team B Win % from average team ratings.
 */
export function calcMatchWinOdds(avgA, avgB) {
  if (avgA == null || avgB == null) return null;
  const diff = avgA - avgB;
  const rawA = 1 / (1 + Math.exp(-diff / 8.0));
  const rawB = 1 - rawA;
  const drawWeight = 0.26 * Math.exp(-Math.pow(diff / 12.0, 2));
  const nonDraw = 1 - drawWeight;

  let teamA = Math.round(nonDraw * rawA * 100);
  let draw = Math.round(drawWeight * 100);
  let teamB = 100 - teamA - draw;

  if (teamB < 0) {
    teamB = 0;
    const total = teamA + draw || 1;
    teamA = Math.round((teamA / total) * 100);
    draw = 100 - teamA;
  }

  return { teamA, draw, teamB };
}

/**
 * Parses a "X-Y" scoreline and returns "A", "B", "D", or null.
 */
export function parseScoreWinner(matchResult) {
  const parts = (matchResult || "").split("-").map((s) => parseInt(s.trim(), 10));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  if (parts[0] > parts[1]) return "A";
  if (parts[1] > parts[0]) return "B";
  return "D";
}

function MatchWinOdds({ teamA, teamB, availablePlayers = [], matchResult = "" }) {
  const avgA = getTeamAvgRating(teamA, availablePlayers);
  const avgB = getTeamAvgRating(teamB, availablePlayers);
  const odds = calcMatchWinOdds(avgA, avgB);
  const winner = parseScoreWinner(matchResult);

   // ── TEMPORARY DEBUG — remove after fixing ──
  if (!odds) {
  alert(`⚠ Win Odds hidden — avgA: ${avgA}, avgB: ${avgB}, teamA: ${teamA?.players?.length}, teamB: ${teamB?.players?.length}`);
  return null;
}

    // ── VISIBLE DEBUG — always shows something ──
  return (
    <div style={{
      padding: "12px 14px",
      margin: "10px 0",
      background: odds ? "#dcfce7" : "#fef3c7",
      border: odds ? "1px solid #86efac" : "1px solid #fcd34d",
      borderRadius: "10px",
      fontSize: "13px",
      color: odds ? "#166534" : "#92400e",
    }}>
      {odds ? (
        <div className="match-odds-bar">
          <div className={`match-odds-item ${winner === "A" ? "is-winner" : ""}`}>
            <span className="match-odds-label">Team A Win {avgA != null ? `(Avg ${avgA.toFixed(1)})` : ""}</span>
            <span className="match-odds-value">{odds.teamA}%</span>
          </div>
          <div className={`match-odds-item draw ${winner === "D" ? "is-winner" : ""}`}>
            <span className="match-odds-label">Draw</span>
            <span className="match-odds-value">{odds.draw}%</span>
          </div>
          <div className={`match-odds-item ${winner === "B" ? "is-winner" : ""}`}>
            <span className="match-odds-label">Team B Win {avgB != null ? `(Avg ${avgB.toFixed(1)})` : ""}</span>
            <span className="match-odds-value">{odds.teamB}%</span>
          </div>
        </div>
      ) : (
        <div>
          ⚠ Win Odds unavailable<br/>
          avgA: {String(avgA)} | avgB: {String(avgB)}<br/>
          teamA players: {String(teamA?.players?.length)} | teamB players: {String(teamB?.players?.length)}
        </div>
      )}
    </div>
  );
}

export default MatchWinOdds;
