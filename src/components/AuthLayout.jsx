import React from 'react'
import { HeroPanel } from './HeroPanel'

export function AuthLayout({ children, cardClass = "", header }) {
  return (
    <div className="split-container">
      {/* Left side: Premium Hero panel */}
      <HeroPanel />
      
      {/* Right side container wrapper */}
      <div className="right-panel-wrapper">
        {header}
        <div className="form-column">
          <div className={`auth-card ${cardClass}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
