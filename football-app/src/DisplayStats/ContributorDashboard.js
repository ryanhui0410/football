import React, { useState, useMemo } from "react";
import HeadToHeadCompare from "./HeadToHeadCompare";
import FifaMatchCard from "./FifaMatchCard";   // ← import

function ContributorDashboard({
  contributors,
  activeContributor,
  toggleContributor,
  filterLocation,
  setFilterLocation,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
}) {
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareData, setCompareData] = useState(null);

  const contributor = contributors.find(c => c.name === activeContributor);
  let filteredMatches = contributor ? contributor.getSortedMatches() : [];

  const getSeasonLabel = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (month >= 8) return `${year}-${year + 1}`;
    else return `${year - 1}-${year}`;
  };

  filteredMatches = filteredMatches.filter(m => {
    const dateObj = new Date(m.date);
    const matchYearMonth = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}`;
    const matchSeason = getSeasonLabel(m.date);
    const locationMatch = !filterLocation || m.location === filterLocation;
    const monthMatch = !filterMonth || matchYearMonth === filterMonth;
    const yearMatch = !filterYear || matchSeason === filterYear;
    return locationMatch && monthMatch && yearMatch;
  });

  filteredMatches.sort((a, b) => new Date(b.date) - new Date(a.date));

  const getSeasonOptions = () => {
    const currentContributor = contributors.find(c => c.name === activeContributor);
    if (!currentContributor) return [];
    const seasons = new Set(currentContributor.matches.map(m => getSeasonLabel(m.date)));
    return [...seasons].sort();
  };

  // Head‑to‑Head helpers
  const allMatchesMap = useMemo(() => {
    const map = {};
    contributors.forEach(contrib => {
      contrib.matches.forEach(m => {
        const key = `${m.date}|${m.location}|${m.time || ''}`;
        if (!map[key]) map[key] = [];
        map[key].push({ contributor: contrib.name, match: m });
      });
    });
    return map;
  }, [contributors]);

  const hasRival = (match) => {
    const key = `${match.date}|${match.location}|${match.time || ''}`;
    const entries = allMatchesMap[key] || [];
    return entries.some(entry => entry.contributor !== activeContributor);
  };

  const openComparison = (match) => {
    const key = `${match.date}|${match.location}|${match.time || ''}`;
    const entries = allMatchesMap[key] || [];
    const rivalEntry = entries.find(entry => entry.contributor !== activeContributor);
    if (rivalEntry) {
      setCompareData({
        contributor1: activeContributor,
        match1: match,
        contributor2: rivalEntry.contributor,
        match2: rivalEntry.match,
      });
      setCompareOpen(true);
    }
  };

  return (
    <div>
      {contributors.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h2>Contributors</h2>

          {/* Contributor buttons */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
            {contributors.map((c) => (
              <button
                key={c.name}
                onClick={() => toggleContributor(c.name)}
                style={{
                  padding: "8px 16px", borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: activeContributor === c.name ? "#d0f0c0" : "#f0f0f0",
                  cursor: "pointer", fontWeight: "bold",
                  transition: "background-color 0.2s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.backgroundColor = activeContributor === c.name ? "#b8e6a8" : "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.backgroundColor = activeContributor === c.name ? "#d0f0c0" : "#f0f0f0";
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {activeContributor && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              {/* Sidebar filters */}
              <div style={{ width: "200px", padding: "15px", borderRight: "1px solid #ccc", backgroundColor: "#f0f0f0" }}>
                <h3>Filters</h3>
                <label>
                  Location:
                  <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} style={{ width: "100%", marginBottom: "10px" }}>
                    <option value="">All</option>
                    {[...new Set(contributors.find(c => c.name === activeContributor)?.matches.map(m => m.location).filter(Boolean))].map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Year/Month:
                  <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ width: "100%", marginBottom: "10px" }}>
                    <option value="">All</option>
                    {[...new Set(contributors.find(c => c.name === activeContributor)?.matches.map(m => {
                      const d = new Date(m.date);
                      return `${d.getFullYear()}/${d.getMonth() + 1}`;
                    }))].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Season:
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ width: "100%" }}>
                    <option value="">All</option>
                    {getSeasonOptions().map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Match display */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <h3>{activeContributor} - Match History</h3>
                {filteredMatches.map((m, i) => (
                  <FifaMatchCard
                    key={i}
                    match={m}
                    showCompare={hasRival(m)}
                    onCompare={() => openComparison(m)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <HeadToHeadCompare
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        compareData={compareData}
      />
    </div>
  );
}

export default ContributorDashboard;