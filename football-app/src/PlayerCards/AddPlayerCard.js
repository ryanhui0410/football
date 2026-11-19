import React, { useState, useEffect } from "react";
import { readFromGitHub, writeToGitHub, uploadImageToGitHub, FILES } from "../githubAPI";
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

const FILTER_OPTIONS = ["Barry", "The Bros", "馬哲", "梁哥"];

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
    filterGroup: "",
    PAC: "", SHO: "", PAS: "", DRI: "", DEF: "", PHY: "",
    DIV: "", HAN: "", KIC: "", REF: "", SPD: "", POS: "",
  };
  UNIQUE_SUB_STATS.forEach((s) => {
    form[s] = "";
  });
  return form;
};

const STORAGE_KEY = "apc_draft";

function saveDraft(data) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
}
function loadDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
function clearDraft() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

function AddPlayerCard() {
  const saved = loadDraft();

  const [formData, setFormData] = useState(() => saved?.formData ?? buildEmptyForm());
  const [positionRatings, setPositionRatings] = useState(() => saved?.positionRatings ?? []);
  const [newPos, setNewPos] = useState(() => saved?.newPos ?? "RB");
  const [newPosRating, setNewPosRating] = useState(() => saved?.newPosRating ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
const [existingPlayers, setExistingPlayers] = useState([]); // ✅ NEW: existing cards for duplicate check

// ✅ NEW: fetch player_attributes.json and return the array
const fetchExistingPlayers = async () => {
  const players = await readFromGitHub(FILES.playerAttributes);
  return Array.isArray(players) ? players : [];
};

// ✅ NEW: load once on mount so we can warn while typing
useEffect(() => {
  fetchExistingPlayers()
    .then(setExistingPlayers)
    .catch(() => {}); // non-fatal — submit-time check still protects us
}, []);

// ✅ NEW: live duplicate match (case/whitespace-insensitive, same rule as the upsert)
const typedName = formData.Contributor.trim().toLowerCase();
const duplicatePlayer = typedName
  ? existingPlayers.find(a => (a.Contributor || "").trim().toLowerCase() === typedName)
  : null;
  useEffect(() => {
    saveDraft({ formData, positionRatings, newPos, newPosRating });
  }, [formData, positionRatings, newPos, newPosRating]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
        updated.DIV = parseInt(prev["GK Diving"]) || 0;
        updated.HAN = parseInt(prev["GK Handling"]) || 0;
        updated.KIC = parseInt(prev["GK Kicking"]) || 0;
        updated.REF = parseInt(prev["GK Reflexes"]) || 0;
        updated.SPD = avg(prev["Acceleration"], prev["Sprint Speed"]);
        updated.POS = parseInt(prev["GK Positioning"]) || 0;
      } else {
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
    const playerName = formData.Contributor.trim();
    if (!playerName) {
      alert("Please enter a player name.");
      return;
    }
    // ── BLOCK SAVE if filterGroup is empty ──
    if (!formData.filterGroup || !formData.filterGroup.trim()) {
      alert("⚠️ Please select a Filter Group before saving.");
      return;
    }
    let players;
try {
  setMessage("🔍 Checking for existing player...");
  players = await fetchExistingPlayers();
  setExistingPlayers(players);
} catch (err) {
  setMessage(`❌ Could not verify existing players: ${err.message}`);
  return;
}

const existingIdx = players.findIndex(
  a => (a.Contributor || "").trim().toLowerCase() === playerName.toLowerCase()
);

if (existingIdx !== -1) {
  const proceed = window.confirm(
    `⚠️ Player "${playerName}" already exists in player_attributes.json` +
    (players[existingIdx].filterGroup ? ` (Group: ${players[existingIdx].filterGroup})` : "") +
    `.\n\nSaving will OVERWRITE their existing card.\n\nContinue?`
  );
  if (!proceed) {
    setMessage(`⚠️ Save cancelled — "${playerName}" already exists.`);
    return;
  }
}
    setSaving(true);
    setMessage("");

    try {
      let picturePath = formData.picture;

      // ── Upload picture directly to GitHub ──
      if (picturePath && picturePath.startsWith("data:")) {
        setMessage("📸 Uploading picture to GitHub...");
        picturePath = await uploadImageToGitHub(
          picturePath,
          `${playerName}.jpeg`,
          `Upload profile picture: ${playerName}`
        );
      }

            const posRatingsObj = {};
      positionRatings.forEach(({ position, rating }) => {
        posRatingsObj[position] = rating;
      });

      // ── Build payload with correct picture URL ──
      const payload = {
        Contributor: formData.Contributor,
        picture: picturePath, // ← URL from upload, NOT base64
        position: formData.position,
        preferredFoot: formData.preferredFoot,
        filterGroup: formData.filterGroup,
        overall: parseInt(formData.overall) || 0,
        weakFoot: parseInt(formData.weakFoot) || 0,
        PAC: parseInt(formData.PAC) || 0,
        SHO: parseInt(formData.SHO) || 0,
        PAS: parseInt(formData.PAS) || 0,
        DRI: parseInt(formData.DRI) || 0,
        DEF: parseInt(formData.DEF) || 0,
        PHY: parseInt(formData.PHY) || 0,
        DIV: parseInt(formData.DIV) || 0,
        HAN: parseInt(formData.HAN) || 0,
        KIC: parseInt(formData.KIC) || 0,
        REF: parseInt(formData.REF) || 0,
        SPD: parseInt(formData.SPD) || 0,
        POS: parseInt(formData.POS) || 0,
        positionRatings: formData.position === "GK" ? {} : posRatingsObj,
      };

      // Add all detailed sub-stats
      UNIQUE_SUB_STATS.forEach((s) => {
        payload[s] = parseInt(formData[s]) || 0;
      });

      // ── Save player card directly to GitHub ──
      setMessage("💾 Saving player card...");
      const arr = players;
      const idx = arr.findIndex(
        a => (a.Contributor || "").trim().toLowerCase() === playerName.toLowerCase()
      );
      if (idx === -1) {
        arr.push(payload);
      } else {
        arr[idx] = { ...arr[idx], ...payload };
      }
      await writeToGitHub(FILES.playerAttributes, arr, `Update player card: ${playerName}`);

      setMessage("✅ Player card saved successfully!");
      clearDraft();
      setFormData(buildEmptyForm());
      setPositionRatings([]);
      setNewPos("RB");
      setNewPosRating("");
    } catch (err) {
      setMessage(`❌ Failed: ${err.message}`);
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
            {/* ✅ ADD IT HERE — right after the Name field */}
    {duplicatePlayer && (
      <div className="apc-field" style={{ gridColumn: "1 / -1" }}>
        <div style={{
          background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "8px",
          padding: "8px 12px", fontSize: "13px", fontWeight: 600, color: "#92400e",
        }}>
          ⚠️ "{formData.Contributor.trim()}" already exists
          {duplicatePlayer.filterGroup ? ` (Group: ${duplicatePlayer.filterGroup})` : ""} — saving will overwrite their card.
        </div>
      </div>
    )}
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