import React, { useState } from "react";
import "./PlayerStatsModal.css";

// ---- 子属性分组 ----
const subAttrGroups = {
  PAC: ['Acceleration', 'Sprint Speed'],
  SHO: ['Positioning', 'Finishing', 'Shot Power', 'Long Shots', 'Volleys', 'Penalties'],
  PAS: ['Vision', 'Crossing', 'Free Kick Accuracy', 'Short Passing', 'Long Passing', 'Curve'],
  DRI: ['Agility', 'Balance', 'Reactions', 'Ball Control', 'Dribbling', 'Composure'],
  DEF: ['Interceptions', 'Heading Accuracy', 'Def Awareness', 'Standing Tackle', 'Sliding Tackle'],
  PHY: ['Jumping', 'Stamina', 'Strength', 'Aggression'],
};

// ---- 颜色规则 ----
const getColor = (score) => {
  const num = Number(score);
  if (num >= 85) return '#006400';
  if (num >= 75) return '#32CD32';
  if (num >= 60) return '#D4A017';
  return '#FF0000';
};

// ---- 球场组件 ----
const PositionCourt = ({ positionRatings }) => {
  if (!positionRatings || Object.keys(positionRatings).length === 0) {
    return <p className="court-empty-msg">暂无位置评分数据</p>;
  }

  const ratings = Object.values(positionRatings).filter(
    (v) => typeof v === 'number' && v > 0
  );
  const bestRating = ratings.length > 0 ? Math.max(...ratings) : 0;

  const getPosClass = (rating) => {
    if (rating === 0) return 'court-pos empty';
    if (rating >= bestRating - 5) return 'court-pos highlighted';
    return 'court-pos playable';
  };

  const renderPosition = (posId, label) => {
    const rating = positionRatings[posId] || 0;
    return (
      <div className={getPosClass(rating)}>
        <span>{label}</span>
        {rating > 0 && <span className="court-pos-rating">{rating}</span>}
      </div>
    );
  };

  return (
    <div className="court-wrapper">
      <div className="court-rows">
        <div className="court-row attack">
          <div className="court-col">{renderPosition('LW', 'LW')}</div>
          <div className="court-col-stack">
            {renderPosition('CF', 'CF')}
            {renderPosition('SS', 'SS')}
          </div>
          <div className="court-col">{renderPosition('RW', 'RW')}</div>
        </div>
        <div className="court-row mid">
          <div className="court-col">{renderPosition('LM', 'LM')}</div>
          <div className="court-col-stack">
            {renderPosition('AM', 'AM')}
            {renderPosition('CM', 'CM')}
            {renderPosition('DM', 'DM')}
          </div>
          <div className="court-col">{renderPosition('RM', 'RM')}</div>
        </div>
        <div className="court-row defense">
          <div className="court-col">{renderPosition('LB', 'LB')}</div>
          <div className="court-col-stack">
            {renderPosition('CB', 'CB')}
            {renderPosition('GK', 'GK')}
          </div>
          <div className="court-col">{renderPosition('RB', 'RB')}</div>
        </div>
      </div>
    </div>
  );
};

// ---- 比较弹窗组件 ----
const CompareModal = ({ player1, player2, onClose, profiles }) => {
  const getProfile = (name) => profiles.find((p) => p.Contributor === name) || {};
  const p1 = getProfile(player1);
  const p2 = getProfile(player2);

  const renderCompareRow = (attr, large = false) => {
    const v1 = p1[attr] ?? 0;
    const v2 = p2[attr] ?? 0;
    const diff1 = v1 - v2;
    const diff2 = v2 - v1;

    return (
      <div key={attr} className={`cmp-row${large ? ' overall-row' : ''}`}>
        <div className="cmp-col">
          <span className={`cmp-value${large ? ' large' : ''}`} style={{ color: getColor(v1) }}>
            {v1}
          </span>
          {diff1 > 0 && (
            <span className={`cmp-diff${large ? ' large' : ''}`}>+{diff1}</span>
          )}
        </div>
        <div className={`cmp-label${large ? ' large' : ''}`}>{attr}</div>
        <div className="cmp-col">
          <span className={`cmp-value${large ? ' large' : ''}`} style={{ color: getColor(v2) }}>
            {v2}
          </span>
          {diff2 > 0 && (
            <span className={`cmp-diff${large ? ' large' : ''}`}>+{diff2}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="psm-overlay" onClick={onClose}>
      <div className="cmp-content" onClick={(e) => e.stopPropagation()}>
        <button className="psm-close" onClick={onClose}>✕</button>
        <div className="cmp-title"><h2>⚔️ Player Comparison</h2></div>
        <div className="cmp-header">
          <div className="cmp-header-name p1">{player1}</div>
          <div className="cmp-header-vs">VS</div>
          <div className="cmp-header-name p2">{player2}</div>
        </div>
        {renderCompareRow('overall', true)}
        <div className="cmp-section">
          <div className="cmp-section-title">─── Main Attributes ───</div>
          {['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map((attr) => renderCompareRow(attr))}
        </div>
        {Object.entries(subAttrGroups).map(([group, attrs]) => (
          <div key={group} className="cmp-section">
            <div className="cmp-section-title">─── {group} Details ───</div>
            {attrs.map((attr) => renderCompareRow(attr))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- 主模态框组件 ----
const PlayerStatsModal = ({ selectedPlayer, onClose, profiles, onUpdate }) => {
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlayer, setComparePlayer] = useState('');
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  // ✏️ Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newPos, setNewPos] = useState('');
  const [newPosRating, setNewPosRating] = useState('');

  if (!selectedPlayer) return null;

  const profile = profiles.find((p) => p.Contributor === selectedPlayer) || { Contributor: selectedPlayer };
  const otherPlayers = profiles.filter((p) => p.Contributor !== selectedPlayer).map((p) => p.Contributor);

  // --- Edit Handlers ---
  const startEditing = () => {
    const cloned = JSON.parse(JSON.stringify(profile));
    if (!cloned.positionRatings) cloned.positionRatings = {};
    setEditData(cloned);
    setIsEditing(true);
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handlePosRatingChange = (pos, value) => {
    setEditData(prev => ({
      ...prev,
      positionRatings: { ...prev.positionRatings, [pos]: Number(value) }
    }));
  };

  const removePosRating = (pos) => {
    setEditData(prev => {
      const updated = { ...prev.positionRatings };
      delete updated[pos];
      return { ...prev, positionRatings: updated };
    });
  };

  const addPosRating = () => {
    if (!newPos.trim() || !newPosRating) return;
    handlePosRatingChange(newPos.trim().toUpperCase(), Number(newPosRating));
    setNewPos('');
    setNewPosRating('');
  };

  const handlePictureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert("⚠️ Image too large! Please use an image under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => handleEditChange('picture', reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const res = await fetch("http://localhost:5000/player-attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        alert("✅ Player stats updated successfully!");
        setIsEditing(false);
        if (onUpdate) onUpdate(); // Tell parent to refetch profiles
        else onClose();
      } else {
        alert("❌ Failed to save.");
      }
    } catch (err) {
      alert("❌ Error saving.");
    }
  };

  return (
    <>
      <div className="psm-overlay" onClick={onClose}>
        <div className="psm-content" onClick={(e) => e.stopPropagation()}>
          <button className="psm-close" onClick={onClose}>✕</button>
          <div className="psm-title">{selectedPlayer}</div>

          {/* Action Buttons */}
          <div className="psm-header-actions">
            {!isEditing && (
              <button className="psm-edit-toggle" onClick={startEditing}>✏️ Edit Stats</button>
            )}
            <button className="psm-compare-toggle" onClick={() => setCompareMode(!compareMode)}>
              {compareMode ? '🔽 Hide Compare' : '⚔️ Compare Player'}
            </button>
          </div>

          {isEditing ? (
            /* ================= EDIT MODE ================= */
            <div className="psm-edit-form">
              <div className="psm-edit-section">
                <h3>Basic Info</h3>
                <div className="psm-edit-grid cols-2">
                  <label>Overall: <input type="number" value={editData.overall || 0} onChange={e => handleEditChange('overall', Number(e.target.value))} /></label>
                  <label>Position: <input type="text" value={editData.position || ''} onChange={e => handleEditChange('position', e.target.value)} /></label>
                  <label>Preferred Foot: 
                    <select value={editData.preferredFoot || 'Right'} onChange={e => handleEditChange('preferredFoot', e.target.value)}>
                      <option>Right</option><option>Left</option>
                    </select>
                  </label>
                  <label>Weak Foot: 
                    <select value={editData.weakFoot || 3} onChange={e => handleEditChange('weakFoot', Number(e.target.value))}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="psm-file-label">Profile Picture: <input type="file" accept="image/*" onChange={handlePictureUpload} /></label>
                </div>
              </div>

              <div className="psm-edit-section">
                <h3>Main Attributes</h3>
                <div className="psm-edit-grid cols-6">
                  {['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'].map(attr => (
                    <label key={attr}>{attr}: <input type="number" value={editData[attr] || 0} onChange={e => handleEditChange(attr, Number(e.target.value))} /></label>
                  ))}
                </div>
              </div>

              {Object.entries(subAttrGroups).map(([group, attrs]) => (
                <div className="psm-edit-section" key={group}>
                  <h3>{group} Details</h3>
                  <div className="psm-edit-grid cols-3">
                    {attrs.map(attr => (
                      <label key={attr}>{attr}: <input type="number" value={editData[attr] || 0} onChange={e => handleEditChange(attr, Number(e.target.value))} /></label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="psm-edit-section">
                <h3>Position Ratings</h3>
                <div className="psm-edit-grid cols-4">
                  {editData.positionRatings && Object.entries(editData.positionRatings).map(([pos, rating]) => (
                    <div key={pos} className="psm-pos-edit-item">
                      <label>{pos}: <input type="number" value={rating} onChange={e => handlePosRatingChange(pos, e.target.value)} /></label>
                      <button className="psm-remove-pos" onClick={() => removePosRating(pos)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="psm-add-pos">
                  <input type="text" placeholder="Pos (e.g. ST)" value={newPos} onChange={e => setNewPos(e.target.value)} />
                  <input type="number" placeholder="Rating" value={newPosRating} onChange={e => setNewPosRating(e.target.value)} />
                  <button onClick={addPosRating}>+ Add</button>
                </div>
              </div>

              <div className="psm-edit-actions">
                <button className="psm-save-btn" onClick={handleSave}>💾 Save Changes</button>
                <button className="psm-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            /* ================= VIEW MODE ================= */
            <>
              {compareMode && (
                <div className="psm-compare-row">
                  <select className="psm-compare-select" value={comparePlayer} onChange={(e) => setComparePlayer(e.target.value)}>
                    <option value="">Select player...</option>
                    {otherPlayers.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <button className="psm-compare-btn" onClick={() => comparePlayer && setShowCompareModal(true)} disabled={!comparePlayer}>Compare</button>
                </div>
              )}

              <div className="psm-grid">
                {Object.entries(subAttrGroups).map(([group, attrs]) => (
                  <div key={group} className="psm-group">
                    <div className="psm-group-title">
                      <span>{group}</span>
                      <span className="psm-group-score">{profile[group] ?? 0}</span>
                    </div>
                    {attrs.map((attr) => {
                      const value = profile[attr] ?? 0;
                      const color = getColor(value);
                      return (
                        <div key={attr} className="psm-sub-item">
                          <span className="psm-sub-label">{attr}</span>
                          <div className="psm-bar-container">
                            <div className="psm-bar-fill" style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: color }} />
                          </div>
                          <span className="psm-sub-value" style={{ color }}>{value}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <PositionCourt positionRatings={profile.positionRatings} />
            </>
          )}
        </div>
      </div>

      {showCompareModal && comparePlayer && (
        <CompareModal player1={selectedPlayer} player2={comparePlayer} onClose={() => setShowCompareModal(false)} profiles={profiles} />
      )}
    </>
  );
};

export default PlayerStatsModal;