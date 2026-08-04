import React, { useState, useMemo } from "react";
import "./MatchCalendar.css";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

// "7/29/2026" -> { y:2026, m:7, d:29 }
function parseDate(str) {
  const [m, d, y] = (str || "").split("/").map(Number);
  return { y, m, d };
}

function MatchCalendar({ stats = [] }) {
  // default to the latest month that actually has matches
  const latest = useMemo(() => {
    let best = null;
    stats.forEach((s) => {
      const { y, m } = parseDate(s.Date);
      if (!y || !m) return;
      const val = y * 12 + (m - 1);
      if (!best || val > best.val) best = { val, y, m: m - 1 };
    });
    return best;
  }, [stats]);

  const now = new Date();
  const [viewYear, setViewYear] = useState(latest ? latest.y : now.getFullYear());
  const [viewMonth, setViewMonth] = useState(latest ? latest.m : now.getMonth());
  const [contributor, setContributor] = useState("All");

  const contributors = useMemo(
    () => ["All", ...new Set(stats.map((s) => s.Contributor).filter(Boolean))],
    [stats]
  );

  // group matches by "y-m-d"
  const matchesByDay = useMemo(() => {
    const map = {};
    stats.forEach((s) => {
      if (contributor !== "All" && s.Contributor !== contributor) return;
      const { y, m, d } = parseDate(s.Date);
      if (!y || !m || !d) return;
      const key = `${y}-${m}-${d}`;
      (map[key] = map[key] || []).push(s);
    });
    return map;
  }, [stats, contributor]);

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () =>
    viewMonth === 0 ? (setViewMonth(11), setViewYear((y) => y - 1)) : setViewMonth((m) => m - 1);
  const nextMonth = () =>
    viewMonth === 11 ? (setViewMonth(0), setViewYear((y) => y + 1)) : setViewMonth((m) => m + 1);

  return (
    <div className="cal-wrap">
      <div className="cal-header">
        <div>
          <span className="cal-kicker">MATCH CALENDAR</span>
          <h2 className="cal-title">{MONTHS[viewMonth]} <span>{viewYear}</span></h2>
        </div>
        <div className="cal-nav">
          <button className="cal-arrow" onClick={prevMonth} aria-label="Previous month">‹</button>
          <button className="cal-arrow" onClick={nextMonth} aria-label="Next month">›</button>
        </div>
      </div>

      <div className="cal-filters">
        {contributors.map((c) => (
          <button
            key={c}
            className={`cal-chip ${contributor === c ? "active" : ""}`}
            onClick={() => setContributor(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="cal-dow">
        {DOW.map((d) => <div key={d} className="cal-dow-cell">{d}</div>)}
      </div>

      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={`b${i}`} className="cal-cell blank" />;
          const key = `${viewYear}-${viewMonth + 1}-${day}`;
          const dayMatches = matchesByDay[key] || [];
          const has = dayMatches.length > 0;

                    return (
            <div key={key} className={`cal-cell ${has ? "has-match" : ""}`}>
              <span className="cal-day-num">{day}</span>
              
              {/* NEW: Inline Match Events */}
              {has && (
                <div className="cal-events">
                  {dayMatches.map((m, idx) => {
                    const wl = String(m["Win/Loss?"] || "").toLowerCase();
                    return (
                      <div key={idx} className={`cal-event ${wl}`}>
                        <div className="cal-event-top">
                          <span className="cal-event-name">{m.Contributor}</span>
                          {m.Symbol && <span className="cal-event-symbol">{m.Symbol}</span>}
                        </div>
                        {m["Match result"] && (
                          <div className="cal-event-score">{m["Match result"]}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Keep the tooltip for extra details like Location/Time */}
              {has && (
                <div className="cal-tooltip">
                  <div className="cal-tt-date">{viewMonth + 1}/{day}/{viewYear}</div>
                  {dayMatches.map((m, idx) => (
                    <div key={idx} className="cal-tt-card">
                      <div className="cal-tt-top">
                        <span className="cal-tt-name">{m.Contributor}</span>
                        <span className="cal-tt-symbol">{m.Symbol || "—"}</span>
                      </div>
                      <div className="cal-tt-meta">
                        <span>📍 {m.Location || "—"}</span>
                        <span>🕒 {m.Time || "—"}</span>
                      </div>
                      {(m["Match result"] || m["Win/Loss?"]) && (
                        <div className="cal-tt-result">
                          {m["Match result"] && <span>{m["Match result"]}</span>}
                          {m["Win/Loss?"] && (
                            <span className={`wl ${String(m["Win/Loss?"]).toLowerCase()}`}>{m["Win/Loss?"]}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="cal-legend">
        <span><span className="legend-dot"></span>Match day — hover for details</span>
        <span className="legend-sym">⚽ Goal &nbsp; 👟 Assist</span>
      </div>
    </div>
  );
}

export default MatchCalendar;