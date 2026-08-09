import React, { useState, useEffect } from "react";
import "./FrontPage.css";

const images = [
  "/football1.jpeg",
  "/football2.jpeg",
  "/football3.jpeg",
  "/football4.jpeg"
];

function FrontPage({ onNavigate }) {
  const [index, setIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Changed to 5 seconds for a more cinematic, less frantic pace
    return () => clearInterval(timer);
  }, []);

  const handleImageError = (imgIndex) => {
    setImageErrors(prev => ({ ...prev, [imgIndex]: true }));
  };

  // Count how many images failed to load
  const failedImagesCount = Object.values(imageErrors).filter(Boolean).length;

  // If ALL images fail, show the sleek dark fallback
  if (failedImagesCount === images.length) {
    return (
      <div className="fp-error-state">
        <div className="fp-error-icon">⚽</div>
        <div className="fp-error-text">STADIUM LIGHTS OFF</div>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "10px" }}>
          Unable to load match preview images.
        </p>
      </div>
    );
  }

  return (
    <div className="fp-container">
      {/* Background Images (Crossfade) */}
      {images.map((img, i) => (
        !imageErrors[i] && (
          <img
            key={i}
            src={img}
            alt={`Slide ${i}`}
            className={`fp-bg-image ${i === index ? 'fp-active' : ''}`}
            onError={() => handleImageError(i)}
          />
        )
      ))}

      {/* Dark Overlay */}
      <div className="fp-overlay" />

      {/* Hero Content */}
      <div className="fp-content">
        <div className="fp-kicker">Pro Feedback Loop</div>
        <h1 className="fp-title">
          Is football all about goals and assists?<br />
          <span>NAH.</span>
        </h1>
        <p className="fp-subtitle">
          The ultimate analytics dashboard for Ryan and Darren. Log your matches, 
          compare stats with teammates, and visualize your season's progress in real-time.
        </p>
        
        <div className="fp-actions">
          {/* Pass navigation functions if provided by App.js */}
          <button 
            className="fp-btn fp-btn-primary" 
            onClick={() => onNavigate && onNavigate('display')}
          >
            Enter Dashboard
          </button>
          <button 
            className="fp-btn fp-btn-secondary" 
            onClick={() => onNavigate && onNavigate('calendar')}
          >
            View Calendar
          </button>
        </div>
      </div>

      {/* Carousel Indicator Dots */}
      <div className="fp-dots">
        {images.map((_, i) => (
          <span 
            key={i} 
            className={`fp-dot ${i === index ? 'fp-dot-active' : ''}`} 
            onClick={() => setIndex(i)} // Allow clicking dots to change slide
          />
        ))}
      </div>
    </div>
  );
}

export default FrontPage;