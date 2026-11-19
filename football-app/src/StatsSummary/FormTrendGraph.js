import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// Result → box colour (green win / grey draw / red loss, neutral if unknown)
const resultStyle = (wl) => {
  const v = (wl || "").toString().trim().toLowerCase();
  if (v === "win")  return { bg: "#10b981", fg: "#ffffff" };
  if (v === "loss") return { bg: "#ef4444", fg: "#ffffff" };
  if (v === "draw") return { bg: "#94a3b8", fg: "#ffffff" };
  return { bg: "#e2e8f0", fg: "#64748b" };
};

// "11/13/2026" → "11/13"
const shortDate = (d) => {
  const parts = (d || "").split("/");
  return parts.length === 3 ? `${parts[0]}/${parts[1]}` : (d || "");
};

// ✅ Same padding on ALL four sides inside the box
const BOX_PADDING = "12px";
const SCORE_FONT = "16px";

function FormTrendGraph({ matches }) {
  // matches: array of { date, rating, wl, result } sorted by date ascending
  const lastN = 5;
  const recent = matches.slice(-lastN);

  if (recent.length === 0) return null;

  const placeholders = Array(lastN - recent.length).fill(null);

  const data = {
    labels: recent.map(m => m.date),
    datasets: [
      {
        label: "Rating",
        data: recent.map(m => m.rating),
        borderColor: "#2196F3",
        backgroundColor: "rgba(33,150,243,0.1)",
        tension: 0.3,
        pointBackgroundColor: "#2196F3",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 5, max: 10, ticks: { stepSize: 1 } },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div style={{ marginTop: "10px", width: "100%" }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>
        📈 Form (last {recent.length} matches)
      </div>

      <div style={{ display: "flex", gap: "8px", width: "100%", alignItems: "flex-start" }}>
        {/* Empty slots — hidden text keeps rating/box/date rows perfectly aligned */}
        {placeholders.map((_, i) => (
          <div key={`ph-${i}`} style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, visibility: "hidden" }}>0.0</span>
            <div style={{
              width: "100%", padding: BOX_PADDING, boxSizing: "border-box",
              borderRadius: "10px", border: "1px dashed #cbd5e1", background: "#f8fafc",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: SCORE_FONT, fontWeight: 700, visibility: "hidden" }}>0-0</span>
            </div>
            <span style={{ fontSize: "12px", visibility: "hidden" }}>0/0</span>
          </div>
        ))}

        {recent.map((m, i) => {
          const r = resultStyle(m.wl);
          const rating = parseFloat(m.rating) || 0;
          const score = (m.result || "").trim() || "—";
          return (
            <div
              key={`${m.date}-${i}`}
              style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
            >
              {/* ✅ Rating ABOVE the box */}
              <span style={{
                fontSize: "15px", fontWeight: 700, color: "#0f172a",
                fontFamily: "'Oswald', sans-serif", lineHeight: 1.2,
              }}>
                {rating.toFixed(1)}
              </span>

              {/* ✅ Box: scoreline only, colour = result, even padding all around */}
              <div
                title={`${m.date} · ${m.wl || "Unknown result"}${m.result ? ` · ${m.result}` : ""} · Rating ${rating.toFixed(1)}`}
                style={{
                  width: "100%",
                  padding: BOX_PADDING,          // ⬅ same value top/right/bottom/left
                  boxSizing: "border-box",
                  borderRadius: "10px",
                  background: r.bg, color: r.fg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Oswald', sans-serif", lineHeight: 1.2,
                }}
              >
                <span style={{ fontSize: SCORE_FONT, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {score}
                </span>
              </div>

              {/* ✅ Date BELOW the box */}
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>
                {shortDate(m.date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Trend line (delete this block + Line import/registration if you want boxes only) ── */}
      <div style={{ height: "180px", marginTop: "12px" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default FormTrendGraph;