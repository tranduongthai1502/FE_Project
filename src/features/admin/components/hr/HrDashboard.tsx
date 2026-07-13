import { useState } from 'react'
import { getRoleHomeNav, hrNav } from '../../data/adminNavigation'
import type { RoleHomeView } from '../../types/admin.types'
import { AccountSettingsView } from '../shared/AccountSettingsView'
import { DashboardShell } from '../shared/DashboardShell'
import { MetricCard } from '../shared/MetricCard'

export function HrDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<RoleHomeView>('dashboard')
  const navItems = getRoleHomeNav(hrNav, activeView, setActiveView)

  return (
    <DashboardShell navItems={navItems} subtitle="HR" onLogout={onLogout} onChangePassword={() => setActiveView('settings')} showWorkspaceSwitcher>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => setActiveView('dashboard')} triggerToast={triggerToast} />
      ) : (
      <div className="role-content">
        <div className="role-title-row">
          <div><h1>Welcome back, Alex</h1><p>Here&apos;s what&apos;s happening with your recruitment funnel today.</p></div>
          <div><button>Download Reports</button><button>View Schedule</button></div>
        </div>
        <div className="role-metrics four">
          <MetricCard icon="fa-user-group" label="Total Candidates" value="2,842" note="+12%" />
          <MetricCard icon="fa-briefcase" label="Active Jobs" value="48" note="Stable" />
          <MetricCard icon="fa-bolt" label="AI-Scored Top Talents" value="156" note="AI Enhanced" />
          <MetricCard icon="fa-stopwatch" label="Avg. Time to Hire" value="18 days" note="-4 days" />
        </div>
        <div className="role-grid hr-grid">
          <section className="role-panel recent-activity">
            <div className="role-panel-head"><h2>Recent Activity</h2><a href="#activity">View All</a></div>
            {['AI parsed 50 CVs for Senior React Developer role.', 'New application from Sarah Chen for UX Lead.', 'URGENT: Interview with Marcus V. is starting in 15 mins.', 'Job Posting Cloud Architect successfully published.'].map((item, index) => (
              <article className={index === 2 ? 'urgent' : ''} key={item}><i className={`fa-solid ${index === 2 ? 'fa-exclamation' : 'fa-circle-info'}`}></i><span>{item}</span>{index === 2 && <button>Join</button>}</article>
            ))}
          </section>
          <section className="role-panel quick-panel"><h2>Quick Actions</h2><div><button>Parse Resume</button><button>Blast Email</button><button>AI Screening</button><button>Social Share</button></div></section>
          <section className="role-panel pipeline-panel"><h2>Pipeline Health</h2><div><span /><span /><span /><span /></div><footer>Sourced (450) Screening (120) Interview (24) Offer (4)</footer></section>
          <section className="role-panel top-picks"><h2>Top Picks</h2>{['Jordan Day', 'Maria Lopez', 'Ben King'].map((name, index) => <article key={name}><span>{name}</span><strong>{[98, 93, 88][index]}%</strong></article>)}</section>
        </div>
      </div>
      )}
    </DashboardShell>
  )
}
