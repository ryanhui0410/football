import React from "react";

function MenuButton({ menuOpen, toggleMenu }) {
  return (
    <div
      className="menu-icon"
      onClick={toggleMenu}
      style={{
        position: "fixed",
        top: "10px",
        left: menuOpen ? "260px" : "10px",
        fontSize: "2.8rem",
        cursor: "pointer",
        zIndex: 1100,
        transition: "left 0.4s ease, transform 0.4s ease",
        transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)",
        color: "#fff",
        backgroundColor: "#333",
        borderRadius: "8px",
        padding: "6px 12px",
      }}
    >
      ☰
    </div>
  );
}

export default MenuButton;