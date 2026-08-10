import { Navigate, Route, Routes } from 'react-router-dom'
import { AccountSettingsPanel } from '@/features/auth'
import { DashboardShell } from '@/core/components/DashboardShell'
import { CandidateDetailView } from '../components/candidate/CandidateDetailView'
import { CandidateManagementView } from './CandidateManagementView'
import { InterviewManagementView } from './InterviewManagementView'
import { JobManagementView } from './JobManagementView'
import { useHrDashboardController } from '@/features/hr/application/hooks/useHrDashboardController'
import styles from './HrDashboard.module.css'

type ToastTrigger = (message: string, type?: 'success' | 'error') => void

export function HrDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: ToastTrigger }) {
  const dashCtrl = useHrDashboardController({ triggerToast })

  return (
    <DashboardShell navItems={dashCtrl.navItems} subtitle="HR" user={dashCtrl.user} onLogout={onLogout} onChangePassword={() => dashCtrl.selectView('settings')}>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route
          path="settings"
          element={(
            <AccountSettingsPanel
              key={dashCtrl.viewResetKeys.settings}
              isPasswordChangeRequired={dashCtrl.isPasswordChangeRequired}
              onBack={() => dashCtrl.selectView('dashboard')}
              triggerToast={triggerToast}
            />
          )}
        />
        <Route path="jobs/*" element={<JobManagementView key={dashCtrl.viewResetKeys.jobs} isActionLocked={dashCtrl.isActionLocked} onHome={() => dashCtrl.selectView('dashboard')} triggerToast={triggerToast} />} />
        <Route path="candidates" element={<CandidateManagementView key={dashCtrl.viewResetKeys.candidates} />} />
        <Route path="candidates/:candidateId" element={<CandidateDetailView key={dashCtrl.viewResetKeys.candidates} />} />
        <Route path="interviews" element={<InterviewManagementView key={dashCtrl.viewResetKeys.interviews} />} />
        <Route path="dashboard" element={(
          <div key={dashCtrl.viewResetKeys.dashboard} className={`role-content ${styles.content}`}>
            <div className={`role-title-row ${styles.title}`}>
              <div>
                <h1>Welcome back, Alex</h1>
                <p>Here&apos;s what&apos;s happening with your recruitment funnel today.</p>
              </div>
              <div>
                <button type="button" disabled={dashCtrl.isActionLocked}>Download Reports</button>
                <button type="button" disabled={dashCtrl.isActionLocked}>View Schedule</button>
              </div>
            </div>

            <div className={styles.kpiGrid}>
              {[
                ['fa-user-group', 'Total Candidates', '2,842', '+12%', 'fa-arrow-trend-up'],
                ['fa-briefcase', 'Active Jobs', '48', 'Stable', ''],
                ['fa-bolt', 'AI-Scored Top Talents', '156', 'AI Enhanced', ''],
                ['fa-stopwatch', 'Avg. Time to Hire', '18 days', '-4 days', 'fa-arrow-trend-down'],
              ].map(([icon, label, value, note, noteIcon]) => (
                <section className={styles.kpiCard} key={label}>
                  <span><i className={`fa-solid ${icon}`}></i></span>
                  <small>{label}</small>
                  <strong>{value}</strong>
                  <em>{note}{noteIcon && <i className={`fa-solid ${noteIcon}`}></i>}</em>
                </section>
              ))}
            </div>

            <div className={styles.dashboardGrid}>
              <div className={styles.dashboardColumn}>
                <section className={`role-panel ${styles.activityPanel}`}>
                  <div className="role-panel-head">
                    <h2>Recent Activity</h2>
                    <a href="#activity">View All</a>
                  </div>
                  <article>
                    <i className="fa-solid fa-headset"></i>
                    <div><strong>AI parsed 50 CVs for Senior React Developer role.</strong><small>2 minutes ago - Automated</small></div>
                    <span>Match 92%</span>
                  </article>
                  <article>
                    <i className="fa-solid fa-user-plus"></i>
                    <div><strong>New application from Sarah Chen for UX Lead.</strong><small>45 minutes ago - LinkedIn Import</small></div>
                    <b></b>
                  </article>
                  <article className={styles.urgent}>
                    <i className="fa-solid fa-exclamation"></i>
                    <div><strong>URGENT: Interview with Marcus V. is starting in 15 mins.</strong><small>In progress - AI Interviewer Ready</small></div>
                    <button type="button" disabled={dashCtrl.isActionLocked}>Join</button>
                  </article>
                  <article>
                    <i className="fa-regular fa-circle-check"></i>
                    <div><strong>Job Posting &quot;Cloud Architect&quot; successfully published.</strong><small>2 hours ago - Manual</small></div>
                  </article>
                </section>

                <section className={`role-panel ${styles.pipelinePanel}`}>
                  <h2>Pipeline Health</h2>
                  <div className={styles.pipelineTrack}><span></span><span></span><span></span><span></span></div>
                  <footer><span>Sourced (450)</span><span>Screened (120)</span><span>Interview (24)</span><span>Offer (4)</span></footer>
                </section>
              </div>

              <div className={styles.dashboardColumn}>
                <section className={`role-panel ${styles.quickPanel}`}>
                  <h2>Quick Actions</h2>
                  <div>
                    <button type="button" disabled={dashCtrl.isActionLocked}><i className="fa-regular fa-file-lines"></i> Parse Resume</button>
                    <button type="button" disabled={dashCtrl.isActionLocked}><i className="fa-regular fa-envelope"></i> Blast Email</button>
                    <button type="button" disabled={dashCtrl.isActionLocked}><i className="fa-solid fa-video"></i> AI Screening</button>
                    <button type="button" disabled={dashCtrl.isActionLocked}><i className="fa-solid fa-share-nodes"></i> Social Share</button>
                  </div>
                </section>

                <section className={`role-panel ${styles.topPicks}`}>
                  <div className="role-panel-head">
                    <h2>Top Picks</h2>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19ZM8 14.15L9 12L11.15 11L9 10L8 7.85L7 10L4.85 11L7 12L8 14.15Z" fill="#AD2B00" />
                    </svg>
                  </div>
                  {[
                    ['JD', 'Jordan Day', 'DevOps Engineer', '98%'],
                    ['ML', 'Maria Lopez', 'Data Scientist', '95%'],
                    ['BK', 'Ben King', 'Product Lead', '89%'],
                  ].map(([initials, name, title, score]) => (
                    <article key={name}>
                      <span>{initials}</span>
                      <div>
                        <span className="table-name-tooltip" data-tooltip={name} title={name} tabIndex={0}>
                          <strong>{name}</strong>
                        </span>
                        <span className="table-name-tooltip" data-tooltip={title} title={title} tabIndex={0}>
                          <small>{title}</small>
                        </span>
                      </div>
                      <em>{score}</em>
                    </article>
                  ))}
                </section>
              </div>
            </div>
          </div>
        )} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardShell>
  )
}
