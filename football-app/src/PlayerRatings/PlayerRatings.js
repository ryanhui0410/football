import React, { useState, useEffect } from "react";
import PlayerStatsModal from "./PlayerStatsModal";
import "./PlayerRatings.css";

const FILTER_GROUPS = {
  Barry: ['Lu', 'Nick', 'Jacob', '普巴', 'Chris', '局長', 'Eugene', '大嚿', 'Barry', 'Chun', '子睿', 'Steve', 'Eugene', 'Alex', 'hong'],
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
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const toggleFilter = (group) => {
    setActiveFilters(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const fetchData = async () => {
    try {
      const [attrRes, statsRes] = await Promise.all([
        fetch('http://localhost:5000/player-attributes'),
        fetch('http://localhost:5000/stats'),
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
    if (activeFilters.length === 0) return true;
    return activeFilters.some(group => FILTER_GROUPS[group]?.includes(name));
  })
  .sort((a, b) => {
    const pa = getProfile(a);
    const pb = getProfile(b);
    const oa = pa.overall || pa.PAC || 0;
    const ob = pb.overall || pb.PAC || 0;
    return ob - oa; // highest rated first
  });

  return (
    <div className="pr-page">
      <h2 className="pr-title">⚽ Player Ratings</h2>

      {/* ---- Filter Bar ---- */}
      <div className="pr-filters">
        {Object.keys(FILTER_GROUPS).map(group => (
          <button
            key={group}
            onClick={() => toggleFilter(group)}
            className={`pr-filter-btn${activeFilters.includes(group) ? ' active' : ''}`}
          >
            {group}
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            className="pr-filter-btn clear"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ---- Cards Grid ---- */}
      <div className="pr-grid">
        {names.map(name => {
          const profile = getProfile(name);
          const main = {
            PAC: profile.PAC ?? 0,
            SHO: profile.SHO ?? 0,
            PAS: profile.PAS ?? 0,
            DRI: profile.DRI ?? 0,
            DEF: profile.DEF ?? 0,
            PHY: profile.PHY ?? 0,
          };
          const overall = profile.overall || main.PAC;
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

              <div className="pr-picture">
                <img
                  src={`/${name}.jpeg`}
                  alt={name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML =
                      `<span style="font-size:60px;color:#888;">${name.charAt(0)}</span>`;
                  }}
                />
                <div className="pr-picture-overlay" />
              </div>

              <div className="pr-name-row">
                <span className="pr-name">{name}</span>
                <span className="pr-position-box">{position}</span>
                <span className="pr-overall-box">{overall}</span>
              </div>

              <div className="pr-divider" />

              <div className="pr-stats-grid">
                {['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map(stat => (
                  <div key={stat} className="pr-stat-item">
                    <span className="pr-stat-label">{stat}</span>
                    <span className="pr-score-box">{main[stat]}</span>
                  </div>
                ))}
              </div>
              {/* Preferred Foot */}
              {profile.preferredFoot && (
                <div className="pr-pref-foot">
                  <span className="pr-pref-foot-label">Preferred Foot:</span>
                  <span className="pr-pref-foot-value">
                    {profile.preferredFoot === 'Left' ? '🦶 L' : '🦶 R'}
                  </span>
                </div>
              )}
              {weakFoot > 0 && (
                <div className="pr-weak-foot">
                  <span className="pr-weak-foot-label">Weak Foot:</span>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`pr-star ${i < weakFoot ? 'filled' : 'empty'}`}>
                      {i < weakFoot ? '★' : '☆'}
                    </span>
                  ))}
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
          );
        })}
      </div>

      {showModal && (
        // Pass the fetch function down as onUpdate
        <PlayerStatsModal 
          selectedPlayer={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)} 
          profiles={profiles} 
          // onUpdate={fetchProfiles} // ← Add this!
        />
      )}
    </div>
  );
}

export default PlayerRatings;