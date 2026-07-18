import React, { useState, useEffect } from "react";
import PlayerStatsModal from "./PlayerStatsModal";

function PlayerRatings() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/player-attributes');
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load player attributes:', err);
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

  const handleCardClick = (name) => {
    setSelectedPlayer(name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlayer(null);
  };

  // ---- 样式 ----
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 20px',
  };

  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: "20px",
    padding: "20px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    position: "relative",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "transform 0.1s ease",
    width: '100%',
  };

  const pictureStyle = {
    width: "150px",
    height: "180px",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 10px",
    overflow: "hidden",
    fontSize: "60px",
    color: "#888",
  };

  const nameContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    margin: '10px 0 5px',
    flexWrap: 'wrap',
  };

  const nameStyle = {
    fontWeight: "bold",
    fontSize: "18px",
  };

  const positionBoxStyle = {
    backgroundColor: "#e0e0e0",
    borderRadius: "8px",
    padding: "0 10px",
    fontWeight: "bold",
    fontSize: "16px",
    lineHeight: "1.8",
    color: "#333",
    textAlign: "center",
  };

  const overallBoxStyle = {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: "8px",
    padding: "0 10px",
    fontWeight: "bold",
    fontSize: "16px",
    lineHeight: "1.8",
    textAlign: "center",
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2px",
    marginTop: "12px",
  };

  const statItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    padding: "1px 0",
  };

  const scoreBoxStyle = {
    backgroundColor: "#28a745",
    color: "#fff",
    borderRadius: "8px",
    padding: "0 8px",
    fontWeight: "bold",
    fontSize: "14px",
    lineHeight: "1.8",
    minWidth: "28px",
    textAlign: "center",
  };

  if (loading) return <div>Loading...</div>;

  const names = profiles.map(p => p.Contributor).filter(Boolean);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>⚽ Player Ratings</h2>
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

          return (
            <div key={name} style={cardStyle} onClick={() => handleCardClick(name)}>
              <div style={pictureStyle}>
                <img
                  src={`/${name}.jpeg`}
                  alt={name}
                  style={{ width: '80%', height: '80%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentNode;
                    parent.innerHTML = `<span style="font-size:60px;color:#888;">${name.charAt(0)}</span>`;
                  }}
                />
              </div>

              <div style={nameContainerStyle}>
                <span style={nameStyle}>{name}</span>
                <span style={positionBoxStyle}>{position}</span>
                <span style={overallBoxStyle}>{overall}</span>
              </div>

              <div style={statsGridStyle}>
                {['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map(stat => (
                  <div key={stat} style={statItemStyle}>
                    <span>{stat}</span>
                    <span style={scoreBoxStyle}>{main[stat]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 模态框组件（已抽离） */}
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