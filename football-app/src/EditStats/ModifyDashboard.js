import React, { useState } from "react";
import EditMatchModal from "./EditMatchModal";

function ModifyDashboard({ contributors, onSave }) {
  const [selectedMatch, setSelectedMatch] = useState(null);

  const openModal = (match, contributorName) => {
    // Preserve the global index from the match object
    setSelectedMatch({ ...match, contributorName });
  };

  const closeModal = () => {
    setSelectedMatch(null);
  };

  return (
    <div>
      {contributors.map((contributor) => (
        <div key={contributor.name}>
          <h3>{contributor.name}</h3>
          {contributor.matches.map((match, idx) => (
            <div
              key={idx} // use idx for React key only
              style={{
                border: "1px solid #ccc",
                margin: "8px",
                padding: "8px",
                cursor: "pointer",
              }}
              onClick={() => openModal(match, contributor.name)}
            >
              📅 {match.date} — {match.location} — {match.rating}
            </div>
          ))}
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