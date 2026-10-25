import React, { useState, useMemo } from "react";
import "./PlayerPicker.css";

/**
 * Reusable player picker with:
 *  - Dual mode: "By Name" (dropdown) / "By Photo" (3-col grid)
 *  - Dynamic filter pills from player.filterGroup field
 *  - Real-time search
 */
function PlayerPicker({ availablePlayers, pictureMap, value, onSelect }) {
  const [mode, setMode] = useState("name");
  const [searchText, setSearchText] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");

  // ── Dynamic filter groups from filterGroup field ──
  const filterGroups = useMemo(() => {
    const groups = new Set();
    availablePlayers.forEach(p => {
      const g = (p.filterGroup || "").trim();
      if (g) groups.add(g);
    });
    const preferredOrder = ["The Bros", "Barry", "馬哲", "梁哥"];
    const sorted = [...groups];
    sorted.sort((a, b) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [availablePlayers]);

  // ── Filtered + sorted players ──
  const filteredPlayers = useMemo(() => {
    let list = [...availablePlayers];
    if (filterGroup !== "All") {
      list = list.filter(p => (p.filterGroup || "").trim() === filterGroup);
    }
    if (searchText.trim()) {
      const search = searchText.trim().toLowerCase();
      list = list.filter(p => (p.Contributor || "").toLowerCase().includes(search));
    }
    list.sort((a, b) => {
      const rank = n => {
        const l = (n || "").toLowerCase();
        if (l === "ryan") return 0;
        if (l === "darren") return 1;
        return 2;
      };
      const ra = rank(a.Contributor),
        rb = rank(b.Contributor);
      if (ra !== rb) return ra - rb;
      return (a.Contributor || "").localeCompare(b.Contributor || "");
    });
    return list;
  }, [availablePlayers, filterGroup, searchText]);

  const getPicture = name =>
    name ? (pictureMap || {})[(name || "").trim().toLowerCase()] || null : null;

  return (
    <div className="pp-container">
      {/* ── Mode Tabs ── */}
      <div className="pp-tabs">
        <button
          className={`pp-tab ${mode === "name" ? "active" : ""}`}
          onClick={() => setMode("name")}
        >
          📋 By Name
        </button>
        <button
          className={`pp-tab ${mode === "photo" ? "active" : ""}`}
          onClick={() => setMode("photo")}
        >
          🖼️ By Photo
        </button>
      </div>

      {/* ── Filter Pills ── */}
      <div className="pp-filters">
        <button
          className={`pp-pill ${filterGroup === "All" ? "active" : ""}`}
          onClick={() => setFilterGroup("All")}
        >
          All
        </button>
        {filterGroups.map(g => (
          <button
            key={g}
            className={`pp-pill ${filterGroup === g ? "active" : ""}`}
            onClick={() => setFilterGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="pp-search">
        <input
          type="text"
          placeholder="🔍 Search player name..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        {searchText && (
          <button className="pp-search-clear" onClick={() => setSearchText("")}>
            ✕
          </button>
        )}
      </div>

      {/* ── Picker Body ── */}
      {mode === "name" ? (
        <div className="pp-name-mode">
          <select
            value={value || ""}
            onChange={e => {
              const val = e.target.value;
              if (!val) {
                onSelect(null);
              } else {
                const selected =
                  filteredPlayers.find(p => p.Contributor === val) ||
                  availablePlayers.find(p => p.Contributor === val);
                if (selected) onSelect(selected);
              }
            }}
          >
            <option value="">-- Empty Slot --</option>
            {filteredPlayers.map(p => (
              <option key={p.Contributor} value={p.Contributor}>
                {p.Contributor}
                {p.filterGroup ? ` (${p.filterGroup})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="pp-photo-mode">
          {value && (
            <button className="pp-clear-btn" onClick={() => onSelect(null)}>
              ✕ Clear Selection ({value})
            </button>
          )}
          <div className="pp-photo-grid">
            {filteredPlayers.map(p => {
              const imgUrl = getPicture(p.Contributor);
              const isSelected = value === p.Contributor;
              return (
                <div
                  key={p.Contributor}
                  className={`pp-photo-card ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelect(p)}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={p.Contributor}
                      className="pp-photo-avatar"
                    />
                  ) : (
                    <div className="pp-photo-avatar pp-photo-fallback">
                      {(p.Contributor || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="pp-photo-name">{p.Contributor}</span>
                  {isSelected && <span className="pp-photo-check">✓</span>}
                </div>
              );
            })}
            {filteredPlayers.length === 0 && (
              <div className="pp-photo-empty">
                No players match your filter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerPicker;