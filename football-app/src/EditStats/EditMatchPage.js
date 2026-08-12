import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EditMatchPage.css";
import MatchLineup from "./MatchLineup";

function EditMatchPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  
  const [isEditingLineup, setIsEditingLineup] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [lineupData, setLineupData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/stats");
        const data = await res.json();
        setFormData(data[index]);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchData();
  }, [index]);

  useEffect(() => {
    if (isEditingLineup && availablePlayers.length === 0) {
      fetch("http://localhost:5000/player-attributes")
        .then(res => res.json())
        .then(data => setAvailablePlayers(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [isEditingLineup, availablePlayers.length]);

  useEffect(() => {
    if (isEditingLineup && formData) {
      fetch("http://localhost:5000/match-lineups")
        .then(res => res.json())
        .then(lineups => {
          const match = lineups.find(l => 
            l.date === formData.Date && 
            l.location === formData.Location && 
            l.time === formData.Time
          );
          if (match) setLineupData(match);
          else setLineupData({ teamA: { formation: "4-4-2", players: {} }, teamB: { formation: "4-4-2", players: {} } });
        })
        .catch(console.error);
    }
  }, [isEditingLineup, formData]);

  const handleSaveStats = async () => {
    const resultStr = formData["Match result"] || "";
    const calculatedWL = calculateWinLoss(resultStr);

    await fetch(`http://localhost:5000/modify-stats/${index}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, "Win/Loss?": calculatedWL }),
    });
    
    alert("✅ Stat updated!");
    navigate("/modify");
  };

  const handleSaveLineup = async (lineupData) => {
    if (!formData) return;

    const payload = {
      date: formData.Date,
      location: formData.Location,
      time: formData.Time,
      teamA: lineupData.teamA,
      teamB: lineupData.teamB,
    };

    console.log("📤 Sending lineup payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch("http://localhost:5000/match-lineups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      console.log("📥 Server response:", result);
      alert("✅ Match Report saved!");
    } catch (err) {
      console.error("Save failed:", err);
      alert("❌ Failed to save match report");
    }
  };

  function calculateWinLoss(resultStr) {
    if (!resultStr) return "";
    const parts = resultStr.split("-");
    if (parts.length === 2) {
      const s1 = parseInt(parts[0], 10);
      const s2 = parseInt(parts[1], 10);
      if (!isNaN(s1) && !isNaN(s2)) {
        if (s1 > s2) return "Win";
        if (s1 === s2) return "Draw";
        if (s1 < s2) return "Lose";
      }
    }
    return "";
  }

  const getRatingColor = (rating) => {
    const r = parseFloat(rating);
    if (isNaN(r)) return '#9e9e9e';
    if (r >= 9.0) return '#2563eb';
    if (r >= 7.0) return '#16a34a';
    if (r >= 5.0) return '#ea580c';
    return '#dc2626';
  };

  if (!formData) {
    return (
      <div className="em-loading">
        <div className="em-ball">⚽</div>
        <p>Loading match…</p>
      </div>
    );
  }

  const goal   = parseInt(formData.Goal) || 0;
  const assist = parseInt(formData.Assist) || 0;
  const gc     = parseInt(formData["Goal Contribution"]) || goal + assist;
  const result = formData["Match result"];
  const wl     = formData["Win/Loss?"];
  const isMotm = formData["Man of the Match"] === true; // ✅ 读取 MOTM

  const icons = [
    ...Array.from({ length: goal },   () => ({ cls: "goal",   ch: "⚽" })),
    ...Array.from({ length: assist }, () => ({ cls: "assist", ch: "👟" })),
  ];

  // ✅ 将图标按每行最多 5 个分组
  const chunkSize = 5;
  const iconRows = [];
  for (let i = 0; i < icons.length; i += chunkSize) {
    iconRows.push(icons.slice(i, i + chunkSize));
  }

  const breakdown = [
    { label: "Left Foot",  val: formData["Left Foot"] },
    { label: "Right Foot", val: formData["Right Foot"] },
    { label: "Head",       val: formData["Head"] },
    { label: "Other",      val: formData["Other body parts"] },
  ];

  // 构建 result 样式类
  const wlNorm = String(wl || '').trim().toLowerCase();

  return (
    <div className="em-wrap">
      {/* ---- Header ---- */}
      <div className="em-header">
        <div>
          <span className="em-kicker">MATCH REPORT</span>
          <h1 className="em-player">{formData.Contributor}</h1>
        </div>
        <div className="em-date-badge">
          <span className="em-date-day">{formData.Date}</span>
          {formData.Season && <span className="em-season">{formData.Season}</span>}
        </div>
      </div>

      {/* ---- Scoreline ---- */}
      {(result || wl) && (
        <div className={`em-result-strip em-result-${wlNorm}`}>
          {result && <span className="em-scoreline">{result}</span>}
          {wl && <span className={`em-wl ${wlNorm}`}>{wl}</span>}
        </div>
      )}

      {/* ---- Goal Contributions ---- */}
      <section className="em-card em-contrib">
        <h2 className="em-card-title">Goal Contributions</h2>
        <div className="em-icons-wrapper">
          {icons.length === 0 && <span className="em-icon empty">No goal involvements</span>}
          {iconRows.map((row, rowIdx) => (
            <div key={rowIdx} className="em-icons-row">
              {row.map((ic, i) => (
                <span key={i} className={`em-icon ${ic.cls}`} style={{ animationDelay: `${(rowIdx * chunkSize + i) * 70}ms` }}>
                  {ic.ch}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="em-contrib-stats">
          <div className="em-stat"><span className="em-stat-num">{goal}</span><span className="em-stat-label">Goals</span></div>
          <div className="em-stat"><span className="em-stat-num">{assist}</span><span className="em-stat-label">Assists</span></div>
          <div className="em-stat highlight"><span className="em-stat-num">{gc}</span><span className="em-stat-label">Goal Contrib.</span></div>
        </div>
      </section>

      {/* ---- Scoring Breakdown ---- */}
      <section className="em-card">
        <h2 className="em-card-title">How the goals came</h2>
        <div className="em-breakdown">
          {breakdown.map((b) => (
            <div key={b.label} className="em-chip">
              <span className="em-chip-val">{parseInt(b.val) || 0}</span>
              <span className="em-chip-label">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Match Details ---- */}
      <section className="em-card">
        <h2 className="em-card-title">Match Details</h2>
        <div className="em-details">
          <div className="em-detail"><span className="em-detail-label">📍 Location</span><span className="em-detail-val">{formData.Location || "—"}</span></div>
          <div className="em-detail"><span className="em-detail-label">🕒 Time</span><span className="em-detail-val">{formData.Time || "—"}</span></div>
          <div className="em-detail">
            <span className="em-detail-label">⭐ Rating</span>
            <span className="em-detail-val em-rating">
              {isMotm && <span className="em-motm-star">⭐</span>}
              {formData.Rating}
            </span>
          </div>
          <div className="em-detail"><span className="em-detail-label">📝 Source</span><span className="em-detail-val">{formData.source || "—"}</span></div>
        </div>
      </section>

      {/* ---- LINEUP SECTION ---- */}
      <section className="em-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="em-card-title" style={{ margin: 0 }}>Tactical Lineup</h2>
          {!isEditingLineup && (
            <button 
              onClick={() => setIsEditingLineup(true)}
              style={{
                padding: '8px 16px', background: '#f2c14e', border: 'none', borderRadius: '6px',
                fontWeight: 600, cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase'
              }}
            >
              ✏️ Edit Lineup
            </button>
          )}
        </div>

        {isEditingLineup ? (
          <>
            <MatchLineup
              matchData={{ Date: formData.Date, Location: formData.Location, Time: formData.Time }}
              initialLineup={lineupData || { teamA: { formation: "4-4-2", players: {} }, teamB: { formation: "4-4-2", players: {} } }}
              readOnly={false}
              editMode={true}
              layout="horizontal"
              availablePlayers={availablePlayers}
              getRatingColor={getRatingColor}
              onLineupChange={(newLineup) => {
                setLineupData({
                  date: formData.Date,
                  location: formData.Location,
                  time: formData.Time,
                  ...newLineup,
                });
              }}
            />
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsEditingLineup(false)}
                style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSaveLineup(lineupData)}
                disabled={!lineupData}
                style={{ 
                  padding: '10px 20px', 
                  background: lineupData ? '#10b981' : '#94a3b8', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: lineupData ? 'pointer' : 'not-allowed', 
                  fontWeight: 600 
                }}
              >
                💾 Save Lineup
              </button>
            </div>
          </>
        ) : null}
      </section>

      {/* ---- Actions ---- */}
      <div className="em-actions">
        <button className="em-btn save" onClick={handleSaveStats}>Save Changes</button>
        <button className="em-btn cancel" onClick={() => navigate("/modify")}>Cancel</button>
      </div>
    </div>
  );
}

export default EditMatchPage;