import { useState } from 'react'
import { getRoleHomeNav, interviewerNav } from '../../data/adminNavigation'
import type { RoleHomeView } from '../../types/admin.types'
import { hasMultipleStaffWorkspaces, switchStaffWorkspace } from '../../utils/staffWorkspace'
import { AccountSettingsView } from '../shared/AccountSettingsView'
import { DashboardShell } from '../shared/DashboardShell'
import styles from './InterviewerDashboard.module.css'

export function InterviewerDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<RoleHomeView>('dashboard')
  const navItems = getRoleHomeNav(interviewerNav, activeView, setActiveView)
  const canSwitchWorkspace = hasMultipleStaffWorkspaces()

  return (
    <DashboardShell navItems={navItems} subtitle="Interviewer" onLogout={onLogout} onChangePassword={() => setActiveView('settings')} showWorkspaceSwitcher={canSwitchWorkspace} onWorkspaceSwitch={() => switchStaffWorkspace('hr')}>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => setActiveView('dashboard')} triggerToast={triggerToast} />
      ) : (
      <div className={`role-content ${styles.content}`}>
        <h1>Interviewer Dashboard</h1>
        <p>Tuesday, October 24, 2024</p>

        <div className={styles.dashboardGrid}>
          <section className={`role-panel ${styles.schedulePanel}`}>
            <div className="role-panel-head">
              <h2>Today&apos;s Schedule</h2>
              <small><strong>4</strong> Candidates</small>
            </div>
            {[
              ['LK', 'Le Dang Khoa', 'Senior Frontend Engineer', '09:30 AM', 'Room 402', 'Technical'],
              ['HN', 'Tran Hoang Nam', 'Product Designer', '11:00 AM', 'Online (Meet)', 'Design'],
              ['TC', 'Mai Thuy Chi', 'Backend Developer', '02:30 PM', 'Room 301', 'Systems'],
            ].map(([initials, name, title, time, location, type], index) => (
              <article className={index === 0 ? styles.scheduleItemSelected : ''} key={name}>
                <span className={styles.avatar}>{initials}</span>
                <div>
                  <strong>{name}</strong>
                  <small>{title}</small>
                  <p><em>{location}</em><em>{type}</em></p>
                </div>
                <time>{time}</time>
              </article>
            ))}
          </section>

          <section className={`role-panel ${styles.scoringPanel}`}>
            <h2>Notes & Scoring</h2>
            <label>General Assessment</label>
            <textarea placeholder="Enter quick feedback about the candidate..." />
            <div className={styles.scoreGrid}>
              <span>Technical Skills <strong>8</strong> / 10</span>
              <span>Soft Skills <strong>7</strong> / 10</span>
            </div>
            <button type="button"><i className="fa-regular fa-paper-plane"></i> Complete & Submit Evaluation</button>
          </section>

          <div className={styles.rightRail}>
            <section className={`role-panel ${styles.skillPanel}`}>
              <h2>Skill Matrix</h2>
              <div className={styles.skillRadar}>
                <span className={`${styles.axis} ${styles.top}`}>React</span>
                <span className={`${styles.axis} ${styles.left}`}>Node.js</span>
                <span className={`${styles.axis} ${styles.right}`}>System</span>
                <span className={`${styles.axis} ${styles.bottom}`}>Soft Skills</span>
                <i></i>
              </div>
            </section>

            <section className={`role-panel ${styles.aiPanel}`}>
              <h2>AI Insights</h2>
              <div><span>Match Score</span><strong>88%</strong></div>
              <i><span></span></i>
              <p>&quot;Candidate has a strong Frontend foundation but needs further verification on system algorithmic thinking.&quot;</p>
            </section>
          </div>
        </div>

        <footer className={styles.footer}>
          <div><strong>JobFusion AI</strong><span>© 2024 JobFusion AI. All rights reserved.</span></div>
          <nav><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a><a href="#help">Help Center</a></nav>
        </footer>
      </div>
      )}
    </DashboardShell>
  )
}
