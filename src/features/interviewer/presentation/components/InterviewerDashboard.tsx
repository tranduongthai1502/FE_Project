import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { buildNavigation } from '@/core/hooks/navigation'
import { interviewerNav } from './interviewerNavigation'
import type { InterviewerHomeView } from '@/features/interviewer/presentation/pages/interviewerHome.types'
import { isStoredCurrentUserInactive } from '@/features/auth/application/authAccess'
import { getActiveInterviewerView, interviewerPathByView } from '@/features/interviewer/presentation/interviewerRoutePaths'
import { AccountSettingsPanel, getStoredDashboardUser } from '@/features/auth'
import { DashboardShell } from '@/core/components/DashboardShell'
import { getStoredRequirePasswordChange } from '@/core/api/authStorage'
import styles from './InterviewerDashboard.module.css'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'

export function InterviewerDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isPasswordChangeRequired] = useState(() => getStoredRequirePasswordChange())
  const [user] = useState(() => getStoredDashboardUser())
  const [activeView, setActiveView] = useState<InterviewerHomeView>(() => (
    getStoredRequirePasswordChange() ? 'settings' : getActiveInterviewerView(location.pathname)
  ))
  const [viewResetKeys, setViewResetKeys] = useState<Record<InterviewerHomeView, number>>({
    dashboard: 0,
    settings: 0,
  })
  const selectView = (view: InterviewerHomeView) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(interviewerPathByView.settings)
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setActiveView(view)
    navigate(interviewerPathByView[view])
  }
  const reloadViewFromSidebar = (view: InterviewerHomeView) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(interviewerPathByView.settings)
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setActiveView(view)
    navigate(interviewerPathByView[view])
    setViewResetKeys((current) => ({
      ...current,
      [view]: current[view] + 1,
    }))
  }
  const navItems = buildNavigation(interviewerNav, activeView, reloadViewFromSidebar).map((item) => (
    isPasswordChangeRequired && item.label !== 'Settings'
      ? {
          ...item,
          onClick: () => {
            setActiveView('settings')
            navigate(interviewerPathByView.settings)
            triggerToast?.('Please change your password before using this workspace.', 'error')
          },
        }
      : item
  ))
  const isActionLocked = isStoredCurrentUserInactive()

  useEffect(() => {
    if (isPasswordChangeRequired) {
      setActiveView('settings')
      if (location.pathname !== interviewerPathByView.settings) {
        navigate(interviewerPathByView.settings, { replace: true })
      }
      return
    }

    setActiveView(getActiveInterviewerView(location.pathname))
  }, [isPasswordChangeRequired, location.pathname, navigate])

  return (
    <DashboardShell navItems={navItems} subtitle="Interviewer" user={user} onLogout={onLogout} onChangePassword={() => selectView('settings')}>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route
          path="settings"
          element={(
            <AccountSettingsPanel
              key={viewResetKeys.settings}
              isPasswordChangeRequired={isPasswordChangeRequired}
              onBack={() => selectView('dashboard')}
              triggerToast={triggerToast}
            />
          )}
        />
        <Route path="dashboard" element={(
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
        )} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardShell>
  )
}
