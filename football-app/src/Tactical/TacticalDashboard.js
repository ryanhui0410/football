import React, { useState, useEffect } from "react";
import MatchLineup from "../EditStats/MatchLineup"; // Reusing the pitch component!
import "./TacticalDashboard.css";

function TacticalDashboard() {
  const [matchDetails, setMatchDetails] = useState({
    Date: "",
    Location: "",
    Time: ""
  });
  
  const [timeHistory, setTimeHistory] = useState([]);

  // Fetch historical times and locations on load
  useEffect(() => {
    fetch("http://localhost:5000/stats-history")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setTimeHistory(data.times || []);
        }
      })
      .catch(err => console.error("Failed to fetch history", err));
  }, []);

  const handleChange = (e) => {
    setMatchDetails({ ...matchDetails, [e.target.name]: e.target.value });
  };

  return (
    <div className="td-wrap">
      <h2 className="td-title">⚔️ Tactical Dashboard</h2>
      
      <div className="td-details-card">
        <h3>Match Details</h3>
        <div className="td-inputs">
          
          {/* 1. FREE TEXT DATE INPUT */}
          <div className="td-field">
            <label>📅 Match Date</label>
            <input 
              type="text" 
              name="Date" 
              value={matchDetails.Date} 
              onChange={handleChange} 
              placeholder="e.g. 8/9/2026"
            />
          </div>

          <div className="td-field">
            <label>📍 Location</label>
            <input 
              type="text" 
              name="Location" 
              value={matchDetails.Location} 
              onChange={handleChange} 
              placeholder="e.g. 傑志"
            />
          </div>

          {/* 2. FREE TEXT TIME INPUT WITH HISTORY DROPDOWN */}
          <div className="td-field">
            <label>🕒 Time</label>
            <input 
              type="text" 
              name="Time" 
              value={matchDetails.Time} 
              onChange={handleChange} 
              placeholder="e.g. 10:30 AM"
              list="time-history-list"
            />
            <datalist id="time-history-list">
              {timeHistory.map((time, idx) => (
                <option key={idx} value={time} />
              ))}
            </datalist>
          </div>

        </div>
      </div>

      {/* Render the pitch only when a date is typed in */}
      {matchDetails.Date.trim() ? (
        <MatchLineup matchData={matchDetails} layout="vertical" />
      ) : (
        <div className="td-placeholder">
          <p>⚽ Please enter a <strong>Match Date</strong> to load the tactical pitch.</p>
        </div>
      )}
    </div>
  );
}

export default TacticalDashboard;