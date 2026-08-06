import React, { useState } from "react";
import "./AddPlayerCard.css";

// ── FIFA stat categories ──
const STAT_CATEGORIES = {
  PAC: ["Acceleration", "Sprint Speed"],
  SHO: [
    "Positioning", "Finishing", "Shot Power",
    "Long Shots", "Volleys", "Penalties",
  ],
  PAS: [
    "Vision", "Crossing", "Free Kick Accuracy",
    "Short Passing", "Long Passing", "Curve",
  ],
  DRI: [
    "Agility", "Balance", "Reactions",
    "Ball Control", "Dribbling", "Composure",
  ],
  DEF: [
    "Interceptions", "Heading Accuracy", "Def Awareness",
    "Standing Tackle", "Sliding Tackle",
  ],
  PHY: ["Jumping", "Stamina", "Strength", "Aggression"],
};

const ALL_POSITIONS = [
  "GK", "CB", "RB", "LB", "RWB", "LWB",
  "CDM", "CM", "CAM", "RM", "LM",
  "RW", "LW", "RF", "LF", "CF", "ST",
];

// Build initial empty form
const buildEmptyForm = () => {
  const form = {
    Contributor: "",
    picture: "",
    overall: "",
    position: "CB",
    weakFoot: 3,
    preferredFoot: "Right",
    PAC: "", SHO: "", PAS: "", DRI: "", DEF: "", PHY: "",
  };
  Object.values(STAT_CATEGORIES).flat().forEach((s) => {
    form[s] = "";
  });
  return form;
};

function AddPlayerCard() {
  const [formData, setFormData] = useState(buildEmptyForm());
  const [positionRatings, setPositionRatings] = useState([]);
  const [newPos, setNewPos] = useState("RB");
  const [newPosRating, setNewPosRating] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // ── Generic field handler ──
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ── Picture upload (base64) ──
  const handlePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert("⚠️ Image too large! Please use an image under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => handleChange("picture", reader.result);
    reader.readAsDataURL(file);
  };

  // ── Auto-calculate the 6 EA fields ──
  const autoCalculate = () => {
    const avg = (...vals) => {
      const nums = vals.map((v) => parseInt(v) || 0);
      return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    };

    setFormData((prev) => ({
      ...prev,
      PAC: avg(prev["Acceleration"], prev["Sprint Speed"]),
      SHO: avg(
        prev["Positioning"], prev["Finishing"], prev["Shot Power"],
        prev["Long Shots"], prev["Volleys"], prev["Penalties"]
      ),
      PAS: avg(
        prev["Vision"], prev["Crossing"], prev["Free Kick Accuracy"],
        prev["Short Passing"], prev["Long Passing"], prev["Curve"]
      ),
      DRI: avg(
        prev["Agility"], prev["Balance"], prev["Reactions"],
        prev["Ball Control"], prev["Dribbling"], prev["Composure"]
      ),
      DEF: avg(
        prev["Interceptions"], prev["Heading Accuracy"], prev["Def Awareness"],
        prev["Standing Tackle"], prev["Sliding Tackle"]
      ),
      PHY: avg(
        prev["Jumping"], prev["Stamina"], prev["Strength"], prev["Aggression"]
      ),
    }));
  };

  // ── Position Ratings (dynamic list) ──
  const addPosition = () => {
    const rating = parseInt(newPosRating);
    if (!newPos || isNaN(rating) || rating < 1 || rating > 99) {
      alert("Please enter a valid rating (1-99).");
      return;
    }
    if (positionRatings.some((p) => p.position === newPos)) {
      alert(`${newPos} already exists.`);
      return;
    }
    setPositionRatings((prev) => [...prev, { position: newPos, rating }]);
    setNewPosRating("");
  };

  const removePosition = (pos) => {
    setPositionRatings((prev) => prev.filter((p) => p.position !== pos));
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Contributor.trim()) {
      alert("Please enter a player name.");
      return;
    }

    setSaving(true);
    setMessage("");

    const posRatingsObj = {};
    positionRatings.forEach(({ position, rating }) => {
      posRatingsObj[position] = rating;
    });

    const payload = {
      ...formData,
      // Ensure all numeric fields are numbers
      ...Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [
          k,
          k === "Contributor" || k === "picture" || k === "position" || k === "preferredFoot"
            ? v
            : parseInt(v) || 0,
        ])
      ),
      positionRatings: posRatingsObj,
    };

    try {
        const res = await fetch("http://localhost:5000/player-attributes", { // ← Ensure this URL is correct
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("✅ Player card saved successfully!");
    } catch {
      setMessage("❌ Failed to save. Check that the server is running.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="apc-wrap">
      <h1 className="apc-title">🪪 Add Player Card</h1>
      {message && <div className="apc-msg">{message}</div>}

      <form onSubmit={handleSubmit}>
        {/* ── BASIC INFO ── */}
        <section className="apc-card">
          <h2 className="apc-section-title">Player Info</h2>
          <div className="apc-grid-2">
            <div className="apc-field">
              <label>Name</label>
              <input
                value={formData.Contributor}
                onChange={(e) => handleChange("Contributor", e.target.value)}
                placeholder="e.g. Steve"
              />
            </div>
            <div className="apc-field">
              <label>Primary Position</label>
              <select
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
              >
                {ALL_POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="apc-field">
              <label>Preferred Foot</label>
              <select
                value={formData.preferredFoot}
                onChange={(e) => handleChange("preferredFoot", e.target.value)}
              >
                <option value="Right">Right</option>
                <option value="Left">Left</option>
              </select>
            </div>
            <div className="apc-field">
              <label>Weak Foot (1-5)</label>
              <select
                value={formData.weakFoot}
                onChange={(e) => handleChange("weakFoot", parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} ★</option>
                ))}
              </select>
            </div>
            <div className="apc-field">
              <label>Overall Rating</label>
              <input
                type="number" min="1" max="99"
                value={formData.overall}
                onChange={(e) => handleChange("overall", e.target.value)}
                placeholder="e.g. 70"
              />
            </div>
            <div className="apc-field">
              <label>Profile Picture</label>
              <input type="file" accept="image/*" onChange={handlePicture} />
            </div>
          </div>

          {/* Picture preview */}
          {formData.picture && (
            <div className="apc-pic-preview">
              <img src={formData.picture} alt="Player" />
            </div>
          )}
        </section>

        {/* ── EA SUMMARY FIELDS ── */}
        <section className="apc-card">
          <div className="apc-ea-header">
            <h2 className="apc-section-title">EA Card Ratings</h2>
            <button type="button" className="apc-auto-btn" onClick={autoCalculate}>
              ⚡ Auto-Calculate
            </button>
          </div>
          <div className="apc-ea-grid">
            {["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"].map((ea) => (
              <div key={ea} className="apc-ea-field">
                <span className="apc-ea-label">{ea}</span>
                <input
                  type="number" min="1" max="99"
                  value={formData[ea]}
                  onChange={(e) => handleChange(ea, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── DETAILED STATS ── */}
        <section className="apc-card">
          <h2 className="apc-section-title">Detailed Stats</h2>
          {Object.entries(STAT_CATEGORIES).map(([cat, stats]) => (
            <div key={cat} className="apc-cat-block">
              <h3 className="apc-cat-title">{cat}</h3>
              <div className="apc-stats-grid">
                {stats.map((stat) => (
                  <div key={stat} className="apc-stat-field">
                    <label>{stat}</label>
                    <input
                      type="number" min="1" max="99"
                      value={formData[stat]}
                      onChange={(e) => handleChange(stat, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── POSITION RATINGS ── */}
        <section className="apc-card">
          <h2 className="apc-section-title">Playable Positions</h2>
          <div className="apc-pos-add">
            <select value={newPos} onChange={(e) => setNewPos(e.target.value)}>
              {ALL_POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              type="number" min="1" max="99"
              placeholder="Rating"
              value={newPosRating}
              onChange={(e) => setNewPosRating(e.target.value)}
            />
            <button type="button" onClick={addPosition}>+ Add</button>
          </div>

          {positionRatings.length > 0 && (
            <div className="apc-pos-list">
              {positionRatings.map(({ position, rating }) => (
                <div key={position} className="apc-pos-item">
                  <span className="apc-pos-name">{position}</span>
                  <span className="apc-pos-rating">{rating}</span>
                  <button type="button" onClick={() => removePosition(position)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── SUBMIT ── */}
        <div className="apc-actions">
          <button type="submit" className="apc-save-btn" disabled={saving}>
            {saving ? "Saving..." : "💾 Save Player Card"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPlayerCard;