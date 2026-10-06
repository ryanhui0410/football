import React, { useState, useEffect, useCallback } from "react";
import "./FrontPage.css";

const images = [
  "/football1.jpeg",
  "/football2.jpeg",
  "/football3.jpeg",
  "/football4.jpeg",
];

function FrontPage({ onNavigate }) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Auto-rotate hero every 6s
  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex((p) => (p + 1) % images.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleErr = useCallback((i) => {
    setImageErrors((p) => ({ ...p, [i]: true }));
  }, []);

  const failedCount = Object.values(imageErrors).filter(Boolean).length;

  if (failedCount === images.length) {
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

  // Valid (non-errored) image indices
  const validImages = images
    .map((src, i) => ({ src, i }))
    .filter(({ i }) => !imageErrors[i]);

  return (
    <div className={`fp-page ${loaded ? "fp-page--loaded" : ""}`}>

      {/* ══════════ HERO SECTION (full-bleed cinematic) ══════════ */}
      <section className="fp-hero">
        {/* Background crossfade slides */}
        <div className="fp-hero-bg">
          {validImages.map(({ src, i }, idx) => (
            <img
              key={i}
              src={src}
              alt=""
              className={`fp-hero-slide ${
                i === heroIndex ? "fp-hero-slide--active" : ""
              }`}
              onError={() => handleErr(i)}
            />
          ))}
          <div className="fp-hero-overlay" />
        </div>

        {/* Animated content */}
        <div className="fp-hero-content">
          <div className="fp-hero-kicker">
            <span className="fp-hero-kicker-line" />
            Pro Feedback Loop
          </div>
          <h1 className="fp-hero-title">
            Is football all about
            <br />
            goals and assists?
            <br />
            <span className="fp-hero-title-accent">Nah.</span>
          </h1>
          <p className="fp-hero-subtitle">
            The ultimate analytics dashboard for Ryan and Darren. Log your
            matches, compare stats with teammates, and visualize your season's
            progress in real-time.
          </p>
          <div className="fp-hero-actions">
            <button
              className="fp-btn fp-btn-primary"
              onClick={() => onNavigate && onNavigate("display")}
            >
              <span className="fp-btn-icon">📊</span>
              Enter Dashboard
            </button>
            <button
              className="fp-btn fp-btn-secondary"
              onClick={() => onNavigate && onNavigate("calendar")}
            >
              <span className="fp-btn-icon">📅</span>
              View Calendar
            </button>
          </div>
        </div>

        {/* Hero slide indicators (pill-shaped) */}
        <div className="fp-hero-indicators">
          {validImages.map(({ i }, idx) => (
            <button
              key={i}
              className={`fp-hero-indicator ${
                i === heroIndex ? "fp-hero-indicator--active" : ""
              }`}
              onClick={() => setHeroIndex(i)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Scroll hint arrow */}
        <div className="fp-scroll-hint">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 10L12 15L17 10"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* ══════════ PHOTO GALLERY STRIP ══════════ */}
      <section className="fp-gallery">
        <div className="fp-gallery-header">
          <span className="fp-gallery-kicker">Match Moments</span>
          <h2 className="fp-gallery-title">
            Relive the <span>Action</span>
          </h2>
        </div>

        <div className="fp-gallery-grid">
          {validImages.map(({ src, i }, idx) => (
            <div
              key={i}
              className={`fp-gallery-card fp-gallery-card--${idx % 4}`}
              onClick={() => setHeroIndex(i)}
            >
              <div className="fp-gallery-img-wrap">
                <img
                  src={src}
                  alt={`Match ${idx + 1}`}
                  onError={() => handleErr(i)}
                />
                <div className="fp-gallery-shimmer" />
              </div>
              <div className="fp-gallery-caption">
                <span className="fp-gallery-caption-num">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="fp-gallery-caption-label">MATCH DAY</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURE CARDS ══════════ */}
      <section className="fp-features">
        <div className="fp-feature-card">
          <div className="fp-feature-icon">⚡</div>
          <h3>Live Stats</h3>
          <p>Real-time performance tracking across every match.</p>
        </div>
        <div className="fp-feature-card">
          <div className="fp-feature-icon">⚔️</div>
          <h3>Head-to-Head</h3>
          <p>Compare yourself against teammates in any fixture.</p>
        </div>
        <div className="fp-feature-card">
          <div className="fp-feature-icon">📈</div>
          <h3>Season Trends</h3>
          <p>Visualize your form with detailed charts and ratings.</p>
        </div>
      </section>

      {/* ══════════ FOOTER CTA ══════════ */}
      <footer className="fp-footer">
        <p className="fp-footer-text">
          ⚽ Built for the love of the game
        </p>
      </footer>
    </div>
  );
}

export default FrontPage;