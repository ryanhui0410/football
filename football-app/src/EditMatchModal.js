import React, { useState } from "react";

function EditMatchModal({ match, onClose, onSave }) {
  // Destructure using the actual property names from the match object
  const {
    index,
    contributorName,
    date,
    location,
    rating: initialRating = "",
    "Left Foot": initialLeftFoot = "",
    "Right Foot": initialRightFoot = "",
    Head: initialHead = "",
    Assist: initialAssist = "",
  } = match;

  const [rating, setRating] = useState(initialRating);
  const [leftFoot, setLeftFoot] = useState(initialLeftFoot);
  const [rightFoot, setRightFoot] = useState(initialRightFoot);
  const [head, setHead] = useState(initialHead);
  const [assist, setAssist] = useState(initialAssist);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/modify-stats/${index}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Rating: rating,
          "Left Foot": leftFoot,
          "Right Foot": rightFoot,
          Head: head,
          Assist: assist,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to save");
      }

      await onSave(); // refresh parent data
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => onClose();

  // Inline styles (same as before)
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  };

  const modalStyle = {
    backgroundColor: "#fff",
    padding: "30px 40px",
    borderRadius: "12px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    position: "relative",
  };

  const fieldStyle = {
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
  };

  const labelStyle = {
    fontWeight: "bold",
    marginBottom: "4px",
    fontSize: "14px",
    color: "#333",
  };

  const inputStyle = {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  };

  const readOnlyStyle = {
    ...inputStyle,
    backgroundColor: "#f5f5f5",
    color: "#666",
    cursor: "not-allowed",
  };

  const buttonGroupStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
  };

  const saveButtonStyle = {
    padding: "10px 24px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  };

  const cancelButtonStyle = {
    padding: "10px 24px",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  };

  return (
    <div style={overlayStyle} onClick={handleCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, textAlign: "center" }}>✏️ Edit Match</h2>

        {/* Read-only: Contributor (now uses contributorName) */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Contributor</label>
          <input style={readOnlyStyle} value={contributorName || ""} readOnly />
        </div>

        {/* Read-only: Date */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Date</label>
          <input style={readOnlyStyle} value={date || ""} readOnly />
        </div>

        {/* Read-only: Location */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Location</label>
          <input style={readOnlyStyle} value={location || ""} readOnly />
        </div>

        {/* Editable: Rating */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Rating</label>
          <input
            style={inputStyle}
            type="text"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="e.g. 9.8"
          />
        </div>

        {/* Editable: Left Foot */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Left Foot</label>
          <input
            style={inputStyle}
            type="text"
            value={leftFoot}
            onChange={(e) => setLeftFoot(e.target.value)}
            placeholder="e.g. 2"
          />
        </div>

        {/* Editable: Right Foot */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Right Foot</label>
          <input
            style={inputStyle}
            type="text"
            value={rightFoot}
            onChange={(e) => setRightFoot(e.target.value)}
            placeholder="e.g. 1"
          />
        </div>

        {/* Editable: Head */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Head</label>
          <input
            style={inputStyle}
            type="text"
            value={head}
            onChange={(e) => setHead(e.target.value)}
            placeholder="e.g. 0"
          />
        </div>
        {/* NEW: Assist field */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Assist</label>
          <input
            style={inputStyle}
            type="text"
            value={assist}
            onChange={(e) => setAssist(e.target.value)}
            placeholder="e.g. 2"
          />
        </div>
        {error && (
          <div style={{ color: "#d32f2f", marginBottom: "12px", fontSize: "14px" }}>
            ❌ {error}
          </div>
        )}

        <div style={buttonGroupStyle}>
          <button
            style={cancelButtonStyle}
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            style={saveButtonStyle}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditMatchModal;