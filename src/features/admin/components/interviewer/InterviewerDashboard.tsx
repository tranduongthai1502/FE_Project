import { useState } from 'react'
import { getRoleHomeNav, interviewerNav } from '../../data/adminNavigation'
import type { RoleHomeView } from '../../types/admin.types'
import { AccountSettingsView } from '../shared/AccountSettingsView'
import { DashboardShell } from '../shared/DashboardShell'

export function InterviewerDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<RoleHomeView>('dashboard')
  const navItems = getRoleHomeNav(interviewerNav, activeView, setActiveView)

  return (
    <DashboardShell navItems={navItems} subtitle="Interviewer" onLogout={onLogout} onChangePassword={() => setActiveView('settings')} showWorkspaceSwitcher>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => setActiveView('dashboard')} triggerToast={triggerToast} />
      ) : (
      <div className="role-content interviewer-content">
        <h1>Interviewer Dashboard</h1>
        <p>Tuesday, October 24, 2024</p>
        <div className="role-grid interviewer-grid">
          <section className="role-panel schedule-panel">
            <div className="role-panel-head"><h2>Today&apos;s Schedule</h2><small>4 Candidates</small></div>
            {['Le Dang Khoa - Senior Frontend Engineer', 'Tran Hoang Nam - Product Designer', 'Mai Thuy Chi - Backend Developer'].map((item, index) => (
              <article className={index === 0 ? 'selected' : ''} key={item}><span className="role-avatar">{item.slice(0, 2).toUpperCase()}</span><strong>{item}</strong><em>{['09:30 AM', '11:00 AM', '02:30 PM'][index]}</em></article>
            ))}
          </section>
          <section className="role-panel scoring-panel">
            <h2>Notes & Scoring</h2>
            <label>General Assessment</label>
            <textarea placeholder="Enter quick feedback about the candidate..." />
            <div><span>Technical Skills <strong>8</strong>/10</span><span>Soft Skills <strong>7</strong>/10</span></div>
            <button><i className="fa-regular fa-paper-plane"></i> Complete & Submit Evaluation</button>
          </section>
          <section className="role-panel skill-panel"><h2>Skill Matrix</h2><div className="skill-radar"><span /></div></section>
          <section className="role-panel ai-match-panel"><h2>AI Insights</h2><div><span>Match Score</span><strong>88%</strong></div><i /><p>Candidate has a strong Frontend foundation but needs further verification on system algorithmic thinking.</p></section>
        </div>
      </div>
      )}
    </DashboardShell>
  )
}
