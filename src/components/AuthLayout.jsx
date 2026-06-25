import React from 'react'
import { HeroPanel } from './HeroPanel'

export function AuthLayout({ children, cardClass = "" }) {
  return (
    <div className="split-container">
      {/* Left side: Premium Hero panel */}
      <HeroPanel />
      
      {/* Right side: Auth Form card container */}
      <div className="form-column">
        <div className={`auth-card ${cardClass}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
