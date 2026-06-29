import React from 'react'
import bgImg from '../assets/ai_recruitment_bg.png'

export function HeroPanel() {
  return (
    <div className="hero-column" style={{ backgroundImage: `url(${bgImg})` }}>
      <div className="hero-gradient-bg"></div>

      {/* Decorative premium shapes */}
      <div className="hero-shapes">
        <div className="shape-circle-1"></div>
        <div className="shape-circle-2"></div>
      </div>

      <div className="hero-card-container">
        {/* Glassmorphic card */}
        <div className="hero-glass-card">

          <h2 className="hero-title">

            Empowering your recruitment with Human-in-the-Loop AI
          </h2>
          <p className="hero-desc">
            Seamlessly blending machine intelligence with human intuition to find your perfect candidate match, faster than ever.
          </p>
        </div>
      </div>
    </div>
  )
}
