import React, { useState } from "react";

// ---- 子属性分组 ----
const subAttrGroups = {
  PAC: ['Acceleration', 'Sprint Speed'],
  SHO: ['Positioning', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties'],
  PAS: ['Vision', 'Crossing', 'Free Kick Accuracy', 'Short Passing', 'Long Passing', 'Curve'],
  DRI: ['Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure'],
  DEF: ['Interceptions', 'Heading Accuracy', 'Def Awareness', 'Standing Tackle', 'Sliding Tackle'],
  PHY: ['Jumping', 'Stamina', 'Strength', 'Aggression']
};

// 所有可比较的属性（主属性 + 子属性）
const allAttrs = [
  'PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY',
  'Acceleration', 'Sprint Speed',
  'Positioning', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties',
  'Vision', 'Crossing', 'Free Kick Accuracy', 'Short Passing', 'Long Passing', 'Curve',
  'Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure',
  'Interceptions', 'Heading Accuracy', 'Def Awareness', 'Standing Tackle', 'Sliding Tackle',
  'Jumping', 'Stamina', 'Strength', 'Aggression'
];

// ---- 颜色规则（用于子属性数值） ----
const getColor = (score) => {
  const num = Number(score);
  if (num >= 85) return '#006400';
  if (num >= 75) return '#32CD32';
  if (num >= 60) return '#D4A017';
  return '#FF0000';
};

// ---- 比较差异颜色 ----
const getDiffColor = (diff) => {
  if (diff > 0) return '#006400';
  if (diff < 0) return '#FF0000';
  return '#888';
};

// ---- 球场组件 ----
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
        <div style={{ display: 'flex', gap: '8px', height: '90px' }}>
          <div style={{ flex: 1, display: 'flex' }}>{renderPosition('LW', 'LW')}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {renderPosition('CF', 'CF')}
            {renderPosition('SS', 'SS')}
          </div>
          <div style={{ flex: 1, display: 'flex' }}>{renderPosition('RW', 'RW')}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', height: '120px' }}>
          <div style={{ flex: 1, display: 'flex' }}>{renderPosition('LM', 'LM')}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {renderPosition('AM', 'AM')}
            {renderPosition('CM', 'CM')}
            {renderPosition('DM', 'DM')}
          </div>
          <div style={{ flex: 1, display: 'flex' }}>{renderPosition('RM', 'RM')}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', height: '80px' }}>
          <div style={{ flex: 1, display: 'flex' }}>{renderPosition('LB', 'LB')}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {renderPosition('CB', 'CB')}
            {renderPosition('GK', 'GK')}
          </div>
          <div style={{ flex: 1, display: 'flex' }}>{renderPosition('RB', 'RB')}</div>
        </div>
      </div>
    </div>
  );
};

// ---- 比较弹窗组件 ----
const CompareModal = ({ player1, player2, onClose, profiles }) => {
  const getProfile = (name) => profiles.find(p => p.Contributor === name) || {};
  const p1 = getProfile(player1);
  const p2 = getProfile(player2);

  const renderCompareRow = (attr) => {
    const v1 = p1[attr] ?? 0;
    const v2 = p2[attr] ?? 0;
    const diff1 = v1 - v2;
    const diff2 = v2 - v1;

    return (
      <div key={attr} style={compareRowStyle}>
        <div style={compareColStyle}>
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: getColor(v1) }}>{v1}</span>
          {diff1 > 0 && (
            <span style={{ color: '#006400', fontWeight: 'bold', fontSize: '12px', marginTop: '2px' }}>
              +{diff1}
            </span>
          )}
        </div>
        <div style={compareLabelStyle}>{attr}</div>
        <div style={compareColStyle}>
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: getColor(v2) }}>{v2}</span>
          {diff2 > 0 && (
            <span style={{ color: '#006400', fontWeight: 'bold', fontSize: '12px', marginTop: '2px' }}>
              +{diff2}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={compareContentStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>⚔️ Player Comparison</h2>
        </div>

        {/* Header row with player names */}
        <div style={compareHeaderStyle}>
          <div style={{ ...compareHeaderColStyle, color: '#2196F3' }}>{player1}</div>
          <div style={compareHeaderLabelStyle}>VS</div>
          <div style={{ ...compareHeaderColStyle, color: '#F44336' }}>{player2}</div>
        </div>

        {/* Overall comparison */}
        <div style={{ ...compareRowStyle, backgroundColor: '#f0f0f0', borderRadius: '8px', marginBottom: '10px' }}>
          <div style={compareColStyle}>
            <span style={{ fontWeight: 'bold', fontSize: '22px', color: getColor(p1.overall || 0) }}>{p1.overall || 0}</span>
            {(p1.overall || 0) > (p2.overall || 0) && (
              <span style={{ color: '#006400', fontWeight: 'bold', fontSize: '13px' }}>
                +{(p1.overall || 0) - (p2.overall || 0)}
              </span>
            )}
          </div>
          <div style={{ ...compareLabelStyle, fontWeight: 'bold', fontSize: '16px' }}>Overall</div>
          <div style={compareColStyle}>
            <span style={{ fontWeight: 'bold', fontSize: '22px', color: getColor(p2.overall || 0) }}>{p2.overall || 0}</span>
            {(p2.overall || 0) > (p1.overall || 0) && (
              <span style={{ color: '#006400', fontWeight: 'bold', fontSize: '13px' }}>
                +{(p2.overall || 0) - (p1.overall || 0)}
              </span>
            )}
          </div>
        </div>

        {/* Main attributes */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
            ─── Main Attributes ───
          </div>
          {['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map(renderCompareRow)}
        </div>

        {/* Sub attributes grouped */}
        {Object.entries(subAttrGroups).map(([group, attrs]) => (
          <div key={group} style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', marginBottom: '8px', textAlign: 'center' }}>
              ─── {group} Details ───
            </div>
            {attrs.map(renderCompareRow)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- 主模态框组件 ----
const PlayerStatsModal = ({ selectedPlayer, onClose, profiles }) => {
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlayer, setComparePlayer] = useState('');
  const [showCompareModal, setShowCompareModal] = useState(false);

  if (!selectedPlayer) return null;

  const getProfile = (name) => {
    return profiles.find(p => p.Contributor === name) || { Contributor: name };
  };

  const profile = getProfile(selectedPlayer);

  // 可选的比较对象（排除当前球员）
  const otherPlayers = profiles
    .filter(p => p.Contributor !== selectedPlayer)
    .map(p => p.Contributor);

  const handleCompare = () => {
    if (comparePlayer) {
      setShowCompareModal(true);
    }
  };

  return (
    <>
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <button style={closeButtonStyle} onClick={onClose}>✕</button>
          <div style={modalTitleStyle}>{selectedPlayer}</div>

          {/* Compare section */}
          <div style={compareSectionStyle}>
            <button
              style={compareToggleStyle}
              onClick={() => setCompareMode(!compareMode)}
            >
              {compareMode ? '🔽 Hide Compare' : '⚔️ Compare Player'}
            </button>
            {compareMode && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={comparePlayer}
                  onChange={(e) => setComparePlayer(e.target.value)}
                  style={compareSelectStyle}
                >
                  <option value="">Select player...</option>
                  {otherPlayers.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <button
                  onClick={handleCompare}
                  disabled={!comparePlayer}
                  style={{
                    ...compareButtonStyle,
                    opacity: comparePlayer ? 1 : 0.5,
                    cursor: comparePlayer ? 'pointer' : 'not-allowed',
                  }}
                >
                  Compare
                </button>
              </div>
            )}
          </div>

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

      {/* Compare Modal */}
      {showCompareModal && comparePlayer && (
        <CompareModal
          player1={selectedPlayer}
          player2={comparePlayer}
          onClose={() => setShowCompareModal(false)}
          profiles={profiles}
        />
      )}
    </>
  );
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
  maxWidth: '700px',
  width: '95%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  position: 'relative',
};

const compareContentStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '20px',
  maxWidth: '500px',
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
  marginBottom: '15px',
  borderBottom: '2px solid #eee',
  paddingBottom: '10px',
};

const compareSectionStyle = {
  marginBottom: '15px',
  padding: '10px',
  backgroundColor: '#f8f9fa',
  borderRadius: '10px',
  border: '1px solid #e0e0e0',
};

const compareToggleStyle = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#2196F3',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '14px',
  width: '100%',
};

const compareSelectStyle = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '14px',
  backgroundColor: '#fff',
};

const compareButtonStyle = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#4CAF50',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '14px',
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

// ---- 比较弹窗样式 ----
const compareHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '2px solid #eee',
  marginBottom: '15px',
};

const compareHeaderColStyle = {
  flex: 1,
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '18px',
};

const compareHeaderLabelStyle = {
  width: '60px',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '14px',
  color: '#888',
};

const compareRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #f0f0f0',
};

const compareColStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '60px',
};

const compareLabelStyle = {
  width: '120px',
  textAlign: 'center',
  fontWeight: 600,
  color: '#555',
  fontSize: '13px',
};

export default PlayerStatsModal;