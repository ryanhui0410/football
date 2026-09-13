import React, { useState, useEffect } from "react";
import PlayerStatsModal from "./PlayerStatsModal";
import "./PlayerRatings.css";

const FILTER_GROUPS = {
  Barry: ['Lu', 'Nick', 'Jacob', '普巴', 'Chris', '局長', 'Eugene', '大嚿', 'Barry', 'Chun', '子睿', 'Steve', 'Eugene', 'Alex', 'hong', 'R', 'Ken','Derek', 'Marco', 'Nin', 'Dave', 'S Joe', '大嚿', 'Po', 'QC', 'Raymond', 'Eugene'],
  'The Bros': ['Ryan', 'Darren'],
  馬哲: ['Tony', '馬俊翔'],
};
const GITHUB_OWNER = "ryanhui0410";
const GITHUB_REPO = "football";   // ← repo name is "football", NOT "football/football-app"
const IMAGES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/football-app/public/images`;
const getTierClass = (overall) => {
  if (overall >= 85) return 'gold';
  if (overall >= 75) return 'silver';
  return 'bronze';
};
// Tries each candidate picture path in order, falls back to first letter
function PlayerPicture({ name, pictureMap, refreshTs }) {
  const candidates = [
    pictureMap?.[name.toLowerCase()],           // ← primary: real file from GitHub listing
    `/images/${encodeURIComponent(name)}.jpeg`, // local build fallback
    `/${name}.jpeg`,                            // legacy root fallback
  ].filter(Boolean);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [refreshTs, pictureMap]);

  if (attempt >= candidates.length) {
    return (
      <span style={{ fontSize: '40px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: 700 }}>
        {name.charAt(0)}
      </span>
    );
  }

  const bust = refreshTs && candidates[attempt].includes("raw.githubusercontent")
    ? `?t=${refreshTs}`
    : "";

  return (
    <img
      src={`${candidates[attempt]}${bust}`}
      alt={name}
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
function PlayerRatings() {
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("All"); 
  const [showPicModal, setShowPicModal] = useState(false);
  const [missingPictures, setMissingPictures] = useState([]);
  const [uploadedNames, setUploadedNames] = useState([]);
  const [uploadingName, setUploadingName] = useState(null);
  const [picModalMsg, setPicModalMsg] = useState("");
    const [refreshTs, setRefreshTs] = useState(0); // ✅ ADD THIS LINE
  useEffect(() => {
    fetchData();
  }, []);
  const [pictureMap, setPictureMap] = useState({});
  const fetchData = async () => {
  try {
    const [attrRes, statsRes, imgRes] = await Promise.all([
      fetch(`https://football-stats-xbx6.onrender.com/player-attributes?t=${Date.now()}`),
      fetch(`https://football-stats-xbx6.onrender.com/stats?t=${Date.now()}`),
      fetch(`${IMAGES_API_URL}?t=${Date.now()}`), // GitHub contents API (public repo = no auth needed)
    ]);

    const profilesData = await attrRes.json();
    const statsData = await statsRes.json();
    setProfiles(Array.isArray(profilesData) ? profilesData : []);
    setStats(Array.isArray(statsData) ? statsData : []);

    // Build map: lowercase player name → raw GitHub URL
    if (imgRes.ok) {
      const files = await imgRes.json();
      if (Array.isArray(files)) {
        const map = {};
        files
          .filter(f => /\.(jpe?g|png)$/i.test(f.name))
          .forEach(f => {
            const baseName = f.name.replace(/\.(jpe?g|png)$/i, "").toLowerCase();
            map[baseName] = f.download_url; // GitHub gives you a ready-to-use raw URL
          });
        setPictureMap(map);
      }
    }
  } catch (err) {
    console.error('Failed to load data:', err);
  } finally {
    setLoading(false);
  }
};

  const getProfile = (name) =>
    profiles.find(p => p.Contributor === name) || { Contributor: name };
  // Probe a URL — resolves true if the image actually loads
const probeImage = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

const openPicModal = async () => {
  setPicModalMsg("🔍 Checking which players are missing pictures...");
  setShowPicModal(true);
  setUploadedNames([]);

  const missing = [];
  for (const name of names) {
    const profile = getProfile(name);
    if (profile.picture) continue; // JSON has a saved path — skip
    const exists =
      (await probeImage(`/images/${encodeURIComponent(name)}.jpeg`)) ||
      (await probeImage(`/images/${encodeURIComponent(name)}.jpg`)) ||
      (await probeImage(`/${name}.jpeg`)); // legacy root path
    if (!exists) missing.push(name);
  }

  setMissingPictures(missing);
  setPicModalMsg(missing.length === 0 ? "✅ All players have pictures!" : "");
};

const handlePicUpload = (name, file) => {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onloadend = async () => {
    setUploadingName(name);
    setPicModalMsg("");
    try {
      // STEP 1: upload & process the image → github public/images/{name}.jpeg
      const res = await fetch("https://football-stats-xbx6.onrender.com/upload-player-picture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: reader.result }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.githubError || result.error || "Upload failed");

            // STEP 2: also save the path into player_attributes.json so it's primary
      const attrRes = await fetch("https://football-stats-xbx6.onrender.com/player-attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Contributor: name, picture: `/images/${name}.jpeg` }),
      });
      if (!attrRes.ok) {
        const errData = await attrRes.json().catch(() => ({}));
        throw new Error(
          `Picture uploaded, but card link failed: ${errData.githubError || errData.error || attrRes.status}`
        );
      }
      setUploadedNames((prev) => [...prev, name]);
    } catch (err) {
      setPicModalMsg(`❌ ${name}: ${err.message}`);
    } finally {
      setUploadingName(null);
    }
  };
  reader.readAsDataURL(file);
};

const closePicModal = () => {
  setShowPicModal(false);
  setMissingPictures([]);
  setUploadedNames([]);
  setPicModalMsg("");
  fetchData(); // refresh profiles so new picture paths show up
};
  const getForm = (name) => {
    if (name !== 'Ryan' && name !== 'Darren') return null;
    const playerStats = stats.filter(s => s.Contributor?.trim() === name);
    if (!playerStats.length) return null;
    const sorted = playerStats.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    const latest = sorted[0];
    let contribution = latest['Goal Contribution'];
    if (contribution === undefined || contribution === null) {
      contribution = (parseInt(latest.Goal) || 0) + (parseInt(latest.Assist) || 0);
    }
    if (name === 'Ryan') {
      if (contribution >= 3) return { grade: 'A', color: '#006400' };
      if (contribution === 2) return { grade: 'B', color: '#32CD32' };
      if (contribution === 1) return { grade: 'C', color: '#D4A017' };
      return { grade: 'D', color: '#FF0000' };
    }
    if (name === 'Darren') {
      if (contribution >= 4) return { grade: 'A', color: '#006400' };
      if (contribution >= 2) return { grade: 'B', color: '#32CD32' };
      if (contribution === 1) return { grade: 'C', color: '#D4A017' };
      return { grade: 'D', color: '#FF0000' };
    }
    return null;
  };

  const handleCardClick = (name) => {
    setSelectedPlayer(name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlayer(null);
  };

  if (loading) return <div>Loading...</div>;

  const names = profiles
    .map(p => p.Contributor)
    .filter(Boolean)
    .filter(name => {
      const profile = profiles.find(p => p.Contributor === name);
      
      // Apply Dropdown Filter (selectedGroup)
      if (selectedGroup !== "All") {
        const matchesDropdown = profile?.filterGroup === selectedGroup || FILTER_GROUPS[selectedGroup]?.includes(name);
        if (!matchesDropdown) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const pa = getProfile(a);
      const pb = getProfile(b);
      const oa = pa.overall || pa.PAC || pa.DIV || 0;
      const ob = pb.overall || pb.PAC || pb.DIV || 0;
      return ob - oa; // highest rated first
    });

  return (
    <div className="pr-page">
      <h2 className="pr-title">⚽ Player Ratings</h2>

      {/* ---- Filter Dropdown ---- */}
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <label style={{ marginRight: "12px", fontWeight: "bold", fontSize: "16px", color: "#1e3a8a" }}>
          Filter by Group:
        </label>
        <select 
          value={selectedGroup} 
          onChange={(e) => setSelectedGroup(e.target.value)}
          style={{ 
            padding: "10px 16px", 
            borderRadius: "8px", 
            border: "1px solid #cbd5e1", 
            fontSize: "15px",
            backgroundColor: "#f8fafc",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          <option value="All">All Players</option>
          <option value="Barry">Barry</option>
          <option value="The Bros">The Bros</option>
          <option value="馬哲">馬哲</option>
        </select>
      </div>
      {/* ---- Add Missing Pictures Button ---- */}
{/* ---- Add Missing Pictures Button ---- */}
<div style={{ marginBottom: "24px", textAlign: "center" }}>
  <button
    onClick={openPicModal}
    style={{
      padding: "10px 20px", borderRadius: "8px", border: "none",
      background: "#3b82f6", color: "#fff", fontWeight: "600",
      fontSize: "15px", cursor: "pointer", margin: "0 6px",
      boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
    }}
  >
    📷 Add Missing Profile Pictures
  </button>

  <button
    onClick={() => {
      setRefreshTs(Date.now()); // cache-bust all images
      fetchData();              // re-fetch JSON + GitHub image listing
    }}
    style={{
      padding: "10px 20px", borderRadius: "8px", border: "none",
      background: "#64748b", color: "#fff", fontWeight: "600",
      fontSize: "15px", cursor: "pointer", margin: "0 6px",
      boxShadow: "0 4px 12px rgba(100,116,139,0.3)",
    }}
  >
    🔄 Refresh Pictures
  </button>
</div>
      {/* ---- Cards Grid ---- */}
      <div className="pr-grid">
        {names.map(name => {
          const profile = getProfile(name);
          
          // 🧤 GK vs Outfield Stat Logic
          const isGK = profile.position === "GK";
          const main = isGK ? {
            DIV: profile.DIV ?? 0,
            HAN: profile.HAN ?? 0,
            KIC: profile.KIC ?? 0,
            REF: profile.REF ?? 0,
            SPD: profile.SPD ?? 0,
            POS: profile.POS ?? 0,
          } : {
            PAC: profile.PAC ?? 0,
            SHO: profile.SHO ?? 0,
            PAS: profile.PAS ?? 0,
            DRI: profile.DRI ?? 0,
            DEF: profile.DEF ?? 0,
            PHY: profile.PHY ?? 0,
          };

          const overall = profile.overall || main.PAC || main.DIV || 0;
          const position = profile.position || 'POS';
          const weakFoot = profile.weakFoot || 0;
          const form = getForm(name);
          const tier = getTierClass(overall);

          return (
            <div
              key={name}
              className={`pr-card ${tier} skin-shield`}  
              onClick={() => handleCardClick(name)}
            >
              <div className="pr-accent-bar" />
              <div className="pr-corner tl" />
              <div className="pr-corner tr" />
              <div className="pr-corner bl" />
              <div className="pr-corner br" />

              {/* 1. Profile Picture */}
            <div className="pr-picture">
  <PlayerPicture name={name} pictureMap={pictureMap} refreshTs={refreshTs} />
</div>

              {/* 2. Name, Position, Overall */}
              <div className="pr-info-block">
                <div className="pr-name">{name}</div>
                <div className="pr-badges-row">
                  <span className="pr-position-box">{position}</span>
                  <span className="pr-overall-box">{overall}</span>
                </div>
              </div>

              {/* 3. Six Item Scores in a Row */}
              <div className="pr-stats-row">
                {Object.entries(main).map(([stat, value]) => (
                  <div key={stat} className="pr-stat-item">
                    <span className="pr-stat-label">{stat}</span>
                    <span className="pr-score-box">{value}</span>
                  </div>
                ))}
              </div>
              
              {/* 4. Extra Details: Preferred Foot, Weak Foot Stars, Form */}
              <div className="pr-extra-details">
                {profile.preferredFoot && (
                  <div className="pr-pref-foot">
                    <span className="pr-pref-foot-label">Foot:</span>
                    <span className="pr-pref-foot-value">
                      {profile.preferredFoot === 'Left' ? '🦶 L' : '🦶 R'}
                    </span>
                  </div>
                )}
                
                {weakFoot > 0 && (
                  <div className="pr-weak-foot">
                    <span className="pr-weak-foot-label">Weak:</span>
                    <div className="pr-stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`pr-star ${i < weakFoot ? 'filled' : 'empty'}`}>
                          {i < weakFoot ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {form && (
                  <div className="pr-form">
                    <span className="pr-form-label">Form:</span>
                    <span
                      className="pr-form-grade"
                      style={{
                        backgroundColor: form.color,
                        boxShadow: `0 2px 8px ${form.color}55`,
                      }}
                    >
                      {form.grade}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* ---- Add Pictures Modal ---- */}
{showPicModal && (
  <div
    onClick={closePicModal}
    style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff", borderRadius: "12px", padding: "24px",
        width: "100%", maxWidth: "480px", maxHeight: "80vh", overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ margin: 0, color: "#1e293b" }}>📷 Missing Profile Pictures</h3>
        <button onClick={closePicModal} style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
      </div>

      {picModalMsg && <p style={{ color: "#475569", fontSize: "14px" }}>{picModalMsg}</p>}

      {missingPictures.map((name) => {
        const done = uploadedNames.includes(name);
        return (
          <div
            key={name}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "12px", padding: "10px", marginBottom: "8px",
              borderRadius: "8px", background: done ? "#f0fdf4" : "#f8fafc",
              border: `1px solid ${done ? "#bbf7d0" : "#e2e8f0"}`,
            }}
          >
            <span style={{ fontWeight: 600, color: "#1e293b" }}>{name}</span>
            {done ? (
              <span style={{ color: "#16a34a", fontWeight: 700 }}>✅ Uploaded</span>
            ) : uploadingName === name ? (
              <span style={{ color: "#64748b", fontSize: "14px" }}>Uploading...</span>
            ) : (
              <label
                style={{
                  padding: "6px 14px", background: "#10b981", color: "#fff",
                  borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px",
                }}
              >
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    handlePicUpload(name, e.target.files[0]);
                    e.target.value = ""; // allow re-picking same file
                  }}
                />
              </label>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
      {showModal && (
        <PlayerStatsModal 
          selectedPlayer={selectedPlayer} 
          onClose={closeModal} 
          profiles={profiles} 
          onUpdate={fetchData} 
        />
      )}
    </div>
  );
}

export default PlayerRatings;