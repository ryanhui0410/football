import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EditMatchPage() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5000/stats");
      const data = await res.json();
      setFormData(data[index]);
      
    };
    fetchData();
  }, [index]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    await fetch(`http://localhost:5000/modify-stats/${index}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    alert("✅ Stat updated!");
    navigate("/modify");
  };

  const handleCancel = () => {
    navigate("/modify");
  };

  if (!formData) return <p>Loading...</p>;

  return (
  <>
    {/* Debug block: shows the entire formData object */}
    <pre style={{ 
      background: "#eee", 
      padding: "10px", 
      borderRadius: "8px", 
      marginTop: "12px", 
      fontSize: "0.9rem", 
      overflowX: "auto" 
    }}>
      {JSON.stringify(formData, null, 2)}
    </pre>

    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "16px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <p><strong>Contributor:</strong> {formData.Contributor}</p>
      <p><strong>Date:</strong> {formData.Date}</p>
      <p><strong>Time:</strong> {formData.Time}</p>
      <p><strong>Location:</strong> {formData.Location}</p>
      <p><strong>Rating:</strong> {formData.Rating}</p>
      <p><strong>Goals:</strong> {formData.Goal}</p>
      <p><strong>Assists:</strong> {formData.Assist}</p>
      <p><strong>Symbol:</strong> {formData.Symbol}</p>
    </div>
  </>
);


}

export default EditMatchPage;
