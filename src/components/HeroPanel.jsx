import React from 'react'

export function HeroPanel() {
  return (
    <div className="hero-column">
      <div className="hero-gradient-bg"></div>
      
      {/* Decorative premium shapes */}
      <div className="hero-shapes">
        <div className="shape-circle-1"></div>
        <div className="shape-circle-2"></div>
      </div>
      
      <div className="hero-card-container">
        {/* Glassmorphic card */}
        <div className="hero-glass-card">
          <div className="hero-logo">
            <i className="fa-solid fa-circle hero-logo-dot"></i>
            <span>JobFusion</span>
          </div>
          <h2 className="hero-title">
            Empowering your recruitment with Human-in-the-Loop AI
          </h2>
          <p className="hero-desc">
            Save time, make smarter decisions, and deliver the best candidate experience using our AI talent suite.
          </p>
        </div>
      </div>
    </div>
  )
}
