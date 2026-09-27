import React, { useState, useEffect, useMemo } from "react";
import EditMatchModal from "./EditMatchModal";
import HeadToHeadCompare from "./HeadToHeadCompare";
import MatchStatsModal from "./MatchStatsModal";
import "./ModifyDashboard.css";
import MatchLineup from "./MatchLineup";

function ModifyDashboard({ contributors, onSave }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [compareMenu, setCompareMenu] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);
  const [choiceMatch, setChoiceMatch] = useState(null);
  const [matchReport, setMatchReport] = useState(null);
  const [matchStatsData, setMatchStatsData] = useState([]);
  const [allLineups, setAllLineups] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [slotToEdit, setSlotToEdit] = useState(null);
  const [editedLineup, setEditedLineup] = useState(null);
  const [lineupVersion, setLineupVersion] = useState(0);
  const [reportPerspective, setReportPerspective] = useState("");

  const contributorNames = ["All", ...contributors.map(c => c.name)];
  const filteredContributors = activeFilter === "All" ? contributors : contributors.filter(c => c.name === activeFilter);

  const openModal = (match, contributorName) => setSelectedMatch({ ...match, contributorName });

  // ═══════════════ DATA FETCH (both sources, on mount) ═══════════════
  useEffect(() => {
    Promise.all([
      fetch(`https://football-stats-xbx6.onrender.com/match-lineups?t=${Date.now()}`).then(r => r.json()),
      fetch(`https://football-stats-xbx6.onrender.com/stats?t=${Date.now()}`).then(r => r.json()),
    ])
      .then(([lineups, stats]) => {
        setAllLineups(Array.isArray(lineups) ? lineups : []);
        setMatchStatsData(Array.isArray(stats) ? stats : []);
      })
      .catch(err => console.error("Failed to fetch lineups/stats:", err));
  }, []);

  // ═══════════════ HELPERS ═══════════════

  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.length === 10 && dateStr.includes("-")) return dateStr;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    return dateStr;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parts[2], parts[0] - 1, parts[1]);
    return new Date(dateStr);
  };

  const getRatingColor = (rating) => {
    const r = parseFloat(rating);
    if (isNaN(r)) return '#9e9e9e';
    if (r >= 9.0) return '#2563eb';
    if (r >= 7.0) return '#16a34a';
    if (r >= 5.0) return '#ea580c';
    return '#dc2626';
  };

  const getRatingBgColor = (rating) => {
    const r = parseFloat(rating);
    if (isNaN(r)) return '#e2e8f0';
    if (r > 9) return '#3b82f6';
    if (r >= 7) return '#22c55e';
    if (r >= 5) return '#eab308';
    return '#ef4444';
  };

  // ✨ FotMob-style row helpers
  const getWinLossLetter = (winLoss) => {
    const w = (winLoss || "").trim().toLowerCase();
    if (w === "win" || w === "w") return "W";
    if (w === "loss" || w === "lose" || w === "l") return "L";
    if (w === "draw" || w === "d") return "D";
    return "";
  };

  const getFmRatingClass = (rating, isMotm) => {
    if (isMotm) return "motm";
    const r = parseFloat(rating);
    if (!isNaN(r) && r >= 7) return "good";
    return "";
  };

  const splitSymbols = (symbolStr) => {
    if (!symbolStr) return [];
    const chars = [...symbolStr];
    const rows = [];
    const chunkSize = 5;
    for (let i = 0; i < chars.length; i += chunkSize) {
      rows.push(chars.slice(i, i + chunkSize));
    }
    return rows;
  };

  // ═══════════════ LINEUP-FIRST RESOLVER ═══════════════

  const findLineupMatch = (match) => {
    const normDate = normalizeDate(match.date);
    return allLineups.find(l =>
      normalizeDate(l.date) === normDate &&
      (l.location || "").trim() === (match.location || "").trim() &&
      (l.time || "").trim() === (match.time || "").trim()
    ) || null;
  };

  const findLineupPlayer = (lineup, contributorName) => {
    if (!lineup || !contributorName) return null;
    const teams = [lineup.teamA, lineup.teamB].filter(Boolean);
    for (const team of teams) {
      const players = [
        ...(Array.isArray(team.players) ? team.players : Object.values(team.players || {})),
        ...(Array.isArray(team.subs) ? team.subs : []),
      ];
      const me = players.find(
        p => p && p.Contributor &&
        p.Contributor.trim().toLowerCase() === contributorName.trim().toLowerCase()
      );
      if (me) return me;
    }
    return null;
  };

  const getPlayerMatchStats = (playerName, matchDate, matchLocation, matchTime) => {
    if (!playerName || !matchStatsData.length) return null;
    const normDate = normalizeDate(matchDate);
    return matchStatsData.find(s =>
      (s.Contributor || "").trim().toLowerCase() === playerName.trim().toLowerCase() &&
      normalizeDate(s.Date) === normDate &&
      (s.Location || "").trim().toLowerCase() === (matchLocation || "").trim().toLowerCase() &&
      (s.Time || "").trim().toLowerCase() === (matchTime || "").trim().toLowerCase()
    ) || null;
  };

  // ✨ THE MERGE: match_lineups.json is PRIMARY, football_stats JSON fills the gaps
const buildResolvedMatch = (match, contributorName) => {
  const lineup = findLineupMatch(match);
  const lp = findLineupPlayer(lineup, contributorName);
  const stat = getPlayerMatchStats(contributorName, match.date, match.location, match.time);

  // ✨ Lineup stat fields (camelCase in match_lineups.json)
  const lpGoal = parseInt(lp?.goal) || 0;
  const lpAssist = parseInt(lp?.assist) || 0;
  const lpLeft = parseInt(lp?.leftFoot) || 0;
  const lpRight = parseInt(lp?.rightFoot) || 0;
  const lpHead = parseInt(lp?.head) || 0;
  const lpOther = parseInt(lp?.other) || 0;
  const lpError = parseInt(lp?.error) || 0;
  const lpMotm = lp?.manOfTheMatch === true;

  // Stats JSON fields (Title Case)
  const stGoal = stat ? (parseFloat(stat.Goal) || 0) : 0;
  const stAssist = stat ? (parseFloat(stat.Assist) || 0) : 0;
  const stLeft = stat ? (parseFloat(stat["Left Foot"]) || 0) : 0;
  const stRight = stat ? (parseFloat(stat["Right Foot"]) || 0) : 0;
  const stHead = stat ? (parseFloat(stat.Head) || 0) : 0;
  const stOther = stat ? (parseFloat(stat["Other body parts"]) || 0) : 0;
  const stError = stat ? (parseInt(stat.Error) || 0) : 0;
  const stMotm = stat?.["Man of the Match"] === true;

  // ✨ Lineup wins when present; stats fill in for legacy matches
  const hasLpStats = lp && (
    lpGoal || lpAssist || lpLeft || lpRight || lpHead || lpOther || lpError || lpMotm
  );

  const goal = hasLpStats ? lpGoal : stGoal;
  const assist = hasLpStats ? lpAssist : stAssist;
  const leftFoot = hasLpStats ? lpLeft : stLeft;
  const rightFoot = hasLpStats ? lpRight : stRight;
  const head = hasLpStats ? lpHead : stHead;
  const other = hasLpStats ? lpOther : stOther;
  const error = hasLpStats ? lpError : stError;
  const manOfTheMatch = hasLpStats ? lpMotm : stMotm;

  // ✨ Derive symbol + goal contribution from the resolved values
  const goalContribution = goal + assist;
  const symbol = "⚽".repeat(goal) + "👟".repeat(assist);

  // ✨ Assist-to pair rule: Ryan ↔ Darren
  const cLower = (contributorName || "").trim().toLowerCase();
  const assistRecipient =
    cLower === "ryan" ? "Darren" :
    cLower === "darren" ? "Ryan" : "";
  // If lineup carries an explicit assistTo use it; otherwise for the pair, all assists go to the partner
  const assistTo =
    assist > 0 && assistRecipient
      ? (lp?.assistTo || stat?.["Assist to"] || assistRecipient)
      : "";
  const assistToCount =
    assist > 0 && assistTo
      ? (lp?.assistToCount ?? (stat ? (parseFloat(stat["Assist to count"]) || 0) : (assistRecipient === assistTo ? assist : 0)))
      : 0;

  return {
    // identity
    date: match.date,
    location: match.location,
    time: match.time,
    contributorName,

    // LINEUP FIRST — rating & participation
    rating: lp?.rating ?? (stat ? parseFloat(stat.Rating) : ""),
    picture: lp?.picture || "",

    // ✨ RESOLVED stats (lineup first, stats fallback)
    goalContribution,
    assist,
    goal,
    symbol,
    leftFoot,
    rightFoot,
    head,
    other,
    error,
    manOfTheMatch,
    matchResult: stat?.["Match result"] || "",   // result only exists in stats JSON
    winLoss: stat?.["Win/Loss?"] || "",
    season: stat?.Season || "",
    source: stat?.source || (lineup ? "Lineup only" : ""),
    assistTo,
    assistToCount,

    // flags
    hasStats: !!stat,
    hasLineup: !!lineup,
  };
};

  // ═══════════════ BUTTON HANDLERS (use pre-fetched data) ═══════════════

  const openStatsModal = (match, contributorName) => {
    // ✨ Resolves from lineup first, stats as fallback
    const resolved = buildResolvedMatch(match, contributorName);
    setSelectedStats(resolved);
    setStatsModalOpen(true);
  };

  const fetchAndOpenReport = (isEditMode = false) => {
    // ✨ Uses pre-fetched allLineups — no refetch needed
    const found = findLineupMatch(choiceMatch.match);

    if (!found) {
      alert("No tactical report found.");
      return;
    }

    setMatchReport(found);
    setEditedLineup(JSON.parse(JSON.stringify(found)));
    setIsEditingReport(isEditMode);
    setReportPerspective(choiceMatch.name);
    setLineupVersion(v => v + 1);

    if (isEditMode) {
      fetch(`https://football-stats-xbx6.onrender.com/player-attributes?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => setAvailablePlayers(Array.isArray(data) ? data : []));
    }
  };

  // ═══════════════ LINEUP-ONLY MATCH MERGE ═══════════════
  // Matches created in Tactical Dashboard (no stats records yet) appear with a badge

  const displayContributors = useMemo(() => {
    return filteredContributors.map(contributor => {
      const existingKeys = new Set(
        contributor.matches.map(m =>
          `${normalizeDate(m.date)}|${(m.location || "").trim()}|${(m.time || "").trim()}`
        )
      );

      const lineupOnlyMatches = [];

      allLineups.forEach(lineup => {
        const key = `${normalizeDate(lineup.date)}|${(lineup.location || "").trim()}|${(lineup.time || "").trim()}`;
        if (existingKeys.has(key)) return; // stats record exists — already shown

        const me = findLineupPlayer(lineup, contributor.name);
        if (me) {
          lineupOnlyMatches.push({
            date: lineup.date,
            location: lineup.location,
            time: lineup.time,
            rating: me.rating ?? "",
            matchResult: "",
            winLoss: "",
            goalContribution: (parseInt(me.goal) || 0) + (parseInt(me.assist) || 0),
            assist: parseInt(me.assist) || 0,
            symbol: "⚽".repeat(parseInt(me.goal) || 0) + "👟".repeat(parseInt(me.assist) || 0),
            manOfTheMatch: me.manOfTheMatch === true,
            isLineupOnly: true,
          });
        }
      });

      if (lineupOnlyMatches.length === 0) return contributor;
      return { ...contributor, matches: [...contributor.matches, ...lineupOnlyMatches] };
    });
  }, [filteredContributors, allLineups]);

  // ═══════════════ COMPARE / REPORT OVERLAY LOGIC ═══════════════

  const getSameMatchPlayers = (currentMatch, currentContributorName) => {
    const players = [];
    contributors.forEach(contrib => {
      if (contrib.name !== currentContributorName) {
        const matchingMatch = contrib.matches.find(m =>
          m.date === currentMatch.date && m.location === currentMatch.location && m.time === currentMatch.time
        );
        if (matchingMatch) players.push({ name: contrib.name, match: matchingMatch });
      }
    });
    return players;
  };

  const handleCompareClick = (e, currentMatch, currentContributorName) => {
    e.stopPropagation();
    const players = getSameMatchPlayers(currentMatch, currentContributorName);
    if (players.length === 1) {
      setCompareData({
        contributor1: currentContributorName, match1: currentMatch,
        contributor2: players[0].name, match2: players[0].match
      });
    } else if (players.length > 1) {
      setCompareMenu({ match: currentMatch, contributorName: currentContributorName, players });
    } else {
      alert("No other contributors found for this exact match.");
    }
  };

  const selectCompareTarget = (target) => {
    setCompareData({
      contributor1: compareMenu.contributorName, match1: compareMenu.match,
      contributor2: target.name, match2: target.match
    });
    setCompareMenu(null);
  };

  const enrichLineupWithMotm = (lineup) => {
  if (!lineup) return lineup;
  const enriched = JSON.parse(JSON.stringify(lineup));
  ['teamA', 'teamB'].forEach(team => {
    ['players', 'subs'].forEach(key => {
      if (Array.isArray(enriched[team]?.[key])) {
        enriched[team][key] = enriched[team][key].map(player => {
          if (!player) return null;
          const stat = getPlayerMatchStats(player.Contributor, enriched.date, enriched.location, enriched.time);
          return {
            ...player,
            // ✅ Stats record wins when present; otherwise fall back to the lineup's own fields
            isMotm: stat
              ? stat["Man of the Match"] === true
              : player.manOfTheMatch === true || player.isMotm === true,
            goals: stat
              ? (parseInt(stat.Goal) || 0)
              : (parseInt(player.goal) || 0),
            assists: stat
              ? (parseInt(stat.Assist) || 0)
              : (parseInt(player.assist) || 0),
          };
        });
      }
    });
  });
  return enriched;
};

  const calcTeamAverage = (teamObj) => {
    if (!teamObj) return null;
    const playersArr = Array.isArray(teamObj.players)
      ? teamObj.players
      : Object.values(teamObj.players || {});
    const subsArr = Array.isArray(teamObj.subs)
      ? teamObj.subs
      : Object.values(teamObj.subs || {});
    const allPlayers = [...playersArr, ...subsArr];
    const ratings = allPlayers
      .filter(p => p && p.rating != null)
      .map(p => parseFloat(p.rating))
      .filter(r => !isNaN(r));
    if (ratings.length === 0) return null;
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
  };

  const handleSaveReportLineup = async () => {
    if (!editedLineup) return;

    const sanitizeTeam = (teamObj) => {
      if (!teamObj) return { formation: "4-4-2", players: Array(11).fill(null), subs: [null, null] };
      const cleanPlayer = (p) => {
        if (!p) return null;
        return {
          ...p,                                  // ✅ preserves goal/assist/leftFoot/... etc.
          rating: parseFloat(p.rating) || 0,
          picture: p.picture || `/${p.Contributor}.jpeg`
        };
      };

      const cleanPlayers = (teamObj.players || []).map(cleanPlayer);
      const cleanSubs = (teamObj.subs || []).map(cleanPlayer);
      while (cleanSubs.length < 2) cleanSubs.push(null);

      return {
        formation: teamObj.formation || "4-4-2",
        players: cleanPlayers.slice(0, 11),
        subs: cleanSubs.slice(0, 2)
      };
    };

    const payload = {
      date: editedLineup.date,
      location: editedLineup.location,
      time: editedLineup.time,
      teamA: sanitizeTeam(editedLineup.teamA),
      teamB: sanitizeTeam(editedLineup.teamB),
    };

    try {
      const res = await fetch(`https://football-stats-xbx6.onrender.com/match-lineups?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        alert(`⚠️ Saved locally, but GitHub failed: ${result.githubError || result.error}`);
        return;
      }
      alert("✅ Match Report saved!");

      setIsEditingReport(false);
      setMatchReport(JSON.parse(JSON.stringify({ ...editedLineup, teamA: payload.teamA, teamB: payload.teamB })));
      setLineupVersion(v => v + 1);
      // ✨ Keep the in-memory lineup copy in sync so subsequent opens are fresh
      setAllLineups(prev => {
        const idx = prev.findIndex(l =>
          normalizeDate(l.date) === normalizeDate(payload.date) &&
          (l.location || "").trim() === (payload.location || "").trim() &&
          (l.time || "").trim() === (payload.time || "").trim()
        );
        if (idx === -1) return [...prev, JSON.parse(JSON.stringify({ ...editedLineup, teamA: payload.teamA, teamB: payload.teamB }))];
        const next = [...prev];
        next[idx] = JSON.parse(JSON.stringify({ ...editedLineup, teamA: payload.teamA, teamB: payload.teamB }));
        return next;
      });
    } catch (err) {
      console.error("Save failed:", err);
      alert("❌ Failed to save match report");
    }
  };

  const closeModal = () => setSelectedMatch(null);
  const closeCompare = () => setCompareData(null);

  useEffect(() => {
    const handleClickOutside = () => setCompareMenu(null);
    if (compareMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [compareMenu]);

  const getLayoutType = () => {
    const isMobileWidth = window.innerWidth <= 850;
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isMobileWidth && isPortrait) return "vertical";
    return "horizontal";
  };

  const [layout, setLayout] = useState(getLayoutType());

  useEffect(() => {
    const handleResize = () => setLayout(getLayoutType());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div className="md-wrap">
      <div className="md-filter-bar">
        <span className="md-filter-label">Filter by Player:</span>
        <div className="md-filter-pills">
          {contributorNames.map(name => (
            <button key={name} className={`md-pill ${activeFilter === name ? 'active' : ''}`} onClick={() => setActiveFilter(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {displayContributors.map((contributor) => {
        const sortedMatches = [...contributor.matches].sort((a, b) => parseDate(b.date) - parseDate(a.date));
        return (
          <div key={contributor.name} className="md-contributor-section">
            <div className="md-contributor-header">
              <h2 className="md-contributor-name">{contributor.name}</h2>
              <span className="md-match-count">{sortedMatches.length} Matches</span>
            </div>

            {/* ===== DESKTOP/PORTRAIT: original table ===== */}
            <table className="md-table">
              <thead className="md-thead">
                <tr>
                  <th className="md-th md-th-date">Date & Location</th>
                  <th className="md-th md-th-result center">Match Result</th>
                  <th className="md-th md-th-contrib center">Contributions</th>
                  <th className="md-th md-th-rating center">Rating</th>
                  <th className="md-th md-th-action center">Action</th>
                </tr>
              </thead>
              <tbody className="md-tbody">
                {sortedMatches.map((match, idx) => {
                  const sameMatchPlayers = getSameMatchPlayers(match, contributor.name);
                  return (
                    <tr key={idx} className="md-row" onClick={() => setChoiceMatch({ match: match, name: contributor.name })}>
                      <td className="md-td" data-label="Date & Location">
                        <div className="md-date">
                          {match.date}
                        </div>
                        <div className="md-location">📍 {match.location || "Unknown"}</div>
                      </td>
                      <td className="md-td center" data-label="Match Result">
                        <div className={`md-result-box ${match.winLoss ? match.winLoss.toLowerCase() : ''}`}>
                          <div className="md-score">{match.matchResult || "—"}</div>
                          {match.winLoss && <div className={`md-outcome ${match.winLoss.toLowerCase()}`}>{match.winLoss}</div>}
                        </div>
                      </td>
                      <td className="md-td center" data-label="Contributions">
                        {match.symbol ? (
                          <div className="md-symbols-wrapper">
                            {splitSymbols(match.symbol).map((row, rowIdx) => (
                              <div key={rowIdx} className="md-symbols-row">
                                {row.map((ch, idx) => (
                                  <span key={idx} className="md-symbol-icon">{ch}</span>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="md-symbols empty">No symbols</span>
                        )}
                      </td>
                      <td className="md-td center" data-label="Rating">
                        {match.manOfTheMatch ? (
                          <span className="md-rating-motm-wrapper">
                            <span
                              className="md-rating md-rating-motm"
                              style={{ backgroundColor: getRatingBgColor(match.rating) }}
                            >
                              {match.rating || "—"}
                            </span>
                          </span>
                        ) : (
                          <span
                            className="md-rating"
                            style={{ backgroundColor: getRatingBgColor(match.rating) }}
                          >
                            {match.rating || "—"}
                          </span>
                        )}
                      </td>
                      <td className="md-td center" data-label="Action">
                        <div className="md-action-btns">
                          <button className="md-edit-btn" onClick={(e) => { e.stopPropagation(); openModal(match, contributor.name); }}>Edit</button>
                          {sameMatchPlayers.length > 0 && (
                            <button className="md-compare-btn" title="Compare" onClick={(e) => handleCompareClick(e, match, contributor.name)}>⚔️</button>
                          )}
                          {compareMenu && compareMenu.match === match && compareMenu.contributorName === contributor.name && (
                            <div className="md-compare-dropdown" onClick={(e) => e.stopPropagation()}>
                              {compareMenu.players.map((p, pIdx) => (
                                <div key={pIdx} className="md-compare-option" onClick={(e) => { e.stopPropagation(); selectCompareTarget(p); }}>vs {p.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ===== MOBILE (portrait + landscape): FotMob-style list ===== */}
            <div className="fm-list">
              {sortedMatches.map((match, idx) => {
                const goals = Math.max(0, (match.goalContribution || 0) - (match.assist || 0));
                const assists = match.assist || 0;
                const wlLetter = getWinLossLetter(match.winLoss);
                const sameMatchPlayers = getSameMatchPlayers(match, contributor.name);
                const isMotm = !!match.manOfTheMatch;
                return (
                  <div
                    key={`fm-${idx}`}
                    className="fm-row"
                    onClick={() => setChoiceMatch({ match: match, name: contributor.name })}
                  >
                    <div className="fm-row-top">
                      <span className="fm-date">{match.date}</span>
                      <span className="fm-location">📍 {match.location || "Unknown"}</span>
                    </div>

                    <div className="fm-row-main">
                      <div className="fm-left">
                        {wlLetter && (
                          <span className={`fm-wl fm-wl-${wlLetter.toLowerCase()}`}>{wlLetter}</span>
                        )}
                        <span className="fm-score">{match.matchResult || "—"}</span>
                      </div>
                      <div className="fm-right">
                        {goals > 0 && (
                          <span className="fm-icons fm-goals" title={`${goals} goal(s)`}>
                            {[...Array(goals)].map((_, i) => (
                              <span key={`g-${i}`} className="fm-icon">⚽</span>
                            ))}
                          </span>
                        )}
                        {assists > 0 && (
                          <span className="fm-icons fm-assists" title={`${assists} assist(s)`}>
                            {[...Array(assists)].map((_, i) => (
                              <span key={`a-${i}`} className="fm-icon">👟</span>
                            ))}
                          </span>
                        )}
                        {goals === 0 && assists === 0 && <span className="fm-ga fm-none">—</span>}

                        <div className="fm-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="fm-action-btn"
                            title="Edit"
                            onClick={(e) => { e.stopPropagation(); openModal(match, contributor.name); }}
                          >
                            ✏️
                          </button>
                          {sameMatchPlayers.length > 0 && (
                            <button
                              className="fm-action-btn"
                              title="Compare"
                              onClick={(e) => handleCompareClick(e, match, contributor.name)}
                            >
                              ⚔️
                            </button>
                          )}
                          {compareMenu && compareMenu.match === match && compareMenu.contributorName === contributor.name && (
                            <div className="md-compare-dropdown fm-compare-dropdown" onClick={(e) => e.stopPropagation()}>
                              {compareMenu.players.map((p, pIdx) => (
                                <div key={pIdx} className="md-compare-option" onClick={(e) => { e.stopPropagation(); selectCompareTarget(p); }}>
                                  vs {p.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <span className={`fm-rating-box ${getFmRatingClass(match.rating, isMotm)}`}>
                          {match.rating || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedMatch && <EditMatchModal match={selectedMatch} onClose={closeModal} onSave={onSave} />}
      <HeadToHeadCompare open={!!compareData} onClose={closeCompare} compareData={compareData} />
      <MatchStatsModal open={statsModalOpen} match={selectedStats} onClose={() => setStatsModalOpen(false)} />

      {/* CHOICE MODAL */}
      {choiceMatch && !matchReport && (
        <div className="choice-overlay" onClick={() => setChoiceMatch(null)}>
          <div className="choice-modal" onClick={e => e.stopPropagation()}>
            <button className="choice-close" onClick={() => setChoiceMatch(null)}>✕</button>
            <h3>Match on {choiceMatch.match.date}</h3>
            <p className="choice-subtitle">What would you like to view for <strong>{choiceMatch.name}</strong>?</p>
            <div className="choice-buttons">
              <button className="choice-btn stats" onClick={() => { openStatsModal(choiceMatch.match, choiceMatch.name); setChoiceMatch(null); }}>
                📊 <span>View Individual Stats</span>
              </button>
              <button className="choice-btn report" onClick={() => fetchAndOpenReport(false)}>
                ⚽ <span>View Match Report</span>
              </button>
              <button className="choice-btn edit-report" onClick={() => fetchAndOpenReport(true)}>
                ✏️ <span>Edit Match Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MATCH REPORT OVERLAY (Read-only / Edit) */}
      {matchReport && (
        <div className="report-overlay" onClick={() => { setMatchReport(null); }}>
          <div className="report-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '25px' }}>
            <button className="report-close" onClick={() => { setMatchReport(null); }}>✕</button>
            <h2 className="report-title">⚽ Match Report: {matchReport.date}</h2>
            {matchReport.location && <p className="report-meta">📍 {matchReport.location} {matchReport.time && `• 🕒 ${matchReport.time}`}</p>}

            {(() => {
              const avgA = calcTeamAverage(matchReport.teamA);
              const avgB = calcTeamAverage(matchReport.teamB);

              let matchResult = '', winLoss = '';

              const perspectiveStat = getPlayerMatchStats(reportPerspective, matchReport.date, matchReport.location, matchReport.time);
              if (perspectiveStat && perspectiveStat["Match result"]) {
                matchResult = perspectiveStat["Match result"];
                winLoss = perspectiveStat["Win/Loss?"] || '';
              } else {
                const playersA = Array.isArray(matchReport.teamA?.players) ? matchReport.teamA.players : Object.values(matchReport.teamA?.players || {});
                const playersB = Array.isArray(matchReport.teamB?.players) ? matchReport.teamB.players : Object.values(matchReport.teamB?.players || {});
                const allPlayers = [...playersA, ...playersB].filter(p => p != null);

                for (const p of allPlayers) {
                  const stat = getPlayerMatchStats(p.Contributor, matchReport.date, matchReport.location, matchReport.time);
                  if (stat && stat["Match result"]) {
                    matchResult = stat["Match result"];
                    winLoss = stat["Win/Loss?"] || '';
                    break;
                  }
                }
              }

              return (
                <>
                  <div className="report-result-header" style={{ justifyContent: 'center', border: 'none', background: 'transparent', padding: '10px 0', marginBottom: '10px' }}>
                    <div className="result-score-center">
                      <span className="result-score">{matchResult || '—'}</span>
                      {winLoss && <span className={`result-wl ${winLoss.toLowerCase()}`}>{winLoss}</span>}
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#444' }}>
                      {isEditingReport ? "✏️ Edit Tactical Lineup" : "Tactical Lineup"}
                    </h3>

                    <div style={{ position: 'relative' }}>
                      <MatchLineup
                        key={`lineup-${isEditingReport ? 'edit' : 'view'}-${lineupVersion}`}
                        matchData={{ Date: matchReport.date, Location: matchReport.location, Time: matchReport.time }}
                        initialLineup={enrichLineupWithMotm(isEditingReport ? editedLineup : matchReport)}
                        readOnly={!isEditingReport}
                        editMode={isEditingReport}
                        layout={layout}
                        availablePlayers={availablePlayers}
                        getRatingColor={getRatingColor}
                        getPlayerMatchStats={getPlayerMatchStats}
                        onLineupChange={(newLineup) => {
                          setEditedLineup(prev => ({ ...prev, ...newLineup }));
                        }}
                        onSlotClick={(team, idx, player) => {
                          setSlotToEdit({ team, idx, player });
                        }}
                      />
                    </div>

                    {isEditingReport && (
                      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { setIsEditingReport(false); setEditedLineup(null); setLineupVersion(v => v + 1); }}
                          style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveReportLineup}
                          style={{
                            padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none',
                            borderRadius: '6px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                          }}
                        >
                          💾 Save Lineup
                        </button>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* SLOT EDIT MODAL */}
            {slotToEdit && (
              <div className="slot-edit-overlay" onClick={() => setSlotToEdit(null)}>
                <div className="slot-edit-modal" onClick={e => e.stopPropagation()}>
                  <button className="slot-edit-close" onClick={() => setSlotToEdit(null)}>✕</button>
                  <h3>{slotToEdit.player ? "Edit Player" : "Add Player"}</h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>Select Player:</label>
                    <select
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                      value={slotToEdit.player?.Contributor || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setSlotToEdit(prev => ({ ...prev, player: null }));
                        } else {
                          const selected = availablePlayers.find(p => p.Contributor === val);
                          setSlotToEdit(prev => ({
                            ...prev,
                            player: {
                              Contributor: selected.Contributor,
                              picture: selected.picture || `/${selected.Contributor}.jpeg`,
                              rating: prev.player?.rating !== undefined ? prev.player.rating : ""
                            }
                          }));
                        }
                      }}
                    >
                      <option value="">-- Empty Slot --</option>
                      {availablePlayers.map(p => (
                        <option key={p.Contributor} value={p.Contributor}>{p.Contributor}</option>
                      ))}
                    </select>
                  </div>

                  {slotToEdit.player && (
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>Match Rating (0-10.0):</label>
                      <input
                        type="number" min="0" max="10" step="0.1"
                        value={slotToEdit.player.rating !== "" && slotToEdit.player.rating !== undefined ? slotToEdit.player.rating : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSlotToEdit(prev => ({
                            ...prev,
                            player: { ...prev.player, rating: val === "" ? "" : parseFloat(val) }
                          }));
                        }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setSlotToEdit(null)} style={{ padding: '10px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button onClick={() => {
                      const { team, idx, player } = slotToEdit;
                      const teamKey = team === 'A' ? 'teamA' : 'teamB';
                      setEditedLineup(prev => {
                        const newLineup = JSON.parse(JSON.stringify(prev));

                        if (typeof idx === 'string' && idx.startsWith('sub')) {
                          const subIdx = parseInt(idx.replace('sub', ''));
                          if (!Array.isArray(newLineup[teamKey].subs)) {
                            newLineup[teamKey].subs = [null, null];
                          }
                          newLineup[teamKey].subs[subIdx] = player;
                        } else {
                          if (!Array.isArray(newLineup[teamKey].players)) {
                            newLineup[teamKey].players = Array(11).fill(null);
                          }
                          newLineup[teamKey].players[idx] = player;
                        }
                        return newLineup;
                      });
                      setLineupVersion(v => v + 1);
                      setSlotToEdit(null);
                    }} style={{ padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                      Save to Pitch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModifyDashboard;