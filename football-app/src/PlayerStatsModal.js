// PlayerStatsModal.js
import React from "react";

// ---- 子属性分组 ----
const subAttrGroups = {
  PAC: ['Acceleration', 'Sprint Speed'],
  SHO: ['Positioning', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties'],
  PAS: ['Vision', 'Crossing', 'Free Kick Accuracy', 'Short Passing', 'Long Passing', 'Curve'],
  DRI: ['Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure'],
  DEF: ['Interceptions', 'Heading Accuracy', 'Def Awareness', 'Standing Tackle', 'Sliding Tackle'],
  PHY: ['Jumping', 'Stamina', 'Strength', 'Aggression']
};

// ---- 颜色规则（黄色已加深） ----
const getColor = (score) => {
  const num = Number(score);
  if (num >= 85) return '#006400';      // 深绿
  if (num >= 75) return '#32CD32';      // 亮绿
  if (num >= 60) return '#D4A017';      // 深金黄
  return '#FF0000';                     // 红
};

// ---- 样式 ----
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 2000,
};

const modalContentStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '20px',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  position: 'relative',
};

const closeButtonStyle = {
  position: 'absolute',
  top: '15px',
  right: '20px',
  fontSize: '28px',
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  color: '#333',
};

const modalTitleStyle = {
  textAlign: 'center',
  fontSize: '24px',
  marginBottom: '20px',
  borderBottom: '2px solid #eee',
  paddingBottom: '10px',
};

const modalGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '15px',
  marginTop: '10px',
};

const groupContainerStyle = {
  backgroundColor: '#f9f9f9',
  borderRadius: '10px',
  padding: '8px 12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const groupTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '15px',
  fontWeight: 'bold',
  marginBottom: '4px',
  color: '#333',
  borderBottom: '1px solid #ddd',
  paddingBottom: '3px',
};

const groupScoreBoxStyle = {
  backgroundColor: "#28a745",
  color: "#fff",
  borderRadius: "8px",
  padding: "0 6px",
  fontWeight: "bold",
  fontSize: "13px",
  lineHeight: "1.8",
  minWidth: "24px",
  textAlign: "center",
};

const subItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '2px 0',
  fontSize: '13px',
  borderBottom: '1px solid #f0f0f0',
  gap: '4px',
};

const subLabelStyle = {
  flex: 1,
  textAlign: 'left',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const barContainerStyle = {
  width: '85px',
  height: '6px',
  backgroundColor: '#e0e0e0',
  borderRadius: '3px',
  overflow: 'hidden',
  flexShrink: 0,
};

const barFillStyle = (value, color) => ({
  width: `${Math.min(Math.max(value, 0), 100)}%`,
  height: '100%',
  backgroundColor: color,
  borderRadius: '3px',
  transition: 'width 0.2s',
});

const subValueStyle = {
  fontWeight: 'bold',
  width: '24px',
  textAlign: 'right',
  flexShrink: 0,
};

// ---- 组件 ----
const PlayerStatsModal = ({ selectedPlayer, onClose, profiles }) => {
  if (!selectedPlayer) return null;

  const getProfile = (name) => {
    return profiles.find(p => p.Contributor === name) || { Contributor: name };
  };

  const profile = getProfile(selectedPlayer);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose}>✕</button>
        <div style={modalTitleStyle}>{selectedPlayer}</div>

        <div style={modalGridStyle}>
          {Object.entries(subAttrGroups).map(([group, attrs]) => {
            return (
              <div key={group} style={groupContainerStyle}>
                <div style={groupTitleStyle}>
                  <span>{group}</span>
                  <span style={groupScoreBoxStyle}>{profile[group] ?? 0}</span>
                </div>
                {attrs.map(attr => {
                  const value = profile[attr] ?? 0;
                  const color = getColor(value);
                  return (
                    <div key={attr} style={subItemStyle}>
                      <span style={subLabelStyle}>{attr}</span>
                      <div style={barContainerStyle}>
                        <div style={barFillStyle(value, color)} />
                      </div>
                      <span style={{ ...subValueStyle, color }}>{value}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsModal;