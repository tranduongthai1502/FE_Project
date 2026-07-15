import { useState } from 'react'
import { getRoleHomeNav, hrNav } from '../../data/adminNavigation'
import type { RoleHomeView } from '../../types/admin.types'
import { hasMultipleStaffWorkspaces, switchStaffWorkspace } from '../../utils/staffWorkspace'
import { AccountSettingsView } from '../shared/AccountSettingsView'
import { DashboardShell } from '../shared/DashboardShell'
import styles from './HrDashboard.module.css'

export function HrDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<RoleHomeView>('dashboard')
  const navItems = getRoleHomeNav(hrNav, activeView, setActiveView)
  const canSwitchWorkspace = hasMultipleStaffWorkspaces()

  return (
    <DashboardShell navItems={navItems} subtitle="HR" onLogout={onLogout} onChangePassword={() => setActiveView('settings')} showWorkspaceSwitcher={canSwitchWorkspace} onWorkspaceSwitch={() => switchStaffWorkspace('interviewer')}>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => setActiveView('dashboard')} triggerToast={triggerToast} />
      ) : (
      <div className={`role-content ${styles.content}`}>
        <div className={`role-title-row ${styles.title}`}>
          <div>
            <h1>Welcome back, Alex</h1>
            <p>Here&apos;s what&apos;s happening with your recruitment funnel today.</p>
          </div>
          <div>
            <button type="button">Download Reports</button>
            <button type="button">View Schedule</button>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          {[
            ['fa-user-group', 'Total Candidates', '2,842', '+12%'],
            ['fa-briefcase', 'Active Jobs', '48', 'Stable'],
            ['fa-bolt', 'AI-Scored Top Talents', '156', 'AI Enhanced'],
            ['fa-stopwatch', 'Avg. Time to Hire', '18 days', '-4 days'],
          ].map(([icon, label, value, note]) => (
            <section className={styles.kpiCard} key={label}>
              <span><i className={`fa-solid ${icon}`}></i></span>
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{note}</em>
            </section>
          ))}
        </div>

        <div className={styles.dashboardGrid}>
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
              <button type="button">Join</button>
            </article>
            <article>
              <i className="fa-regular fa-circle-check"></i>
              <div><strong>Job Posting &quot;Cloud Architect&quot; successfully published.</strong><small>2 hours ago - Manual</small></div>
            </article>
          </section>

          <section className={`role-panel ${styles.quickPanel}`}>
            <h2>Quick Actions</h2>
            <div>
              <button type="button"><i className="fa-regular fa-file-lines"></i> Parse Resume</button>
              <button type="button"><i className="fa-regular fa-envelope"></i> Blast Email</button>
              <button type="button"><i className="fa-solid fa-video"></i> AI Screening</button>
              <button type="button"><i className="fa-solid fa-share-nodes"></i> Social Share</button>
            </div>
          </section>

          <section className={`role-panel ${styles.pipelinePanel}`}>
            <h2>Pipeline Health</h2>
            <div className={styles.pipelineTrack}><span></span><span></span><span></span><span></span></div>
            <footer><span>Sourced (450)</span><span>Screened (120)</span><span>Interview (24)</span><span>Offer (4)</span></footer>
          </section>

          <section className={`role-panel ${styles.topPicks}`}>
            <div className="role-panel-head"><h2>Top Picks</h2><i className="fa-solid fa-wand-magic-sparkles"></i></div>
            {[
              ['JD', 'Jordan Day', 'DevOps Engineer', '98%'],
              ['ML', 'Maria Lopez', 'Data Scientist', '95%'],
              ['BK', 'Ben King', 'Product Lead', '89%'],
            ].map(([initials, name, title, score]) => (
              <article key={name}>
                <span>{initials}</span>
                <div><strong>{name}</strong><small>{title}</small></div>
                <em>{score}</em>
              </article>
            ))}
          </section>
        </div>
      </div>
      )}
    </DashboardShell>
  )
}
