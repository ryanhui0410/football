import React, { useState } from "react";
import "./AddPlayerCard.css";

// ── Outfield EA Fields & Detailed Stats ──
const OUTFIELD_EA_FIELDS = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];

const STAT_CATEGORIES = {
  PAC: ["Acceleration", "Sprint Speed"],
  SHO: ["Positioning", "Finishing", "Shot Power", "Long Shots", "Volleys", "Penalties"],
  PAS: ["Vision", "Crossing", "Free Kick Accuracy", "Short Passing", "Long Passing", "Curve"],
  DRI: ["Agility", "Balance", "Reactions", "Ball Control", "Dribbling", "Composure"],
  DEF: ["Interceptions", "Heading Accuracy", "Def Awareness", "Standing Tackle", "Sliding Tackle"],
  PHY: ["Jumping", "Stamina", "Strength", "Aggression"],
};

// ── Goalkeeper EA Fields & Detailed Stats ──
const GK_EA_FIELDS = ["DIV", "HAN", "KIC", "REF", "SPD", "POS"];

const GK_DETAILED_CATEGORIES = {
  "Goalkeeping": ["GK Diving", "GK Handling", "GK Kicking", "GK Positioning", "GK Reflexes"],
  "Pace": ["Acceleration", "Sprint Speed"],
  "Shooting": ["Shot Power"],
  "Passing": ["Vision", "Short Passing", "Long Passing"],
  "Dribbling": ["Reactions"],
  "Physicality": ["Jumping", "Strength"]
};

const ALL_POSITIONS = [
  "LW", "CF", "SS", "RW",
  "LM", "AM", "CM", "DM", "RM",
  "LB", "CB", "GK", "RB",
];

const FILTER_OPTIONS = ["Barry", "The Bros", "馬哲"];

// Combine all possible sub-stats to initialize the form state
const ALL_SUB_STATS = [
  ...Object.values(STAT_CATEGORIES).flat(),
  ...Object.values(GK_DETAILED_CATEGORIES).flat()
];
const UNIQUE_SUB_STATS = [...new Set(ALL_SUB_STATS)];

const buildEmptyForm = () => {
  const form = {
    Contributor: "",
    picture: "",
    overall: "",
    position: "CB",
    weakFoot: 3,
    preferredFoot: "Right",
    filterGroup: "", // Added Filter Group
    // Outfield EA
    PAC: "", SHO: "", PAS: "", DRI: "", DEF: "", PHY: "",
    // GK EA
    DIV: "", HAN: "", KIC: "", REF: "", SPD: "", POS: "",
  };
  UNIQUE_SUB_STATS.forEach((s) => {
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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  const autoCalculate = () => {
    const isGK = formData.position === "GK";
    const avg = (...vals) => {
      const nums = vals.map((v) => parseInt(v) || 0);
      if (nums.length === 0) return 0;
      return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    };

    setFormData((prev) => {
      const updated = { ...prev };
      
      if (isGK) {
        // Map GK sub-stats to the 6 EA fields
        updated.DIV = parseInt(prev["GK Diving"]) || 0;
        updated.HAN = parseInt(prev["GK Handling"]) || 0;
        updated.KIC = parseInt(prev["GK Kicking"]) || 0;
        updated.REF = parseInt(prev["GK Reflexes"]) || 0;
        updated.SPD = avg(prev["Acceleration"], prev["Sprint Speed"]);
        updated.POS = parseInt(prev["GK Positioning"]) || 0;
      } else {
        // Map Outfield sub-stats to the 6 EA fields
        Object.entries(STAT_CATEGORIES).forEach(([ea, stats]) => {
          updated[ea] = avg(...stats.map(s => prev[s]));
        });
      }
      
      return updated;
    });
  };

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

    // Fields that should remain as strings (not parsed to numbers)
    const stringFields = ["Contributor", "picture", "position", "preferredFoot", "filterGroup"];

    const payload = {
      ...formData,
      // Ensure all numeric fields are numbers, but keep strings as strings
      ...Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [
          k,
          stringFields.includes(k) ? v : parseInt(v) || 0,
        ])
      ),
      // Force empty position ratings if the player is a GK
      positionRatings: formData.position === "GK" ? {} : posRatingsObj,
    };

    try {
      const res = await fetch("http://localhost:5000/player-attributes", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("✅ Player card saved successfully!");
      
      // Reset form after successful save
      setFormData(buildEmptyForm());
      setPositionRatings([]);
    } catch (err) {
      setMessage("❌ Failed to save. Check that the server is running.");
    } finally {
      setSaving(false);
    }
  };

  const isGK = formData.position === "GK";
  const activeEAFields = isGK ? GK_EA_FIELDS : OUTFIELD_EA_FIELDS;
  const activeDetailedCats = isGK ? GK_DETAILED_CATEGORIES : STAT_CATEGORIES;

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
              <label>Filter Group</label>
              <select
                value={formData.filterGroup}
                onChange={(e) => handleChange("filterGroup", e.target.value)}
              >
                <option value="">None</option>
                {FILTER_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
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
            {activeEAFields.map((ea) => (
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
          {Object.entries(activeDetailedCats).map(([cat, stats]) => (
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

        {/* ── POSITION RATINGS (Hidden for GK) ── */}
        {!isGK && (
          <section className="apc-card">
            <h2 className="apc-section-title">Playable Positions</h2>
            <div className="apc-pos-add">
              <select value={newPos} onChange={(e) => setNewPos(e.target.value)}>
                {ALL_POSITIONS.filter(p => p !== "GK").map((p) => (
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
        )}

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