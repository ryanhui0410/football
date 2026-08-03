import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EditMatchPage.css";

function EditMatchPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5000/stats");
      const data = await res.json();
      setFormData(data[index]);
    };
    fetchData();
  }, [index]);

  const handleSave = async () => {
    await fetch(`http://localhost:5000/modify-stats/${index}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    alert("✅ Stat updated!");
    navigate("/modify");
  };

  const handleCancel = () => navigate("/modify");

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

  // build the icon row: one ⚽ per goal, one 👟 per assist
  const icons = [
    ...Array.from({ length: goal },   () => ({ cls: "goal",   ch: "⚽" })),
    ...Array.from({ length: assist }, () => ({ cls: "assist", ch: "👟" })),
  ];

  const breakdown = [
    { label: "Left Foot",  val: formData["Left Foot"] },
    { label: "Right Foot", val: formData["Right Foot"] },
    { label: "Head",       val: formData["Head"] },
    { label: "Other",      val: formData["Other body parts"] },
  ];

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

      {/* ---- Scoreline + result ---- */}
      {(result || wl) && (
        <div className="em-result-strip">
          {result && <span className="em-scoreline">{result}</span>}
          {wl && <span className={`em-wl ${String(wl).toLowerCase()}`}>{wl}</span>}
        </div>
      )}

      {/* ---- Goal Contributions hero (symbols live here) ---- */}
      <section className="em-card em-contrib">
        <h2 className="em-card-title">Goal Contributions</h2>
        <div className="em-icons">
          {icons.length === 0 && <span className="em-icon empty">No goal involvements</span>}
          {icons.map((ic, i) => (
            <span
              key={i}
              className={`em-icon ${ic.cls}`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {ic.ch}
            </span>
          ))}
        </div>
        <div className="em-contrib-stats">
          <div className="em-stat">
            <span className="em-stat-num">{goal}</span>
            <span className="em-stat-label">Goals</span>
          </div>
          <div className="em-stat">
            <span className="em-stat-num">{assist}</span>
            <span className="em-stat-label">Assists</span>
          </div>
          <div className="em-stat highlight">
            <span className="em-stat-num">{gc}</span>
            <span className="em-stat-label">Goal Contrib.</span>
          </div>
        </div>
      </section>

      {/* ---- Scoring breakdown ---- */}
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

      {/* ---- Match details ---- */}
      <section className="em-card">
        <h2 className="em-card-title">Match Details</h2>
        <div className="em-details">
          <div className="em-detail">
            <span className="em-detail-label">📍 Location</span>
            <span className="em-detail-val">{formData.Location || "—"}</span>
          </div>
          <div className="em-detail">
            <span className="em-detail-label">🕒 Time</span>
            <span className="em-detail-val">{formData.Time || "—"}</span>
          </div>
          <div className="em-detail">
            <span className="em-detail-label">⭐ Rating</span>
            <span className="em-detail-val em-rating">{formData.Rating}</span>
          </div>
          <div className="em-detail">
            <span className="em-detail-label">📝 Source</span>
            <span className="em-detail-val">{formData.source || "—"}</span>
          </div>
        </div>
      </section>

      {/* ---- Actions ---- */}
      <div className="em-actions">
        <button className="em-btn save" onClick={handleSave}>Save Changes</button>
        <button className="em-btn cancel" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default EditMatchPage;