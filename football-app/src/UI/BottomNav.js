import React from "react";
import "./BottomNav.css";

function BottomNav({ activeView, onNavigate }) {
  const items = [
    { key: "home", label: "Home", icon: "🏠", onClick: onNavigate.home },
    { key: "add", label: "Add Stats", icon: "➕", onClick: onNavigate.add },
    { key: "modify", label: "Modify", icon: "✏️", onClick: onNavigate.modify },
    { key: "summary", label: "Summary", icon: "📊", onClick: onNavigate.summary },
    { key: "calendar", label: "Calendar", icon: "📅", onClick: onNavigate.calendar },
    { key: "ratings", label: "Ratings", icon: "⭐", onClick: onNavigate.ratings },
    { key: "addPlayerCard", label: "Cards", icon: "🃏", onClick: onNavigate.cards },
    { key: "tactical", label: "Tactical", icon: "⚽", onClick: onNavigate.tactical },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-scroll">
        {items.map((item) => (
          <button
            key={item.key}
            className={`bottom-nav-item ${activeView === item.key ? "active" : ""}`}
            onClick={item.onClick}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;