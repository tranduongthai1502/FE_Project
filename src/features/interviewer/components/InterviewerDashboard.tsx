import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildNavigation } from '@/components/common/navigation'
import { interviewerNav } from './interviewerNavigation'
import type { RoleHomeView } from '@/app/routes/route.types'
import { isStoredCurrentUserInactive } from '@/features/auth/utils/authAccess'
import { getInitialRoleHomeView, getRoleHomeViewPath } from '@/app/routes/roleRouteHelpers'
import { AccountSettingsPanel } from '@/components/common/AccountSettingsPanel'
import { DashboardShell } from '@/components/common/DashboardShell'
import styles from './InterviewerDashboard.module.css'
import { FIELD_LENGTH_LIMITS } from '@/services/api/axiosErrorHandler'

export function InterviewerDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState<RoleHomeView>(() => getInitialRoleHomeView('interviewer', location.pathname))
  const [viewResetKeys, setViewResetKeys] = useState<Record<RoleHomeView, number>>({
    dashboard: 0,
    jobs: 0,
    settings: 0,
  })
  const selectView = (view: RoleHomeView) => {
    setActiveView(view)
    navigate(getRoleHomeViewPath('interviewer', view))
  }
  const reloadViewFromSidebar = (view: RoleHomeView) => {
    setActiveView(view)
    navigate(getRoleHomeViewPath('interviewer', view))
    setViewResetKeys((current) => ({
      ...current,
      [view]: current[view] + 1,
    }))
  }
  const navItems = buildNavigation(interviewerNav, activeView, reloadViewFromSidebar)
  const isActionLocked = isStoredCurrentUserInactive()

  useEffect(() => {
    setActiveView(getInitialRoleHomeView('interviewer', location.pathname))
  }, [location.pathname])

  return (
    <DashboardShell navItems={navItems} subtitle="Interviewer" onLogout={onLogout} onChangePassword={() => selectView('settings')}>
      {activeView === 'settings' ? (
        <AccountSettingsPanel key={viewResetKeys.settings} onBack={() => selectView('dashboard')} triggerToast={triggerToast} />
      ) : (
      <div key={viewResetKeys.dashboard} className={`role-content ${styles.content}`}>
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
                  <span className="table-name-tooltip" data-tooltip={name} title={name} tabIndex={0}>
                    <strong>{name}</strong>
                  </span>
                  <span className="table-name-tooltip" data-tooltip={title} title={title} tabIndex={0}>
                    <small>{title}</small>
                  </span>
                  <p><em>{location}</em><em>{type}</em></p>
                </div>
                <time>{time}</time>
              </article>
            ))}
          </section>

          <section className={`role-panel ${styles.scoringPanel}`}>
            <h2>Notes & Scoring</h2>
            <label>General Assessment</label>
            <textarea placeholder="Enter quick feedback about the candidate..." maxLength={FIELD_LENGTH_LIMITS.defaultText}/>
            <div className={styles.scoreGrid}>
              <span>Technical Skills <strong>8</strong> / 10</span>
              <span>Soft Skills <strong>7</strong> / 10</span>
            </div>
            <button type="button" disabled={isActionLocked}><i className="fa-regular fa-paper-plane"></i> Complete & Submit Evaluation</button>
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
