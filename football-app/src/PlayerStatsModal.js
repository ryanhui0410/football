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

// ---- 颜色规则（用于子属性数值） ----
const getColor = (score) => {
  const num = Number(score);
  if (num >= 85) return '#006400';
  if (num >= 75) return '#32CD32';
  if (num >= 60) return '#D4A017';
  return '#FF0000';
};

// ---- 球场组件（新布局） ----
// ---- 球场组件（新布局：垂直堆叠） ----
const PositionCourt = ({ positionRatings }) => {
  if (!positionRatings || Object.keys(positionRatings).length === 0) {
    return <p style={{ textAlign: 'center', color: '#999', marginTop: '10px' }}>暂无位置评分数据</p>;
  }

  const ratings = Object.values(positionRatings).filter(v => typeof v === 'number' && v > 0);
  const bestRating = ratings.length > 0 ? Math.max(...ratings) : 0;

  const getBgColor = (rating) => {
    if (rating === 0) return 'rgba(200,200,200,0.2)';
    if (rating === bestRating) return '#006400';
    if (rating >= bestRating - 5) return '#32CD32';
    return 'rgba(200,200,200,0.2)';
  };

  const getTextColor = (rating) => {
    if (rating === 0) return '#999';
    if (rating >= bestRating - 5) return '#fff';
    return '#999';
  };

  const renderPosition = (posId, label, extraStyle = {}) => {
    const rating = positionRatings[posId] || 0;
    const bgColor = getBgColor(rating);
    const textColor = getTextColor(rating);
    const isHighlighted = rating > 0 && rating >= bestRating - 5;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
          borderRadius: '6px',
          border: isHighlighted ? '2px solid rgba(255,255,255,0.6)' : '1px solid rgba(255,255,255,0.2)',
          boxShadow: isHighlighted ? '0 2px 8px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.2)',
          color: textColor,
          fontWeight: 'bold',
          fontSize: '12px',
          padding: '2px',
          textAlign: 'center',
          transition: 'all 0.2s',
          flex: 1,
          minHeight: '30px',
          ...extraStyle,
        }}
      >
        <span>{label}</span>
        {rating > 0 && <span style={{ fontSize: '10px' }}>{rating}</span>}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#2e7d32',
        borderRadius: '12px',
        marginTop: '15px',
        padding: '12px',
        border: '2px solid #fff',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* === 锋线 === */}
        <div style={{ display: 'flex', gap: '8px', height: '90px' }}>
          {/* LW 占左列 */}
          <div style={{ flex: 1, display: 'flex' }}>
            {renderPosition('LW', 'LW')}
          </div>
          {/* 中间：CF + SS 垂直等分 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {renderPosition('CF', 'CF')}
            {renderPosition('SS', 'SS')}
          </div>
          {/* RW 占右列 */}
          <div style={{ flex: 1, display: 'flex' }}>
            {renderPosition('RW', 'RW')}
          </div>
        </div>

        {/* === 中场 === */}
        <div style={{ display: 'flex', gap: '8px', height: '120px' }}>
          {/* LM 左列，高度等于中间三列之和 */}
          <div style={{ flex: 1, display: 'flex' }}>
            {renderPosition('LM', 'LM')}
          </div>
          {/* 中间：AM + CM + DM 垂直等分 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {renderPosition('AM', 'AM')}
            {renderPosition('CM', 'CM')}
            {renderPosition('DM', 'DM')}
          </div>
          {/* RM 右列 */}
          <div style={{ flex: 1, display: 'flex' }}>
            {renderPosition('RM', 'RM')}
          </div>
        </div>

        {/* === 防线 === */}
        <div style={{ display: 'flex', gap: '8px', height: '80px' }}>
          {/* LB 左列 */}
          <div style={{ flex: 1, display: 'flex' }}>
            {renderPosition('LB', 'LB')}
          </div>
          {/* 中间：CB + GK 垂直等分 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {renderPosition('CB', 'CB')}
            {renderPosition('GK', 'GK')}
          </div>
          {/* RB 右列 */}
          <div style={{ flex: 1, display: 'flex' }}>
            {renderPosition('RB', 'RB')}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- 模态框主组件（其余部分保持不变） ----
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

        <PositionCourt positionRatings={profile.positionRatings} />
      </div>
    </div>
  );
};

// ---- 样式（完全复用之前定义） ----
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
  maxWidth: '700px',
  width: '95%',
  maxHeight: '90vh',
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

export default PlayerStatsModal;