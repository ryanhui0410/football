import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import PlayerStatsForm from "./AddStats/PlayerStatsForm";
import StatsSummary from "./StatsSummary/StatsSummary";
import FrontPage from "./UI/FrontPage";
import ModifyDashboard from "./EditStats/ModifyDashboard";
import EditMatchPage from "./EditStats/EditMatchPage";
import PlayerRatings from "./PlayerRatings/PlayerRatings";
import Sidebar from "./UI/Sidebar";
import MenuButton from "./UI/MenuButton";
import BottomNav from "./UI/BottomNav";
import MatchCalendar from "./CalendarMatch/MatchCalendar";
import AddPlayerCard from "./PlayerCards/AddPlayerCard";
import TacticalDashboard from "./Tactical/TacticalDashboard";
import { readFromGitHub, writeToGitHub, formatStat, FILES } from "./githubAPI";

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
    'Assist to': assistTo,
    'Assist to count': assistToCount
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
    this.assistTo = assistTo || '';
    this.assistToCount = assistToCount || 0;
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showForm, setShowForm] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [formData, setFormData] = useState({
    Date: "", Contributor: "", Goal: "", Assist: "", Rating: "",
    Location: "", Time: "", Error: "", source: "",
    LeftFoot: "", RightFoot: "", Head: "", OtherBodyParts: "",
    MatchResult: "", WinLoss: "", AssistTo: "", ManOfTheMatch: false,
  });
  const [history, setHistory] = useState({ contributors: [], locations: [], times: [], sources: [] });
  const [contributors, setContributors] = useState([]);
  const [activeView, setActiveView] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✨ Detect mobile vs desktop
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    setLoading(true);
    try {
      const data = await readFromGitHub(FILES.stats);
      setSummaryData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
    setContributors([]);
    setShowForm(false);
    setActiveView("calendar");
    setMenuOpen(false);
    setLoading(false);
  };

  const handleTacticalClick = () => {
    setShowSplash(false);
    setContributors([]);
    setSummaryData([]);
    setShowForm(false);
    setActiveView("tactical");
    setMenuOpen(false);
  };

  const handlePlayerRatingsClick = () => {
    setShowSplash(false);
    setContributors([]);
    setSummaryData([]);
    setShowForm(false);
    setActiveView("ratings");
    setMenuOpen(false);
  };

  const handleAddStatsClick = async () => {
    setShowSplash(false);
    setLoading(true);
    try {
      const data = await readFromGitHub(FILES.stats);
      const stats = Array.isArray(data) ? data : [];
      setHistory({
        contributors: [...new Set(stats.map(d => d.Contributor).filter(Boolean))],
        locations: [...new Set(stats.map(d => d.Location).filter(Boolean))],
        times: [...new Set(stats.map(d => d.Time).filter(Boolean))],
        sources: [...new Set(stats.map(d => d.source).filter(Boolean))],
      });
    } catch (e) {
      console.error("Failed to load history:", e);
    }
    setContributors([]);
    setSummaryData([]);
    setShowForm(true);
    setActiveView("add");
    setMenuOpen(false);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newStat = formatStat({
        ...formData,
        "Left Foot": formData.LeftFoot || 0,
        "Right Foot": formData.RightFoot || 0,
        Head: formData.Head || 0,
        "Other body parts": formData.OtherBodyParts || 0,
        Assist: formData.Assist || 0,
        Rating: formData.Rating || 0,
        Goal: formData.Goal || 0,
        "Own Goal": formData.OwnGoal || 0,
        Error: formData.Error || 0,
      });

      const stats = await readFromGitHub(FILES.stats);
      const arr = Array.isArray(stats) ? stats : [];
      arr.push(newStat);
      await writeToGitHub(FILES.stats, arr, `Add stats for ${newStat.Contributor}`);
      alert("✅ Stat saved successfully!");
      setShowForm(false);
    } catch (err) {
      alert(`❌ Failed to save: ${err.message}`);
    }
    setLoading(false);
  };

  const handleAddPlayerCardClick = () => {
    setShowSplash(false);
    setContributors([]);
    setSummaryData([]);
    setShowForm(false);
    setActiveView("addPlayerCard");
    setMenuOpen(false);
  };

  const handleDisplayStatsClick = async () => {
    setShowSplash(false);
    setLoading(true);
    try {
      const data = await readFromGitHub(FILES.stats);
      const stats = Array.isArray(data) ? data : [];
      const contributorMap = {};
      stats.forEach((stat) => {
        const name = stat.Contributor?.trim();
        if (!name) return;
        if (!contributorMap[name]) contributorMap[name] = new Contributor(name);
        contributorMap[name].addMatch(new Match(stat));
      });
      setContributors(Object.values(contributorMap));
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
    setSummaryData([]);
    setShowForm(false);
    setActiveView("display");
    setMenuOpen(false);
    setLoading(false);
  };

  const handleStatsSummaryClick = async () => {
    setShowSplash(false);
    setLoading(true);
    try {
      const data = await readFromGitHub(FILES.stats);
      setSummaryData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
    setContributors([]);
    setShowForm(false);
    setActiveView("summary");
    setMenuOpen(false);
    setLoading(false);
  };

  const handleModifyStatsClick = async () => {
    setShowSplash(false);
    setLoading(true);
    try {
      const data = await readFromGitHub(FILES.stats);
      const stats = Array.isArray(data) ? data : [];
      setSummaryData([]);
      setShowForm(false);
      setActiveView("modify");
      setContributors(
        Object.values(
          stats.reduce((map, stat, idx) => {
            const name = stat.Contributor?.trim();
            if (!name) return map;
            if (!map[name]) map[name] = new Contributor(name);
            map[name].addMatch({ ...new Match(stat), index: idx });
            return map;
          }, {})
        )
      );
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
    setMenuOpen(false);
    setLoading(false);
  };

  const currentView = showSplash ? "home" : activeView;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* 🖥️ DESKTOP ONLY: Hamburger + Sidebar */}
      {!isMobile && (
        <>
          <MenuButton menuOpen={menuOpen} toggleMenu={toggleMenu} />
          <Sidebar
            menuOpen={menuOpen}
            handleHomeClick={handleHomeClick}
            handleAddStatsClick={handleAddStatsClick}
            handleModifyStatsClick={handleModifyStatsClick}
            handleDisplayStatsClick={handleDisplayStatsClick}
            handlePlayerRatingsClick={handlePlayerRatingsClick}
            handleStatsSummaryClick={handleStatsSummaryClick}
            handleCalendarClick={handleCalendarClick}
            handleAddPlayerCardClick={handleAddPlayerCardClick}
            handleTacticalClick={handleTacticalClick}
          />
        </>
      )}

      {/* 📱 MOBILE ONLY: Bottom Navigation Bar */}
      {isMobile && (
        <BottomNav
          activeView={currentView}
          onNavigate={{
            home: handleHomeClick,
            add: handleAddStatsClick,
            modify: handleModifyStatsClick,
            display: handleDisplayStatsClick,
            summary: handleStatsSummaryClick,
            calendar: handleCalendarClick,
            ratings: handlePlayerRatingsClick,
            cards: handleAddPlayerCardClick,
            tactical: handleTacticalClick,
          }}
        />
      )}

      {/* ✨ Loading indicator */}
      {loading && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          background: "rgba(15,23,42,0.9)", color: "#fff", padding: "20px 30px",
          borderRadius: "12px", zIndex: 9999, fontSize: "16px", fontWeight: 600,
        }}>
          ⏳ Loading data from GitHub...
        </div>
      )}

      {/* ✨ Content container */}
      <div className={`app-content ${!isMobile && menuOpen ? "menu-open" : ""}`}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                {showSplash ? (
                  <FrontPage
                    onNavigate={(view) => {
                      if (view === 'display') handleStatsSummaryClick();
                      if (view === 'calendar') handleCalendarClick();
                    }}
                  />
                ) : (
                  <>
                    {activeView === "add" && showForm && (
                      <PlayerStatsForm
                        formData={formData}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        onCancel={() => { setShowForm(false); setActiveView(null); }}
                        history={history}
                      />
                    )}
                    {activeView === "ratings" && <PlayerRatings />}
                    {activeView === "modify" && contributors.length > 0 && (
                      <ModifyDashboard contributors={contributors} onSave={handleModifyStatsClick} />
                    )}
                    {activeView === "summary" && <StatsSummary stats={summaryData} />}
                    {activeView === "calendar" && <MatchCalendar stats={summaryData} />}
                    {activeView === "addPlayerCard" && <AddPlayerCard />}
                    {activeView === "tactical" && <TacticalDashboard />}
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