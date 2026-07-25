import React from "react";
import "./PlayerStatsForm.css";

function PlayerStatsForm({ formData, handleChange, handleSubmit, onCancel, history = {} }) {
  const { contributors = [], locations = [], times = [], sources = [] } = history;

  return (
    <form onSubmit={handleSubmit} className="form-container">
      {/* Date – now a text input */}
      <div className="field-box">
        <label>
          Date (MM/DD/YYYY):
          <input
            type="text"
            name="Date"
            value={formData.Date}
            onChange={handleChange}
            placeholder="e.g. 7/12/2026"
            pattern="\d{1,2}/\d{1,2}/\d{4}"
            title="Enter date in MM/DD/YYYY format"
          />
        </label>
      </div>

      {/* Contributor – unchanged (with datalist) */}
      <div className="field-box">
        <label>
          Contributor:
          <input
            list="contributors"
            name="Contributor"
            value={formData.Contributor}
            onChange={handleChange}
            autoComplete="off"
          />
          <datalist id="contributors">
            {contributors.map(c => <option key={c} value={c} />)}
          </datalist>
        </label>
      </div>

      {/* Goal – number */}
      <div className="field-box">
        <label>
          Goal:
          <input type="number" name="Goal" value={formData.Goal} onChange={handleChange} />
        </label>
      </div>

      {/* Assist – number */}
      <div className="field-box">
        <label>
          Assist:
          <input type="number" name="Assist" value={formData.Assist} onChange={handleChange} />
        </label>
      </div>

      {/* Rating – number (can be decimal) */}
      <div className="field-box">
        <label>
          Rating:
          <input type="number" step="0.1" name="Rating" value={formData.Rating} onChange={handleChange} />
        </label>
      </div>

      {/* Location – text (with datalist) */}
      <div className="field-box">
        <label>
          Location:
          <input
            list="locations"
            name="Location"
            value={formData.Location}
            onChange={handleChange}
            autoComplete="off"
          />
          <datalist id="locations">
            {locations.map(l => <option key={l} value={l} />)}
          </datalist>
        </label>
      </div>

      {/* Time – text (with datalist) */}
      <div className="field-box">
        <label>
          Time:
          <input
            list="times"
            name="Time"
            value={formData.Time}
            onChange={handleChange}
            autoComplete="off"
          />
          <datalist id="times">
            {times.map(t => <option key={t} value={t} />)}
          </datalist>
        </label>
      </div>

      {/* Error – text (could be a note) */}
      <div className="field-box">
        <label>
          Error:
          <input type="text" name="Error" value={formData.Error} onChange={handleChange} />
        </label>
      </div>

      {/* Source – text (with datalist) */}
      <div className="field-box">
        <label>
          Source:
          <input
            list="sources"
            name="source"   // note: lowercase 's' – matches JSON field 'source'
            value={formData.source}
            onChange={handleChange}
            autoComplete="off"
          />
          <datalist id="sources">
            {sources.map(s => <option key={s} value={s} />)}
          </datalist>
        </label>
      </div>

      {/* LeftFoot – number */}
      <div className="field-box">
        <label>
          Left Foot:
          <input type="number" name="LeftFoot" value={formData.LeftFoot} onChange={handleChange} />
        </label>
      </div>

      {/* RightFoot – number */}
      <div className="field-box">
        <label>
          Right Foot:
          <input type="number" name="RightFoot" value={formData.RightFoot} onChange={handleChange} />
        </label>
      </div>

      {/* Head – number */}
      <div className="field-box">
        <label>
          Head:
          <input type="number" name="Head" value={formData.Head} onChange={handleChange} />
        </label>
      </div>

      {/* OtherBodyParts – number */}
      <div className="field-box">
        <label>
          Other Body Parts:
          <input type="number" name="OtherBodyParts" value={formData.OtherBodyParts} onChange={handleChange} />
        </label>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default PlayerStatsForm;