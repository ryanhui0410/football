import React from "react";
import "./PlayerStatsForm.css";

// ---------- Scoreboard stepper ----------
function Stepper({ label, name, value, onChange, min = 0, max = 99 }) {
  const current = parseFloat(value) || 0;
  const adjust = (dir) => {
    const next = Math.min(max, Math.max(min, current + dir));
    onChange({ target: { name, value: String(next) } });
  };
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button type="button" className="step-btn" onClick={() => adjust(-1)} disabled={current <= min}>−</button>
        <input type="text" inputMode="numeric" className="step-value" name={name} value={value} onChange={onChange} autoComplete="off" />
        <button type="button" className="step-btn" onClick={() => adjust(1)} disabled={current >= max}>+</button>
      </div>
    </div>
  );
}

// ---------- Rating slider ----------
function RatingSlider({ label, name, value, onChange }) {
  const num = parseFloat(value) || 0;
  return (
    <div className="rating-block">
      <div className="rating-head">
        <span className="stepper-label">{label}</span>
        <span className="rating-badge">{num.toFixed(1)}</span>
      </div>
      <input type="range" className="rating-slider" name={name} min="0" max="10" step="0.1" value={num} onChange={onChange} style={{ "--fill": `${num * 10}%` }} />
      <div className="rating-scale"><span>0</span><span>5</span><span>10</span></div>
    </div>
  );
}

// ---------- Match result: Us–Them scoreline ----------
function ScorelineInput({ value, onChange }) {
  const parts = (value || "").split("-");
  const us = parts[0] || "";
  const them = parts[1] || "";
  const setSide = (side, raw) => {
    const clean = raw.replace(/\D/g, "");
    const nextUs = side === "us" ? clean : us;
    const nextThem = side === "them" ? clean : them;
    onChange({ target: { name: "MatchResult", value: `${nextUs}-${nextThem}` } });
  };
  const bump = (side, dir) => {
    const cur = parseInt(side === "us" ? us : them) || 0;
    setSide(side, String(Math.max(0, Math.min(99, cur + dir))));
  };
  const Side = ({ side, tag, cls, val }) => (
    <div className="score-side">
      <span className={`score-tag ${cls}`}>{tag}</span>
      <div className="stepper-controls">
        <button type="button" className="step-btn" onClick={() => bump(side, -1)}>−</button>
        <input type="text" inputMode="numeric" className="step-value" value={val} onChange={(e) => setSide(side, e.target.value)} autoComplete="off" />
        <button type="button" className="step-btn" onClick={() => bump(side, 1)}>+</button>
      </div>
    </div>
  );
  return (
    <div className="scoreline">
      <span className="stepper-label">Match Result</span>
      <div className="scoreline-row">
        <Side side="us" tag="Us" cls="us" val={us} />
        <span className="score-dash">–</span>
        <Side side="them" tag="Them" cls="them" val={them} />
      </div>
    </div>
  );
}

// ---------- Win / Loss toggle ----------
function ResultToggle({ value, onChange }) {
  const options = [
    { key: "Win", cls: "win" },
    { key: "Draw", cls: "draw" },
    { key: "Loss", cls: "loss" },
  ];
  return (
    <div className="result-toggle">
      <span className="stepper-label">Win / Loss</span>
      <div className="result-options">
        {options.map((o) => (
          <button key={o.key} type="button" className={`result-btn ${o.cls} ${value === o.key ? "active" : ""}`} onClick={() => onChange({ target: { name: "WinLoss", value: o.key } })}>
            {o.key}
          </button>
        ))}
      </div>
    </div>
  );
}

// ✅ NEW: Man of the Match Toggle
function MotmToggle({ value, onChange }) {
  return (
    <div className="motm-toggle">
      <span className="stepper-label">Man of the Match</span>
      <button
        type="button"
        className={`motm-btn ${value ? "active" : ""}`}
        onClick={() => onChange({ target: { name: "ManOfTheMatch", value: !value } })}
      >
        <span className="motm-icon">🏆</span>
        <span className="motm-text">{value ? "YES — MOTM" : "Not MOTM"}</span>
      </button>
    </div>
  );
}

function PlayerStatsForm({ formData, handleChange, handleSubmit, onCancel, history = {} }) {
  const { contributors = [], locations = [], times = [], sources = [] } = history;

  const n = (v) => parseFloat(v) || 0;
  const goal      = n(formData.Goal);
  const assist    = n(formData.Assist);
  const leftFoot  = n(formData.LeftFoot);
  const rightFoot = n(formData.RightFoot);
  const head      = n(formData.Head);
  const other     = n(formData.OtherBodyParts);
  const bodyTotal = leftFoot + rightFoot + head + other;
  const tallyOk   = goal === bodyTotal;

  const contributor = (formData.Contributor || "").trim();
  const cLower = contributor.toLowerCase();
  const assistRecipient = cLower === "ryan" ? "Darren" : cLower === "darren" ? "Ryan" : "";
  const showAssistTo = assistRecipient !== "" && assist > 0;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!tallyOk) return;
    handleSubmit(e);
  };

  const infoFields = [
    { label: "Date (MM/DD/YYYY)", name: "Date", placeholder: "e.g. 7/12/2026", pattern: "\\d{1,2}/\\d{1,2}/\\d{4}", title: "Enter date in MM/DD/YYYY format" },
    { label: "Contributor", name: "Contributor", list: "contributors", options: contributors },
    { label: "Location", name: "Location", list: "locations", options: locations },
    { label: "Time", name: "Time", list: "times", options: times },
    { label: "Source", name: "source", list: "sources", options: sources },
    { label: "Error", name: "Error" },
  ];

  const statFields = [
    { label: "Goal", name: "Goal" },
    { label: "Assist", name: "Assist" },
    { label: "Left Foot", name: "LeftFoot" },
    { label: "Right Foot", name: "RightFoot" },
    { label: "Head", name: "Head" },
    { label: "Other Body Parts", name: "OtherBodyParts" },
  ];

  return (
    <form onSubmit={handleFormSubmit} className="form-container">
      <div className="form-header">
        <span className="form-kicker">MATCH DAY</span>
        <h2 className="form-title">Add Player Stats</h2>
      </div>

      {/* ---- Match info ---- */}
      <section className="form-section">
        <h3 className="section-title">Match Info</h3>
        <div className="info-grid">
          {infoFields.map((f) => (
            <div className="field-box" key={f.name}>
              <label className="info-label">
                {f.label}
                <input type="text" name={f.name} value={formData[f.name]} onChange={handleChange} autoComplete="off"
                  {...(f.placeholder && { placeholder: f.placeholder })}
                  {...(f.pattern && { pattern: f.pattern })}
                  {...(f.title && { title: f.title })}
                  {...(f.list && { list: f.list })}
                />
              </label>
              {f.options && (
                <datalist id={f.list}>
                  {f.options.map((o) => <option key={o} value={o} />)}
                </datalist>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---- Match outcome ---- */}
      <section className="form-section">
        <h3 className="section-title">Match Outcome</h3>
        <div className="outcome-grid">
          <ScorelineInput value={formData.MatchResult} onChange={handleChange} />
          <ResultToggle value={formData.WinLoss} onChange={handleChange} />
        </div>
      </section>

      {/* ---- Scoreboard ---- */}
      <section className="form-section">
        <h3 className="section-title">Scoreboard</h3>
        <div className="stat-grid">
          {statFields.map((f) => (
            <Stepper key={f.name} {...f} value={formData[f.name]} onChange={handleChange} />
          ))}
        </div>
        <RatingSlider label="Rating" name="Rating" value={formData.Rating} onChange={handleChange} />

        {/* ---- Live tally check ---- */}
        {tallyOk ? (
          <div className="tally-bar ok">
            <span className="tally-icon">✓</span>
            <span><strong>TALLY OK</strong> — Goal ({goal}) = Left Foot ({leftFoot}) + Right Foot ({rightFoot}) + Head ({head}) + Other ({other})</span>
          </div>
        ) : (
          <div className="tally-bar error" role="alert">
            <span className="red-card" aria-hidden="true"></span>
            <span><strong>VAR CHECK — GOAL MISMATCH!</strong> Goal ({goal}) must equal Left Foot ({leftFoot}) + Right Foot ({rightFoot}) + Head ({head}) + Other ({other}) = <strong>{bodyTotal}</strong>. Off by <strong>{Math.abs(goal - bodyTotal)}</strong>.</span>
          </div>
        )}
      </section>

      {/* ✅ NEW: Man of the Match Section */}
      <section className="form-section">
        <h3 className="section-title">Recognition</h3>
        <MotmToggle value={!!formData.ManOfTheMatch} onChange={handleChange} />
      </section>

      {/* ---- Assist detail (only for Ryan/Darren with assists) ---- */}
      {showAssistTo && (
        <section className="form-section">
          <h3 className="section-title">Assist Detail</h3>
          <div className="assist-to-grid">
            <Stepper label={`No. of assist to ${assistRecipient}`} name="AssistTo" value={formData.AssistTo} onChange={handleChange} min={0} max={assist} />
            <div className="assist-to-note">
              <span className="assist-to-hint">
                {contributor} had <strong>{assist}</strong> assist{assist !== 1 ? "s" : ""} — how many went to <strong>{assistRecipient}</strong>?
              </span>
            </div>
          </div>
        </section>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-save" disabled={!tallyOk}>Save Stats</button>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default PlayerStatsForm;