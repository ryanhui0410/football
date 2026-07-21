import React, { useState, useEffect } from "react";
import PlayerStatsModal from "./PlayerStatsModal";

function PlayerRatings() {
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attrRes, statsRes] = await Promise.all([
        fetch('http://localhost:5000/player-attributes'),
        fetch('http://localhost:5000/stats')
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

  const updateContributor = async (contributor, updates) => {
    try {
      const res = await fetch('http://localhost:5000/player-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributor, updates }),
      });
      const data = await res.json();
      setProfiles(prev => {
        const index = prev.findIndex(p => p.Contributor === contributor);
        if (index !== -1) {
          const newArray = [...prev];
          newArray[index] = data.updated;
          return newArray;
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const getProfile = (name) => {
    return profiles.find(p => p.Contributor === name) || { Contributor: name };
  };

  const getForm = (name) => {
    if (name !== 'Ryan' && name !== 'Darren') return null;

    const playerStats = stats.filter(s => s.Contributor?.trim() === name);
    if (!playerStats.length) return null;

    const sorted = playerStats.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    const latest = sorted[0];

    let contribution = latest['Goal Contribution'];
    if (contribution === undefined || contribution === null) {
      const goal = parseInt(latest.Goal) || 0;
      const assist = parseInt(latest.Assist) || 0;
      contribution = goal + assist;
    }

    if (name === 'Ryan') {
      if (contribution >= 3) return { grade: 'A', color: '#006400' };
      if (contribution === 2) return { grade: 'B', color: '#32CD32' };
      if (contribution === 1) return { grade: 'C', color: '#D4A017' };
      return { grade: 'D', color: '#FF0000' };
    } else if (name === 'Darren') {
      if (contribution >= 4) return { grade: 'A', color: '#006400' };
      if (contribution >= 2 && contribution <= 3) return { grade: 'B', color: '#32CD32' };
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

  // ---- Card tier colors (thick border + light background) ----
  const getCardTier = (overall) => {
    if (overall >= 85) {
      return {
        borderColor: '#D4AF37',
        borderWidth: '5px',
        accentColor: '#D4AF37',
        bgColor: '#FFFDF5',
        nameColor: '#8B6914',
        shadow: '0 4px 16px rgba(212, 175, 55, 0.25)',
        hoverShadow: '0 12px 32px rgba(212, 175, 55, 0.35)',
      };
    }
    if (overall >= 75) {
      return {
        borderColor: '#A0A0A0',
        borderWidth: '5px',
        accentColor: '#A0A0A0',
        bgColor: '#F8F9FA',
        nameColor: '#555555',
        shadow: '0 4px 16px rgba(160, 160, 160, 0.25)',
        hoverShadow: '0 12px 32px rgba(160, 160, 160, 0.35)',
      };
    }
    return {
      borderColor: '#B87333',
      borderWidth: '5px',
      accentColor: '#B87333',
      bgColor: '#FDF8F3',
      nameColor: '#8B4513',
      shadow: '0 4px 16px rgba(184, 115, 51, 0.25)',
      hoverShadow: '0 12px 32px rgba(184, 115, 51, 0.35)',
    };
  };

  const weakFootContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
    fontSize: '14px',
  };

  const formContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
    fontSize: '14px',
  };

  const starStyle = (filled) => ({
    color: filled ? '#D4AF37' : '#ddd',
    fontSize: '18px',
  });

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 20px',
  };

  const cardStyle = (overall) => {
    const tier = getCardTier(overall);
    return {
      border: `${tier.borderWidth} solid ${tier.borderColor}`,
      borderRadius: "16px",
      padding: "20px",
      backgroundColor: tier.bgColor,
      boxShadow: tier.shadow,
      position: "relative",
      cursor: "pointer",
      boxSizing: "border-box",
      transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease",
      width: '100%',
      overflow: 'hidden',
    };
  };

  const cardHoverStyle = {
    transform: 'translateY(-8px) scale(1.04)',
  };

  // Top accent bar
  const accentBarStyle = (overall) => {
    const tier = getCardTier(overall);
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '5px',
      background: tier.borderColor,
      opacity: 0.6,
    };
  };

  // Corner decorations (brackets)
  const cornerStyle = (overall, position) => {
    const tier = getCardTier(overall);
    const corners = {
      tl: { top: 10, left: 10 },
      tr: { top: 10, right: 10 },
      bl: { bottom: 10, left: 10 },
      br: { bottom: 10, right: 10 },
    };
    return {
      position: 'absolute',
      ...corners[position],
      width: '16px',
      height: '16px',
      border: `3px solid ${tier.borderColor}`,
      opacity: 0.3,
      ...(position.includes('t') ? { borderBottom: 'none' } : { borderTop: 'none' }),
      ...(position.includes('l') ? { borderRight: 'none' } : { borderLeft: 'none' }),
    };
  };

  const pictureStyle = {
    width: "140px",
    height: "170px",
    backgroundColor: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    overflow: "hidden",
    fontSize: "60px",
    color: "#888",
    borderRadius: "12px",
    border: "1px solid #ddd",
    position: 'relative',
  };

  const pictureOverlayStyle = (overall) => {
    const tier = getCardTier(overall);
    return {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '25%',
      background: `linear-gradient(to top, ${tier.borderColor}22, transparent)`,
    };
  };

  const nameContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    margin: '8px 0 4px',
    flexWrap: 'wrap',
  };

  const nameStyle = (overall) => {
    const tier = getCardTier(overall);
    return {
      fontWeight: "bold",
      fontSize: "20px",
      color: tier.nameColor,
      letterSpacing: '0.5px',
    };
  };

  const positionBoxStyle = (overall) => {
    const tier = getCardTier(overall);
    return {
      backgroundColor: "rgba(255,255,255,0.7)",
      border: `2px solid ${tier.borderColor}44`,
      borderRadius: "8px",
      padding: "0 12px",
      fontWeight: "bold",
      fontSize: "14px",
      lineHeight: "1.8",
      color: "#444",
      textAlign: "center",
    };
  };

  const overallBoxStyle = (overall) => {
    const tier = getCardTier(overall);
    return {
      backgroundColor: tier.borderColor,
      color: '#fff',
      borderRadius: "8px",
      padding: "0 12px",
      fontWeight: "bold",
      fontSize: "16px",
      lineHeight: "1.8",
      textAlign: "center",
      boxShadow: `0 2px 8px ${tier.borderColor}55`,
    };
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '14px',
  };

  const statItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    padding: '6px 10px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(0,0,0,0.06)',
    color: '#333',
  };

  const scoreBoxStyle = (overall) => {
    const tier = getCardTier(overall);
    return {
      backgroundColor: tier.borderColor,
      color: '#fff',
      borderRadius: "6px",
      padding: "0 8px",
      fontWeight: "bold",
      fontSize: "13px",
      lineHeight: "1.8",
      minWidth: "28px",
      textAlign: "center",
    };
  };

  const dividerStyle = (overall) => {
    const tier = getCardTier(overall);
    return {
      height: '2px',
      background: `linear-gradient(90deg, transparent, ${tier.borderColor}55, transparent)`,
      margin: '12px 0',
    };
  };

  if (loading) return <div>Loading...</div>;

  const names = profiles.map(p => p.Contributor).filter(Boolean);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '24px' }}>⚽ Player Ratings</h2>
      <div style={containerStyle}>
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
          const tier = getCardTier(overall);

          return (
            <div
              key={name}
              style={cardStyle(overall)}
              onClick={() => handleCardClick(name)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = cardHoverStyle.transform;
                e.currentTarget.style.boxShadow = tier.hoverShadow;
                e.currentTarget.style.borderColor = tier.borderColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = tier.shadow;
              }}
            >
              {/* Accent top bar */}
              <div style={accentBarStyle(overall)} />

              {/* Corner decorations */}
              <div style={cornerStyle(overall, 'tl')} />
              <div style={cornerStyle(overall, 'tr')} />
              <div style={cornerStyle(overall, 'bl')} />
              <div style={cornerStyle(overall, 'br')} />

              <div style={pictureStyle}>
                <img
                  src={`/${name}.jpeg`}
                  alt={name}
                  style={{ width: '80%', height: '80%', objectFit: 'cover', borderRadius: '8px' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentNode;
                    parent.innerHTML = `<span style="font-size:60px;color:#888;">${name.charAt(0)}</span>`;
                  }}
                />
                <div style={pictureOverlayStyle(overall)} />
              </div>

              <div style={nameContainerStyle}>
                <span style={nameStyle(overall)}>{name}</span>
                <span style={positionBoxStyle(overall)}>{position}</span>
                <span style={overallBoxStyle(overall)}>{overall}</span>
              </div>

              <div style={dividerStyle(overall)} />

              <div style={statsGridStyle}>
                {['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map(stat => (
                  <div key={stat} style={statItemStyle}>
                    <span style={{ fontWeight: 600, color: '#555' }}>{stat}</span>
                    <span style={scoreBoxStyle(overall)}>{main[stat]}</span>
                  </div>
                ))}
              </div>

              {/* Weak Foot */}
              {weakFoot > 0 && (
                <div style={weakFootContainerStyle}>
                  <span style={{ fontWeight: 'bold', marginRight: '6px', color: '#555' }}>Weak Foot:</span>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={starStyle(i < weakFoot)}>
                      {i < weakFoot ? '★' : '☆'}
                    </span>
                  ))}
                </div>
              )}

              {/* Current Form */}
              {form && (
                <div style={formContainerStyle}>
                  <span style={{ fontWeight: 'bold', color: '#555' }}>Form:</span>
                  <span style={{
                    backgroundColor: form.color,
                    color: '#fff',
                    borderRadius: '4px',
                    padding: '0 10px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    lineHeight: '1.8',
                    minWidth: '24px',
                    textAlign: 'center',
                    boxShadow: `0 2px 8px ${form.color}55`,
                  }}>
                    {form.grade}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <PlayerStatsModal
          selectedPlayer={selectedPlayer}
          onClose={closeModal}
          profiles={profiles}
        />
      )}
    </div>
  );
}

export default PlayerRatings;