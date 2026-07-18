import React, { useState, useEffect } from "react";
import PlayerStatsForm from "./PlayerStatsForm";
import ContributorDashboard from "./ContributorDashboard";
import StatsSummary from "./StatsSummary";
import FrontPage from "./FrontPage"; // adjust path if needed
import ModifyDashboard from "./ModifyDashboard"; // new import
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import EditMatchPage from "./EditMatchPage";
import PlayerRatings from "./PlayerRatings";

class PlayerStats {
  constructor(fields) {
    Object.assign(this, fields);
  }
}

class Match {
  constructor({ Date, Symbol, Rating, Location }) {
    this.date = Date;
    this.symbol = Symbol;
    this.rating = Rating;
    this.location = Location;
  }
}

class Contributor {
  constructor(name, matches = []) {
    this.name = name;
    this.matches = matches;
  }

  addMatch(match) {
    this.matches.push(match);
  }

  getSortedMatches() {
    return this.matches.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [formData, setFormData] = useState({
    Date: "",
    Contributor: "",
    Goal: "",
    Assist: "",
    Rating: "",
    Location: "",
    Time: "",
    Error: "",
    source: "",
    LeftFoot: "",
    RightFoot: "",
    Head: "",
    OtherBodyParts: "",
  });
  const [history, setHistory] = useState({
    contributors: [],
    locations: [],
    times: [],
    sources: [],
  });

  const [contributors, setContributors] = useState([]);
  const [activeContributor, setActiveContributor] = useState(null);
  const [activeView, setActiveView] = useState(null); // 'add' or 'display'
  const [filterLocation, setFilterLocation] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [summaryData, setSummaryData] = useState([]);
  const handleHomeClick = () => {
    setShowSplash(true);
    setShowForm(false);
    setContributors([]);
    setSummaryData([]);
    setActiveView(null);
    setMenuOpen(false); // close sidebar after navigation
  };
  const handlePlayerRatingsClick = () => {
  setShowSplash(false);
  setContributors([]);
  setSummaryData([]);
  setShowForm(false);
  setActiveView("ratings");
  };
  const handleAddStatsClick = async () => {
    setShowSplash(false); 
    const res = await fetch("http://localhost:5000/stats-history");
    const data = await res.json();
    setHistory(data);
    setContributors([]);   // clear contributors
    setSummaryData([]);    // clear summary
    setShowForm(true);
    setActiveView("add");  // always set to add
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newStats = new PlayerStats(formData);
    await fetch("http://localhost:5000/add-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStats),
    });
    alert("✅ Stat saved successfully!");
    setShowForm(false);
  };

  // --- Display Stats ---
  const handleDisplayStatsClick = async () => {
  setShowSplash(false); 
  const res = await fetch("http://localhost:5000/stats");
  const data = await res.json();

  const contributorMap = {};
  data.forEach((stat) => {
  const name = stat.Contributor?.trim();
  if (!name) {
    // Skip empty or undefined contributors
    return;
  }
  if (!contributorMap[name]) {
    contributorMap[name] = new Contributor(name);
  }
  contributorMap[name].addMatch(new Match(stat));
});


  setContributors(Object.values(contributorMap));
  setSummaryData([]);    // clear summary
  setShowForm(false);
  setActiveView("display");  // always set to display
};
  const handleStatsSummaryClick = async () => {
    setShowSplash(false); 
    const res = await fetch("http://localhost:5000/stats");
    const data = await res.json();
    setSummaryData(data);
    setContributors([]);   // clear contributors
    setShowForm(false);
    setActiveView("summary");  // always set to summary
  };
  const handleModifyStatsClick = async () => {
    setShowSplash(false); 
    const res = await fetch("http://localhost:5000/stats");
    const data = await res.json();
    setContributors([]);   // clear contributors
    setSummaryData([]);    // clear summary
    setShowForm(false);
    setActiveView("modify");  // new view
    setContributors(Object.values(
      data.reduce((map, stat, idx) => {
        const name = stat.Contributor?.trim();
        if (!name) return map;
        if (!map[name]) map[name] = new Contributor(name);
        map[name].addMatch({ ...new Match(stat), index: idx }); // keep index for editing
        return map;
      }, {})
    ));
  };


  // --- Toggle Contributor Expansion ---
  const toggleContributor = (name) => {
  setActiveContributor(prev => (prev === name ? null : name));
  setFilterLocation("");
  setFilterMonth("");
  };
  const navigate = useNavigate();  
  return (
    <div>
      {/* Sidebar menu */}
      <div className="App">
        {showSplash ? <FrontPage /> : (
          <div>
            {/* your Add Stats / Display Stats / Summary buttons and components */}
          </div>
        )}

      </div>
      {/* Menu icon (always visible) */}
      <div
        className="menu-icon"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: "fixed",
          top: "20px",
          left: menuOpen ? "260px" : "20px", // shift slightly when sidebar open
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

      {/* Sidebar container */}
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
        <button
          onClick={handleHomeClick}
          style={{
            display: "block",
            width: "80%",
            margin: "10px auto",
            padding: "12px 0",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#607D8B", // blue‑grey
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#455A64")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#607D8B")}
        >
          🏠 Home
        </button>
        <button
          onClick={handleAddStatsClick}
          style={{
            display: "block",
            width: "80%",
            margin: "10px auto",
            padding: "12px 0",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#4CAF50",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#45a049")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#4CAF50")}
        >
          Add Stats
        </button>
        <button
          onClick={handleModifyStatsClick}
          style={{
            display: "block",
            width: "80%",
            margin: "10px auto",
            padding: "12px 0",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#9C27B0", // purple
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#7B1FA2")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#9C27B0")}
        >
          Modify Stats
        </button>

        <button
          onClick={handleDisplayStatsClick}
          style={{
            display: "block",
            width: "80%",
            margin: "10px auto",
            padding: "12px 0",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#2196F3",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#0b7dda")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#2196F3")}
        >
          Display Stats
        </button>
        <button
          onClick={handlePlayerRatingsClick}
          style={{
            display: "block",
            width: "80%",
            margin: "10px auto",
            padding: "12px 0",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#E91E63", // pink
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#C2185B")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#E91E63")}
        >
          Player Ratings
        </button>
        <button
          onClick={handleStatsSummaryClick}
          style={{
            display: "block",
            width: "80%",
            margin: "10px auto",
            padding: "12px 0",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#FF9800",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#e68900")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#FF9800")}
        >
          Stats Summary
        </button>
      </div>

      {/* Form for adding stats */}
       {activeView === "add" && showForm && (
        <PlayerStatsForm
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setActiveView(null);
          }}
          history={history}
        />
      )}
      {activeView === "ratings" && <PlayerRatings />}
      {activeView === "display" && contributors.length > 0 && (
        <ContributorDashboard
          contributors={contributors}
          activeContributor={activeContributor}
          toggleContributor={toggleContributor}
          filterLocation={filterLocation}
          setFilterLocation={setFilterLocation}
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
        />
      )}
      {activeView === "modify" && contributors.length > 0 && (
        <ModifyDashboard
          contributors={contributors}
          onSave={handleModifyStatsClick} // refresh after save
        />
      )}

      {/* Stats Summary */}
      {activeView === "summary" && (
        <StatsSummary stats={summaryData} />
      )}
      
    </div>
  );


}

export default App;
