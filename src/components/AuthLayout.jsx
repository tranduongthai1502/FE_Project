import React from 'react'
import { HeroPanel } from './HeroPanel'

export function AuthLayout({ children }) {
  return (
    <div className="split-container">
      {/* Left side: Premium Hero panel */}
      <HeroPanel />
      
      {/* Right side: Auth Form card container */}
      <div className="form-column">
        <div className="auth-card">
          {/* Background premium decoration bubbles inside the form card */}
          <ul className="bg-bubbles">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
          
          {children}
        </div>
      </div>
    </div>
  )
}
