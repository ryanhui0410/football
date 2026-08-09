import React, { useState } from "react";
import MatchLineup from "../EditStats/MatchLineup"; // Reusing the pitch component!
import "./TacticalDashboard.css";

function TacticalDashboard() {
  const [matchDetails, setMatchDetails] = useState({
    Date: "",
    Location: "",
    Time: ""
  });

  const handleChange = (e) => {
    setMatchDetails({ ...matchDetails, [e.target.name]: e.target.value });
  };

  return (
    <div className="td-wrap">
      <h2 className="td-title">⚔️ Tactical Dashboard</h2>
      
      <div className="td-details-card">
        <h3>Match Details</h3>
        <div className="td-inputs">
          <div className="td-field">
            <label>📅 Match Date</label>
            <input 
              type="date" 
              name="Date" 
              value={matchDetails.Date} 
              onChange={handleChange} 
            />
          </div>
          <div className="td-field">
            <label>📍 Location</label>
            <input 
              type="text" 
              name="Location" 
              value={matchDetails.Location} 
              onChange={handleChange} 
              placeholder="e.g. Victoria Park"
            />
          </div>
          <div className="td-field">
            <label>🕒 Time</label>
            <input 
              type="time" 
              name="Time" 
              value={matchDetails.Time} 
              onChange={handleChange} 
            />
          </div>
        </div>
      </div>

      {/* Render the pitch only when a date is selected */}
        {matchDetails.Date ? (
        <MatchLineup matchData={matchDetails} layout="vertical" />
      ) : (
        <div className="td-placeholder">
          <p>⚽ Please select a <strong>Match Date</strong> to load the tactical pitch.</p>
        </div>
      )}
    </div>
  );
}

export default TacticalDashboard;