{contributors.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h2>Contributors</h2>

          {/* Horizontal contributor buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {contributors.map((c) => (
              <button
                key={c.name}
                onClick={() => toggleContributor(c.name)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: activeContributor === c.name
                    ? "#d0f0c0"
                    : "#f0f0f0",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Expanded match sections */}
          {activeContributor && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              {/* Sidebar filters */}
              <div style={{ width: "200px", padding: "15px", borderRight: "1px solid #ccc", backgroundColor: "#f0f0f0" }}>
                <h3>Filters</h3>
                <label>
                  Location:
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    style={{ width: "100%", marginBottom: "10px" }}
                  >
                    <option value="">All</option>
                    {[...new Set(
                      contributors.find(c => c.name === activeContributor)?.matches.map(m => m.location).filter(Boolean)
                    )].map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Year/Month:
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">All</option>
                    {[...new Set(
                      contributors.find(c => c.name === activeContributor)?.matches.map(m => {
                        const d = new Date(m.date);
                        return `${d.getFullYear()}/${d.getMonth() + 1}`;
                      })
                    )].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Match display */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <h3>{activeContributor} - Match History</h3>
                {contributors.find(c => c.name === activeContributor)?.getSortedMatches()
                  .filter(m => {
                    const dateObj = new Date(m.date);
                    const matchYearMonth = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}`;
                    const locationMatch = !filterLocation || m.location === filterLocation;
                    const monthMatch = !filterMonth || matchYearMonth === filterMonth;
                    return locationMatch && monthMatch;
                  })
                  .map((m, i) => {
                    const ratingValue = parseFloat(m.rating);
                    let ratingColor = "#ccc";
                    if (ratingValue > 8.0) ratingColor = "#4CAF50";
                    else if (ratingValue >= 6.0) ratingColor = "#FFEB3B";
                    else ratingColor = "#F44336";

                    return (
                      <div
                        key={i}
                        style={{
                          position: "relative",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          padding: "40px 20px 30px 20px",
                          margin: "15px auto",
                          width: "600px",
                          backgroundColor: "#f9f9f9",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                        }}
                      >
                        {/* Date (top‑left) */}
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "15px",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            color: "#333",
                          }}
                        >
                          {m.date}
                        </div>

                        {/* Location (bottom‑left) */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "25px",
                            fontSize: "0.85rem",
                            color: "#555",
                          }}
                        >
                          {m.location}
                        </div>

                        {/* Symbol + Rating badge (bottom‑right) */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "15px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "1.1rem" }}>{m.symbol}</span>
                          <span
                            style={{
                              backgroundColor: ratingColor,
                              color: ratingValue >= 6 ? "#000" : "#fff",
                              borderRadius: "12px",
                              padding: "2px 8px",
                              fontWeight: "bold",
                              fontSize: "0.85rem",
                              minWidth: "35px",
                              textAlign: "center",
                            }}
                          >
                            {m.rating}
                          </span>
                        </div>
                      </div>
                    );
                  })
                  }
              </div>
            </div>
          )}
        </div>
      )}