import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import PlayerStatsForm from "./PlayerStatsForm";
import ContributorDashboard from "./ContributorDashboard";
import StatsSummary from "./StatsSummary";
import FrontPage from "./FrontPage";
import ModifyDashboard from "./ModifyDashboard";
import EditMatchPage from "./EditMatchPage";
import PlayerRatings from "./PlayerRatings";
import Sidebar from "./Sidebar";
import MenuButton from "./MenuButton";

class PlayerStats {
  constructor(fields) {
    Object.assign(this, fields);
  }
}

class Match {
  constructor({ 
    Date, 
    Symbol, 
    Rating, 
    Location,
    // 新增字段
    'Left Foot': leftFoot,      // 注意 JSON 中的字段名带空格
    'Right Foot': rightFoot,
    'Head': head,
    'Other body parts': other,
    'Assist': assist,
    'Goal Contribution': goalContribution,
    'source': source,
    'Time': time,
    // 如果还有其它字段（如 Contributor、Goal 等），也可一并加上
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
    this.source = source || '';
    this.time = time || '';
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
    <div>
      <MenuButton menuOpen={menuOpen} toggleMenu={toggleMenu} />
      <Sidebar
        menuOpen={menuOpen}
        handleHomeClick={handleHomeClick}
        handleAddStatsClick={handleAddStatsClick}
        handleModifyStatsClick={handleModifyStatsClick}
        handleDisplayStatsClick={handleDisplayStatsClick}
        handlePlayerRatingsClick={handlePlayerRatingsClick}
        handleStatsSummaryClick={handleStatsSummaryClick}
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
                    {activeView === "display" && contributors.length > 0 && (
                      <ContributorDashboard
                        contributors={contributors}
                        activeContributor={activeContributor}
                        toggleContributor={toggleContributor}
                        filterLocation={filterLocation}
                        setFilterLocation={setFilterLocation}
                        filterMonth={filterMonth}
                        setFilterMonth={setFilterMonth}
                        filterYear={filterYear}          // ← new
                        setFilterYear={setFilterYear}    // ← new
                      />
                    )}
                    {activeView === "modify" && contributors.length > 0 && (
                      <ModifyDashboard
                        contributors={contributors}
                        onSave={handleModifyStatsClick}
                      />
                    )}
                    {activeView === "summary" && (
                      <StatsSummary stats={summaryData} />
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
  );
}

export default App;