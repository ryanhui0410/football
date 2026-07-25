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

function FormTrendGraph({ matches }) {
  // matches: array of { date, rating } sorted by date ascending
  const lastN = 5; // show last 5 matches
  const recent = matches.slice(-lastN);

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
      y: { 
        min: 5,        // ← start from 5 instead of 0
        max: 10,
        ticks: { stepSize: 1 } 
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  if (recent.length === 0) return null;

  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "6px" }}>
        📈 Form Trend (last {recent.length} matches)
      </div>
      <div style={{ height: "180px" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default FormTrendGraph;