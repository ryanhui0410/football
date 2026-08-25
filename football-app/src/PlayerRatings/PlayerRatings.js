import React, { useState, useEffect } from "react";
import PlayerStatsModal from "./PlayerStatsModal";
import "./PlayerRatings.css";

const FILTER_GROUPS = {
  Barry: ['Lu', 'Nick', 'Jacob', '普巴', 'Chris', '局長', 'Eugene', '大嚿', 'Barry', 'Chun', '子睿', 'Steve', 'Eugene', 'Alex', 'hong', 'R', 'Ken','Derek', 'Marco', 'Nin', 'Dave', 'S Joe', '大嚿', 'Po', 'QC', 'Raymond', 'Eugene'],
  'The Bros': ['Ryan', 'Darren'],
  馬哲: ['Tony', '馬俊翔'],
};

const getTierClass = (overall) => {
  if (overall >= 85) return 'gold';
  if (overall >= 75) return 'silver';
  return 'bronze';
};

function PlayerRatings() {
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("All"); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attrRes, statsRes] = await Promise.all([
        fetch('https://football-stats-xbx6.onrender.com/player-attributes?t=${Date.now()}'),
        fetch('https://football-stats-xbx6.onrender.com/stats?t=${Date.now()}'),
      ]);
      const profilesData = await attrRes.json();
      const statsData = await statsRes.json();
      setProfiles(Array.isArray(profilesData) ? profilesData : []);
      setStats(Array.isArray(statsData) ? statsData : []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProfile = (name) =>
    profiles.find(p => p.Contributor === name) || { Contributor: name };

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
              className={`pr-card ${tier}`}
              onClick={() => handleCardClick(name)}
            >
              <div className="pr-accent-bar" />
              <div className="pr-corner tl" />
              <div className="pr-corner tr" />
              <div className="pr-corner bl" />
              <div className="pr-corner br" />

              {/* 1. Profile Picture */}
              <div className="pr-picture">
                <img
                  src={profile.picture || `/${name}.jpeg`}
                  alt={name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<span style="font-size:40px;color:#888;display:flex;align-items:center;justify-content:center;height:100%;font-weight:700;">${name.charAt(0)}</span>`;
                  }}
                />
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