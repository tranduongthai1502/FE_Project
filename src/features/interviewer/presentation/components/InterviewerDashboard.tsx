import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import type { Candidate } from '@/features/hr/domain/candidate.types'
import { hrCandidateApplicationApi } from '@/features/hr/infrastructure/hrCandidateApplicationApi'
import { buildNavigation } from '@/core/hooks/navigation'
import { interviewerNav } from './interviewerNavigation'
import type { InterviewerHomeView } from '@/features/interviewer/domain/interviewerHome.types'
import { getActiveInterviewerView, interviewerPathByView } from '@/features/interviewer/domain/interviewerRoutePaths'
import { AccountSettingsPanel, getStoredDashboardUser, isStoredCurrentUserInactive } from '@/features/auth'
import { DashboardShell } from '@/core/components/DashboardShell'
import { getStoredRequirePasswordChange } from '@/core/api/authStorage'
import styles from './InterviewerDashboard.module.css'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'

type MyInterviewCard = {
  id: string
  name: string
  title: string
  time: string
  format: string
  status: string
  score: number
  image?: string
}

function toMyInterviewCard(candidate: Candidate): MyInterviewCard {
  return {
    id: candidate.id,
    name: candidate.name,
    title: candidate.targetJob,
    time: candidate.dateApplied,
    format: 'Online',
    status: String(candidate.recruitmentStage || 'Scheduled'),
    score: candidate.matchScore,
  }
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CA'
}

function MyInterviewSchedule({ onHome }: { onHome: () => void }) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
  const [searchQuery, setSearchQuery] = useState('')
  const candidateQuery = useQuery({
    queryKey: ['interviewer', 'candidate-applications', { searchQuery }],
    queryFn: () => hrCandidateApplicationApi.getCandidateApplications({
      page: 1,
      size: 10,
      sortField: 'createdAt',
      sortBy: 'DESC',
      filters: searchQuery.trim() ? { search: searchQuery.trim() } : {},
    }),
  })
  const myInterviewCards = (candidateQuery.data ?? []).map(toMyInterviewCard)

  return (
    <div className={`role-content ${styles.interviewScheduleContent}`}>
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'My Interviews', current: true }]} />

      <header className={styles.interviewScheduleHeader}>
        <h1>My Interview</h1>
      </header>

      <section className={styles.interviewMetrics} aria-label="Interview metrics">
        <article>
          <span><i className="fa-solid fa-calendar-day"></i></span>
          <div><small>Upcoming Today</small><strong>02</strong><p>Next: 10:30 AM with Jordan S.</p></div>
        </article>
        <article>
          <span><i className="fa-solid fa-clipboard-question"></i></span>
          <div><small>Pending Evaluations</small><strong>01</strong><p>Average wait time: 2.4 days</p></div>
        </article>
        <article>
          <span><i className="fa-solid fa-circle-check"></i></span>
          <div><small>Completed This Week</small><strong>1</strong><p>0 hires confirmed so far</p></div>
        </article>
      </section>

      <section className={styles.myInterviewPanel}>
        <div className={styles.myInterviewToolbar}>
          <label className={styles.myInterviewSearch}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search job title, or department..." />
          </label>

          <div className={styles.myInterviewViewToggle}>
            <button type="button" className={viewMode === 'list' ? styles.activeInterviewMode : undefined} onClick={() => setViewMode('list')}>
              <i className="fa-solid fa-list"></i>List View
            </button>
            <button type="button" className={viewMode === 'calendar' ? styles.activeInterviewMode : undefined} onClick={() => setViewMode('calendar')}>
              <i className="fa-regular fa-calendar"></i>Calendar View
            </button>
          </div>

          <div className={styles.myInterviewPeriodToggle}>
            <button type="button" className={styles.activeInterviewMode}>Day</button>
            <button type="button">Week</button>
            <button type="button">Month</button>
          </div>

          <button type="button" className={styles.myInterviewSelect}>Status: All <i className="fa-solid fa-chevron-down"></i></button>
          <button type="button" className={styles.myInterviewDate}><i className="fa-solid fa-chevron-left"></i> Wednesday, Aug 12, 2026 <i className="fa-solid fa-chevron-right"></i></button>
          <button type="button" className={styles.myInterviewToday}>Today</button>
        </div>

        <section className={`${styles.myInterviewGrid} ${viewMode === 'list' ? styles.myInterviewGridList : ''}`} aria-label="My interviews">
          {myInterviewCards.length > 0 ? (
            myInterviewCards.map((interview) => (
              <article className={styles.myInterviewCard} key={interview.id}>
                <header>
                  {interview.image ? <img src={interview.image} alt="" /> : <b>{getInitials(interview.name)}</b>}
                  <div>
                    <strong>{interview.name}</strong>
                    <span>{interview.title}</span>
                  </div>
                  <em><i className="fa-solid fa-wand-magic-sparkles"></i>{interview.score}%</em>
                </header>
                <dl>
                  <div><dt>Date & Time</dt><dd>{interview.time}</dd></div>
                  <div><dt>Format</dt><dd>{interview.format}</dd></div>
                </dl>
                <footer><span><i className="fa-solid fa-circle"></i>{interview.status}</span></footer>
              </article>
            ))
          ) : candidateQuery.isLoading ? (
            <div className={styles.myInterviewEmpty}>Loading candidates...</div>
          ) : candidateQuery.isError ? (
            <div className={styles.myInterviewEmpty}>Unable to load candidates.</div>
          ) : (
            <div className={styles.myInterviewEmpty}>No interviews scheduled.</div>
          )}
        </section>
      </section>
    </div>
  )
}

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
    interviews: 0,
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
        <Route path="/" element={<Navigate to="interviews" replace />} />
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
        <Route path="interviews" element={<MyInterviewSchedule key={viewResetKeys.interviews} onHome={() => selectView('dashboard')} />} />
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
