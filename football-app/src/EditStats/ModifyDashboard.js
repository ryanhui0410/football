import React, { useState } from "react";
import EditMatchModal from "./EditMatchModal";
import "./ModifyDashboard.css"; // Import the new CSS file

function ModifyDashboard({ contributors, onSave }) {
  const [selectedMatch, setSelectedMatch] = useState(null);

  const openModal = (match, contributorName) => {
    setSelectedMatch({ ...match, contributorName });
  };

  const closeModal = () => {
    setSelectedMatch(null);
  };

  return (
    <div className="md-wrap">
      {contributors.map((contributor) => (
        <div key={contributor.name} className="md-contributor-section">
          <div className="md-contributor-header">
            <h2 className="md-contributor-name">{contributor.name}</h2>
            <span className="md-match-count">{contributor.matches.length} Matches</span>
          </div>
          
          <table className="md-table">
            <thead className="md-thead">
              <tr>
                <th className="md-th">Date & Location</th>
                <th className="md-th center">Contributions</th>
                <th className="md-th center">Goals / Assists</th>
                <th className="md-th center">Rating</th>
                <th className="md-th center">Action</th>
              </tr>
            </thead>
            <tbody className="md-tbody">
              {contributor.matches.map((match, idx) => {
                // Calculate goals safely (Total Contributions - Assists)
                const goals = Math.max(0, (match.goalContribution || 0) - (match.assist || 0));
                
                return (
                  <tr 
                    key={idx} 
                    className="md-row" 
                    onClick={() => openModal(match, contributor.name)}
                  >
                    <td className="md-td" data-label="Date & Location">
                      <div className="md-date">{match.date}</div>
                      <div className="md-location">📍 {match.location || "Unknown"}</div>
                    </td>
                    <td className="md-td center" data-label="Contributions">
                      <div className={`md-symbols ${!match.symbol ? 'empty' : ''}`}>
                        {match.symbol || "No symbols"}
                      </div>
                    </td>
                    <td className="md-td center" data-label="Goals / Assists">
                      <div className="md-stat-box">
                        <div className="md-stat">
                          <div className="md-stat-val">{goals}</div>
                          <div className="md-stat-label">Goals</div>
                        </div>
                        <div className="md-stat">
                          <div className="md-stat-val">{match.assist || 0}</div>
                          <div className="md-stat-label">Assists</div>
                        </div>
                      </div>
                    </td>
                    <td className="md-td center" data-label="Rating">
                      <span className="md-rating">{match.rating || "—"}</span>
                    </td>
                    <td className="md-td center" data-label="Action">
                      <button 
                        className="md-edit-btn" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click when clicking button
                          openModal(match, contributor.name);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {selectedMatch && (
        <EditMatchModal
          match={selectedMatch}
          onClose={closeModal}
          onSave={onSave}
        />
      )}
    </div>
  );
}

export default ModifyDashboard;