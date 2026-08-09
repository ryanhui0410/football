import React from "react";

function Sidebar({
  menuOpen,
  handleHomeClick,
  handleAddStatsClick,
  handleModifyStatsClick,
  handleDisplayStatsClick,
  handlePlayerRatingsClick,
  handleStatsSummaryClick,
  handleCalendarClick,
  handleAddPlayerCardClick,
  handleTacticalClick,                 // ← 1. ADDED TO PROPS
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: menuOpen ? 0 : "-250px",
        width: "250px",
        height: "100%",
        backgroundColor: "#222",
        color: "#fff",
        paddingTop: "80px",
        boxShadow: menuOpen ? "2px 0 8px rgba(0,0,0,0.3)" : "none",
        transition: "left 0.4s ease",
        zIndex: 1000,
      }}
    >
      {[
        { label: "🏠 Home",             handler: handleHomeClick,          color: "#607D8B", hover: "#455A64" },
        { label: "Add Stats",           handler: handleAddStatsClick,      color: "#4CAF50", hover: "#45a049" },
        { label: "Modify Stats",        handler: handleModifyStatsClick,   color: "#9C27B0", hover: "#7B1FA2" },
        { label: "Player Ratings",      handler: handlePlayerRatingsClick, color: "#E91E63", hover: "#C2185B" },
        { label: "🪪 Add Player Card",  handler: handleAddPlayerCardClick, color: "#3F51B5", hover: "#303F9F" },
        { label: "⚔️ Tactical Board",   handler: handleTacticalClick,      color: "#FF5722", hover: "#E64A19" }, // ← 2. NEW BUTTON
        { label: "Stats Summary",       handler: handleStatsSummaryClick,  color: "#FF9800", hover: "#e68900" },
        { label: "📅 Calendar Match",   handler: handleCalendarClick,      color: "#009688", hover: "#00796B" },
      ].map((item, idx) => (
        <button
          key={idx}
          onClick={item.handler}
          style={{
            display: "block",
            width: "80%",
            margin: "10px auto",
            padding: "12px 0",
            borderRadius: "8px",
            border: "none",
            backgroundColor: item.color,
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = item.hover)}
          onMouseLeave={(e) => (e.target.style.backgroundColor = item.color)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default Sidebar;