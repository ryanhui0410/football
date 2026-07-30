import React from "react";
import "./PlayerStatsForm.css";

// ---------- Scoreboard stepper (replaces number inputs) ----------
function Stepper({ label, name, value, onChange, min = 0, max = 99 }) {
  const current = parseFloat(value) || 0;

  const adjust = (dir) => {
    const next = Math.min(max, Math.max(min, current + dir));
    onChange({ target: { name, value: String(next) } }); // same shape as handleChange expects
  };

  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button type="button" className="step-btn" onClick={() => adjust(-1)} disabled={current <= min}>−</button>
        <input
          type="text"
          inputMode="numeric"
          className="step-value"
          name={name}
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
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
      <input
        type="range"
        className="rating-slider"
        name={name}
        min="0"
        max="10"
        step="0.1"
        value={num}
        onChange={onChange}
        style={{ "--fill": `${num * 10}%` }}
      />
      <div className="rating-scale"><span>0</span><span>5</span><span>10</span></div>
    </div>
  );
}

function PlayerStatsForm({ formData, handleChange, handleSubmit, onCancel, history = {} }) {
  const { contributors = [], locations = [], times = [], sources = [] } = history;

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
    <form onSubmit={handleSubmit} className="form-container">
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
                <input
                  type="text"
                  name={f.name}
                  value={formData[f.name]}
                  onChange={handleChange}
                  autoComplete="off"
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

      {/* ---- Scoreboard ---- */}
      <section className="form-section">
        <h3 className="section-title">Scoreboard</h3>
        <div className="stat-grid">
          {statFields.map((f) => (
            <Stepper key={f.name} {...f} value={formData[f.name]} onChange={handleChange} />
          ))}
        </div>
        <RatingSlider label="Rating" name="Rating" value={formData.Rating} onChange={handleChange} />
      </section>

      <div className="form-actions">
        <button type="submit" className="btn-save">Save Stats</button>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default PlayerStatsForm;