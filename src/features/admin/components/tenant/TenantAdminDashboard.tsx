import { useEffect, useState } from 'react'
import { getTenantAdminNav } from '../../data/adminNavigation'
import type { TenantAdminView } from '../../types/admin.types'
import { getInitialTenantAdminView, updateTenantAdminViewUrl } from '../../utils/adminRouteHelpers'
import { AccountSettingsView } from '../shared/AccountSettingsView'
import { DashboardShell } from '../shared/DashboardShell'
import { MetricCard } from '../shared/MetricCard'

function StaffManagementView({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="role-content staff-management-content">
      <div className="tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Staff Management</strong>
      </div>

      <div className="staff-management-head">
        <div>
          <h1>Staff Management</h1>
          <p>Manage your team members and recruitment permissions.</p>
        </div>
        <section className="staff-quota-card">
          <div>
            <span>Staff Accounts</span>
            <strong>8 / 10</strong>
          </div>
          <i aria-hidden="true"><span /></i>
          <small>2 seats available</small>
        </section>
      </div>

      <div className="staff-management-toolbar">
        <label>
          <span>Role</span>
          <select defaultValue="all">
            <option value="all">All Roles</option>
            <option value="hr">HR</option>
            <option value="interviewer">Interviewer</option>
          </select>
        </label>
        <label>
          <span>Status</span>
          <select defaultValue="activated">
            <option value="activated">Activated</option>
            <option value="pending">Pending</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
        <div className="staff-search">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input type="search" placeholder="Search full name or email address..." />
        </div>
        <button type="button" onClick={onCreate}>Create Staff Account</button>
      </div>

      <section className="staff-empty-state">
        <i className="fa-solid fa-user-plus"></i>
        <span><i className="fa-solid fa-briefcase"></i></span>
        <strong>No staff accounts found</strong>
        <p>Click "Create Staff Account" to add your first team member.</p>
      </section>
    </div>
  )
}

function CreateStaffAccountView({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="role-content create-staff-content">
      <div className="tenant-breadcrumb create-staff-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <span>Staff Management</span>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Create New Staff account</strong>
      </div>

      <section className="create-staff-card">
        <header className="create-staff-header">
          <div className="create-staff-title">
            <span><i className="fa-solid fa-user-plus"></i></span>
            <div>
              <h1>Create Staff Account</h1>
              <p>Provision a new user account with specific access roles.</p>
            </div>
          </div>
          <span className="system-status"><i className="fa-solid fa-circle"></i> System Online</span>
        </header>

        <form className="create-staff-form" onSubmit={(event) => { event.preventDefault(); onConfirm() }}>
          <div className="create-staff-grid">
            <fieldset className="staff-fieldset">
              <legend>Identity Details</legend>
              <label>
                <span>Full Name</span>
                <div>
                  <i className="fa-regular fa-user"></i>
                  <input type="text" placeholder="e.g. Sarah Jenkins" required />
                </div>
              </label>
              <label>
                <span>Corporate Email Address</span>
                <div>
                  <i className="fa-regular fa-envelope"></i>
                  <input type="email" placeholder="sarah.j@jobfusion.com" required />
                </div>
              </label>
            </fieldset>

            <fieldset className="staff-fieldset">
              <legend>Access & Permissions</legend>
              <label className="staff-role-option">
                <input type="radio" name="staffRole" value="hr" defaultChecked />
                <span><i className="fa-solid fa-users-gear"></i></span>
                <div>
                  <strong>HR</strong>
                  <small>Full access to candidate sourcing and recruitment management tools.</small>
                </div>
              </label>
              <label className="staff-role-option">
                <input type="radio" name="staffRole" value="interviewer" />
                <span><i className="fa-solid fa-clipboard-check"></i></span>
                <div>
                  <strong>Interviewer</strong>
                  <small>Can view assigned interviews, candidate profiles and submit evaluation feedback.</small>
                </div>
              </label>
            </fieldset>
          </div>

          <div className="staff-automation-note">
            <span><i className="fa-solid fa-wand-magic-sparkles"></i></span>
            <div>
              <strong>Platform Automation Notice</strong>
              <p>Once you confirm, an activation email will be dispatched immediately. The new team member will have <b>48 hours</b> to securely set their password and finalize their profile before the invitation link expires.</p>
            </div>
          </div>

          <footer className="create-staff-actions">
            <small><i className="fa-regular fa-circle-question"></i> Required fields marked with *</small>
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit">Confirm</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export function TenantAdminDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<TenantAdminView>(() => getInitialTenantAdminView())
  const changeView = (view: TenantAdminView) => {
    setActiveView(view)
    updateTenantAdminViewUrl(view)
  }
  const navItems = getTenantAdminNav(activeView, changeView)

  useEffect(() => {
    const handlePopState = () => setActiveView(getInitialTenantAdminView())

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <DashboardShell navItems={navItems} subtitle="Tenant Admin" onLogout={onLogout} onChangePassword={() => changeView('settings')}>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => changeView('dashboard')} triggerToast={triggerToast} />
      ) : activeView === 'staffCreate' ? (
        <CreateStaffAccountView
          onCancel={() => changeView('staffManagement')}
          onConfirm={() => {
            triggerToast?.('Staff account invitation sent successfully.', 'success')
            changeView('staffManagement')
          }}
        />
      ) : activeView === 'staffManagement' ? (
        <StaffManagementView onCreate={() => changeView('staffCreate')} />
      ) : (
      <div className="role-content">
        <div className="role-metrics four">
          <MetricCard icon="fa-briefcase" label="Active Job Postings" value="24" note="+12%" />
          <MetricCard icon="fa-users" label="Total Applicants" value="842" note="+340" />
          <MetricCard icon="fa-clock" label="Time-to-Hire" value="18 Days" note="-3d" />
          <MetricCard icon="fa-calendar-check" label="Interviews Today" value="5" note="Today" />
        </div>

        <div className="role-grid tenant-grid">
          <section className="role-panel funnel-panel">
            <div className="role-panel-head">
              <div>
                <h2>Recruitment Funnel</h2>
                <p>Applicant conversion through hiring stages</p>
              </div>
              <a href="#reports">View Detailed Report <i className="fa-solid fa-arrow-right"></i></a>
            </div>
            {[
              ['Applied', '143', '98%'],
              ['Screening', '89', '65%'],
              ['Shortlisted', '42', '29%'],
              ['Interviewing', '21', '15%'],
              ['Offered', '6', '5%'],
            ].map(([label, value, width]) => (
              <div className="funnel-row" key={label}>
                <div><span>{label}</span><strong>{value}</strong></div>
                <span className="funnel-track"><span style={{ width }} /></span>
              </div>
            ))}
          </section>

          <section className="role-panel quota-panel">
            <div className="role-panel-head"><h2>Staff Quota</h2><small>8 / 10 Seats</small></div>
            <div className="quota-ring"><strong>8/10</strong><span>Used</span></div>
            <p>You have 2 seats available in your current professional plan.</p>
          </section>

          <section className="role-panel interview-list">
            <div className="role-panel-head"><h2>Upcoming Interviews</h2><i className="fa-solid fa-ellipsis-vertical"></i></div>
            {['Sarah Jenkins - Senior DevOps Engineer', 'Marcus Thorne - Product Manager'].map((item, index) => (
              <article key={item}>
                <span className="role-avatar">{index === 0 ? 'SJ' : 'MT'}</span>
                <div><strong>{item}</strong><small>Interviewer: {index === 0 ? 'David Chen' : 'Elena Rodriguez'}</small></div>
                <em>{index === 0 ? '10:00 AM' : '02:30 PM'}</em>
              </article>
            ))}
          </section>

          <section className="role-panel plan-panel">
            <small>Active Plan</small>
            <h2>Professional</h2>
            <p>Full AI-Assisted Recruitment Suite</p>
            <button type="button">Manage</button>
          </section>

          <section className="role-panel insights-panel">
            <h2><i className="fa-solid fa-wand-magic-sparkles"></i> AI Insights (DSS)</h2>
            <div className="tag-list"><span>Cloud Architecture</span><span>Go Lang</span><span>Data Security</span></div>
            <div className="insight-row"><span>Senior DevOps Engineer</span><strong>43 Days Open</strong></div>
            <div className="insight-row"><span>ML Ops Specialist</span><strong>31 Days Open</strong></div>
            <button type="button">View full AI report <i className="fa-solid fa-arrow-up-right-from-square"></i></button>
          </section>
        </div>
      </div>
      )}
    </DashboardShell>
  )
}


