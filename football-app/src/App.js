import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import PlayerStatsForm from "./AddStats/PlayerStatsForm";
import StatsSummary from "./StatsSummary/StatsSummary";
import FrontPage from "./UI/FrontPage";
import ModifyDashboard from "./EditStats/ModifyDashboard";
import EditMatchPage from "./EditStats/EditMatchPage";
import PlayerRatings from "./PlayerRatings/PlayerRatings";
import Sidebar from "./UI/Sidebar";
import MenuButton from "./UI/MenuButton";
import MatchCalendar from "./CalendarMatch/MatchCalendar";

class PlayerStats {
  constructor(fields) {
    Object.assign(this, fields);
  }
}

class Match {
  constructor({ 
    Date, Symbol, Rating, Location,
    'Left Foot': leftFoot, 'Right Foot': rightFoot, 'Head': head, 'Other body parts': other,
    'Assist': assist, 'Goal Contribution': goalContribution, 'Goal': goal,
    'Match result': matchResult, 'Win/Loss?': winLoss, 'Season': season,
    'source': source, 'Time': time,
    'Assist to': assistTo,             // ← Add this
    'Assist to count': assistToCount   // ← Add this
  }) {
    this.date = Date;
    this.symbol = Symbol;
    this.rating = Rating;
    this.location = Location;
    this.leftFoot = leftFoot || 0;
    this.rightFoot = rightFoot || 0;
    this.head = head || 0;
    this.other = other || 0;
    this.assist = assist || 0;
    this.goalContribution = goalContribution || 0;
    this.goal = goal || 0;
    this.matchResult = matchResult || '';
    this.winLoss = winLoss || '';
    this.season = season || '';
    this.source = source || '';
    this.time = time || '';
    this.assistTo = assistTo || '';           // ← Add this
    this.assistToCount = assistToCount || 0;  // ← Add this
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
    MatchResult: "",
    WinLoss: "",
    AssistTo: "",        // ← just add this one line
  });
  const [history, setHistory] = useState({
    contributors: [],
    locations: [],
    times: [],
    sources: [],
  });

  const [contributors, setContributors] = useState([]);
  const [activeContributor, setActiveContributor] = useState(null);
  const [activeView, setActiveView] = useState(null);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [summaryData, setSummaryData] = useState([]);
  const [filterYear, setFilterYear] = useState("");
  // ===== 新增 toggleMenu =====
  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleHomeClick = () => {
    setShowSplash(true);
    setShowForm(false);
    setContributors([]);
    setSummaryData([]);
    setActiveView(null);
    setMenuOpen(false);
  };
  const handleCalendarClick = async () => {
    setShowSplash(false);
    const res = await fetch("http://localhost:5000/stats");
    const data = await res.json();
    setSummaryData(data);      // reuse summaryData to hold the raw stats
    setContributors([]);
    setShowForm(false);
    setActiveView("calendar");
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
    setContributors([]);
    setSummaryData([]);
    setShowForm(true);
    setActiveView("add");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newStats = new PlayerStats(formData);
    console.log("📤 Sending:", JSON.stringify(newStats)); 
    await fetch("http://localhost:5000/add-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStats),
    });
    alert("✅ Stat saved successfully!");
    setShowForm(false);
  };

  const handleDisplayStatsClick = async () => {
    setShowSplash(false);
    const res = await fetch("http://localhost:5000/stats");
    const data = await res.json();

    const contributorMap = {};
    data.forEach((stat) => {
      const name = stat.Contributor?.trim();
      if (!name) return;
      if (!contributorMap[name]) contributorMap[name] = new Contributor(name);
      contributorMap[name].addMatch(new Match(stat));
    });

    setContributors(Object.values(contributorMap));
    setSummaryData([]);
    setShowForm(false);
    setActiveView("display");
  };

  const handleStatsSummaryClick = async () => {
    setShowSplash(false);
    const res = await fetch("http://localhost:5000/stats");
    const data = await res.json();
    setSummaryData(data);
    setContributors([]);
    setShowForm(false);
    setActiveView("summary");
  };

  const handleModifyStatsClick = async () => {
    setShowSplash(false);
    const res = await fetch("http://localhost:5000/stats");
    const data = await res.json();
    setContributors([]);
    setSummaryData([]);
    setShowForm(false);
    setActiveView("modify");
    setContributors(
      Object.values(
        data.reduce((map, stat, idx) => {
          const name = stat.Contributor?.trim();
          if (!name) return map;
          if (!map[name]) map[name] = new Contributor(name);
          map[name].addMatch({ ...new Match(stat), index: idx });
          return map;
        }, {})
      )
    );
  };

  const toggleContributor = (name) => {
    setActiveContributor((prev) => (prev === name ? null : name));
    setFilterLocation("");
    setFilterMonth("");
    setFilterYear("");
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      {/* ===== Content ===== */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <MenuButton menuOpen={menuOpen} toggleMenu={toggleMenu} />
        <Sidebar
          menuOpen={menuOpen}
          handleHomeClick={handleHomeClick}
          handleAddStatsClick={handleAddStatsClick}
          handleModifyStatsClick={handleModifyStatsClick}
          handleDisplayStatsClick={handleDisplayStatsClick}
          handlePlayerRatingsClick={handlePlayerRatingsClick}
          handleStatsSummaryClick={handleStatsSummaryClick}
          handleCalendarClick={handleCalendarClick}   // ← new
        />

        <div
          style={{
            paddingLeft: menuOpen ? "280px" : "70px",
            paddingTop: "80px",
            paddingRight: "20px",
            transition: "padding-left 0.4s ease",
            minHeight: "100vh",
            boxSizing: "border-box",
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {showSplash ? (
                    <FrontPage />
                  ) : (
                    <>
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
                      {activeView === "modify" && contributors.length > 0 && (
                        <ModifyDashboard
                          contributors={contributors}
                          onSave={handleModifyStatsClick}
                        />
                      )}
                      {activeView === "summary" && (
                        <StatsSummary stats={summaryData} />
                      )}
                      {activeView === "calendar" && (
                        <MatchCalendar stats={summaryData} />
                      )}
                    </>
                  )}
                </>
              }
            />
            <Route path="/edit/:index" element={<EditMatchPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;