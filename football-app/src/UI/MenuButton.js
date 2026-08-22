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
        fontSize: "2.2rem",
        cursor: "pointer",
        zIndex: 9999,
        transition: "left 0.4s ease, transform 0.4s ease",
        transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)",
        color: "#fff",
        backgroundColor: "rgba(51, 51, 51, 0.9)",
        borderRadius: "8px",
        padding: "4px 10px",
        lineHeight: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Ensure it's completely out of document flow
        pointerEvents: "auto",
      }}
    >
      ☰
    </div>
  );
}

export default MenuButton;