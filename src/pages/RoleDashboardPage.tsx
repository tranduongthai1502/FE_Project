import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { adminApi } from '../features/admin/services/adminApi'

type RoleDashboardPageProps = {
  role: 'superAdmin' | 'tenantAdmin' | 'hr' | 'interviewer'
  onLogout: () => void
}

type StoredUser = {
  full_name?: string | null
  fullName?: string | null
  name?: string | null
  email?: string | null
  avatar?: string | null
  user_role?: string | null
  type?: string | null
}

type CreateTenantForm = {
  companyName: string
  subscriptionPlan: string
  domain: string
  adminFullName: string
  adminEmail: string
}

function getStoredUser(): StoredUser | null {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

function getDisplayName(user: StoredUser | null) {
  return user?.full_name || user?.fullName || user?.name || user?.email || 'Alex Thompson'
}

function DashboardShell({
  children,
  navItems,
  subtitle,
  onLogout,
  showWorkspaceSwitcher = false,
}: {
  children: ReactNode
  navItems: Array<{ icon: string; label: string; active?: boolean; onClick?: () => void }>
  subtitle: string
  onLogout: () => void
  showWorkspaceSwitcher?: boolean
}) {
  const user = useMemo(() => getStoredUser(), [])
  const displayName = getDisplayName(user)

  return (
    <main className="role-page">
      <aside className="role-sidebar">
        <div className="role-brand">
          <strong>JobFusion</strong>
          <span>AI Talent Suite</span>
        </div>
        <nav className="role-nav" aria-label={`${subtitle} navigation`}>
          {navItems.map((item) => (
            <button key={item.label} type="button" className={item.active ? 'active' : ''} onClick={item.onClick}>
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="role-main">
        <header className="role-topbar">
          <div className="role-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="search" placeholder="Search candidates, skills, or locations..." aria-label="Search" />
          </div>
          {showWorkspaceSwitcher && <button type="button" className="role-switcher">Workspace Switcher</button>}
          <div className="role-icons">
            <i className="fa-regular fa-bell"></i>
            <i className="fa-regular fa-circle-question"></i>
          </div>
          <button type="button" className="role-user" onClick={onLogout} aria-label="Log out">
            <span>{displayName}</span>
            {user?.avatar ? <img src={user.avatar} alt="" /> : <i className="fa-solid fa-user"></i>}
          </button>
        </header>
        {children}
      </section>
    </main>
  )
}

const tenantNav = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', active: true },
  { icon: 'fa-users-gear', label: 'Staff Management' },
  { icon: 'fa-chart-line', label: 'Analytics' },
  { icon: 'fa-gear', label: 'Settings' },
]

const superNav = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', view: 'dashboard' },
  { icon: 'fa-building-user', label: 'Tenant Management', view: 'tenantManagement' },
  { icon: 'fa-money-check-dollar', label: 'Subscription Plans', view: 'subscriptionPlans' },
  { icon: 'fa-briefcase', label: 'Prompt Management', view: 'promptManagement' },
  { icon: 'fa-gear', label: 'Settings', view: 'settings' },
]

const hrNav = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', active: true },
  { icon: 'fa-briefcase', label: 'Jobs' },
  { icon: 'fa-users', label: 'Candidates' },
  { icon: 'fa-envelope', label: 'Email Management' },
  { icon: 'fa-calendar-check', label: 'Interviews' },
  { icon: 'fa-chart-simple', label: 'Analytics' },
  { icon: 'fa-gear', label: 'Settings' },
]

const interviewerNav = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', active: true },
  { icon: 'fa-calendar-day', label: 'My Interviews' },
  { icon: 'fa-users', label: 'Candidates' },
  { icon: 'fa-rectangle-list', label: 'Interview Detail' },
  { icon: 'fa-gear', label: 'Settings' },
]

function MetricCard({ icon, label, value, note }: { icon: string; label: string; value: string; note?: string }) {
  return (
    <article className="role-metric">
      <span><i className={`fa-solid ${icon}`}></i></span>
      <small>{label}</small>
      <strong>{value}</strong>
      {note && <em>{note}</em>}
    </article>
  )
}

function CreateTenantModal({
  form,
  error,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  form: CreateTenantForm
  error: string
  isSubmitting: boolean
  onChange: (field: keyof CreateTenantForm, value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="tenant-modal-backdrop" role="presentation">
      <section className="tenant-modal" role="dialog" aria-modal="true" aria-labelledby="create-tenant-title">
        <header className="tenant-modal-header">
          <div>
            <h2 id="create-tenant-title">Create New Tenant</h2>
            <p>Configure a new instance for your recruitment partner.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close create tenant modal">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>

        <form className="tenant-create-form" onSubmit={onSubmit}>
          <div className="tenant-form-grid">
            <label>
              <span>Company Name</span>
              <input
                value={form.companyName}
                onChange={(event) => onChange('companyName', event.target.value)}
                placeholder="e.g. Acme Corp"
                required
              />
            </label>

            <label>
              <span>Subscription Plan</span>
              <select value={form.subscriptionPlan} onChange={(event) => onChange('subscriptionPlan', event.target.value)}>
                <option value="professional">Professional - $499/mo</option>
                <option value="enterprise">Enterprise - Custom</option>
                <option value="growth">Growth - $299/mo</option>
                <option value="starter">Starter - $99/mo</option>
              </select>
            </label>

            <label className="tenant-domain-field">
              <span>Domain / Identifier</span>
              <div>
                <input
                  value={form.domain}
                  onChange={(event) => onChange('domain', event.target.value)}
                  placeholder="acme"
                  required
                />
                <small>.jobfusion.ai</small>
              </div>
            </label>
          </div>

          <hr />
          <h3>Tenant Administrator</h3>

          <div className="tenant-form-grid admin">
            <label>
              <span>Admin Full Name</span>
              <input
                value={form.adminFullName}
                onChange={(event) => onChange('adminFullName', event.target.value)}
                placeholder="Jane Doe"
                required
              />
            </label>

            <label>
              <span>Admin Email</span>
              <input
                value={form.adminEmail}
                onChange={(event) => onChange('adminEmail', event.target.value)}
                placeholder="jane@company.com"
                type="email"
                required
              />
            </label>
          </div>

          {error && <p className="tenant-modal-error">{error}</p>}

          <footer className="tenant-modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Confirm'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function AccountSettingsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="role-content account-settings-content">
      <button type="button" className="settings-back-btn" onClick={onBack}>
        <i className="fa-solid fa-arrow-left"></i>
        Back to Home
      </button>
      <h1>Account Settings</h1>

      <div className="settings-layout">
        <aside className="settings-tabs-card">
          <small>Security Tabs</small>
          <button type="button">
            <i className="fa-regular fa-user"></i>
            Profile Information
          </button>
          <button type="button" className="active">
            <i className="fa-solid fa-lock"></i>
            Change Password
          </button>
        </aside>

        <section className="settings-password-card">
          <button type="button" className="settings-close-btn" onClick={onBack} aria-label="Close settings">
            <i className="fa-solid fa-xmark"></i>
          </button>
          <header>
            <h2>Change Password</h2>
            <p>Update your account password to maintain security. We recommend using a unique password you don&apos;t use elsewhere.</p>
          </header>

          <form className="settings-password-form" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="settings-current-password">Current Password <span>*</span></label>
            <div className="settings-password-input">
              <input id="settings-current-password" type="password" placeholder="Enter current password" />
              <i className="fa-regular fa-eye"></i>
            </div>

            <label htmlFor="settings-new-password">New Password <span>*</span></label>
            <div className="settings-password-input">
              <input id="settings-new-password" type="password" placeholder="Enter at least 8 characters" />
              <i className="fa-regular fa-eye"></i>
            </div>
            <div className="settings-strength-row">
              <small>Password Strength</small>
              <strong>Weak</strong>
            </div>
            <span className="settings-strength-track"><span /></span>
            <p>Hint: At least 8 character, use mixed case, numbers, and symbols.</p>

            <label htmlFor="settings-confirm-password">Confirm New Password <span>*</span></label>
            <div className="settings-password-input">
              <input id="settings-confirm-password" type="password" placeholder="Re-type your new password" />
              <i className="fa-regular fa-eye"></i>
            </div>

            <footer>
              <button type="button" className="settings-cancel-btn" onClick={onBack}>Cancel</button>
              <button type="submit" className="settings-save-btn">Save Changes</button>
            </footer>
          </form>
        </section>
      </div>

      <footer className="settings-page-footer">
        <div>
          <strong>JobFusion AI</strong>
          <span>(c) 2024 JobFusion AI. All rights reserved.</span>
        </div>
        <nav>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#help">Help Center</a>
        </nav>
      </footer>
    </div>
  )
}

type SuperAdminView = 'dashboard' | 'tenantManagement' | 'subscriptionPlans' | 'promptManagement' | 'settings'
const superAdminViewSlugs: Record<SuperAdminView, string> = {
  dashboard: 'dashboard',
  tenantManagement: 'tenant-management',
  subscriptionPlans: 'subscription-plans',
  promptManagement: 'prompt-management',
  settings: 'settings',
}

function getInitialSuperAdminView(): SuperAdminView {
  const slug = window.location.pathname.replace(/^\/super-admin\/?/, '') || 'dashboard'
  const match = Object.entries(superAdminViewSlugs).find(([, value]) => value === slug)

  return (match?.[0] as SuperAdminView | undefined) || 'dashboard'
}

function updateSuperAdminViewUrl(view: SuperAdminView) {
  window.history.pushState(null, '', `/super-admin/${superAdminViewSlugs[view]}`)
}

type RoleHomeView = 'dashboard' | 'settings'

function getRoleHomeNav(
  navItems: Array<{ icon: string; label: string }>,
  activeView: RoleHomeView,
  setActiveView: (view: RoleHomeView) => void,
) {
  return navItems.map((item) => ({
    icon: item.icon,
    label: item.label,
    active: item.label === 'Settings' ? activeView === 'settings' : item.label === 'Dashboard' && activeView === 'dashboard',
    onClick: item.label === 'Settings'
      ? () => setActiveView('settings')
      : item.label === 'Dashboard'
        ? () => setActiveView('dashboard')
        : undefined,
  }))
}

function TenantAdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeView, setActiveView] = useState<RoleHomeView>('dashboard')
  const navItems = getRoleHomeNav(tenantNav, activeView, setActiveView)

  return (
    <DashboardShell navItems={navItems} subtitle="Tenant Admin" onLogout={onLogout}>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => setActiveView('dashboard')} />
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

function TenantManagementView() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false)
  const [tenantError, setTenantError] = useState('')
  const [tenantForm, setTenantForm] = useState<CreateTenantForm>({
    companyName: '',
    subscriptionPlan: 'professional',
    domain: '',
    adminFullName: '',
    adminEmail: '',
  })

  const updateTenantForm = (field: keyof CreateTenantForm, value: string) => {
    setTenantError('')
    setTenantForm((current) => ({ ...current, [field]: value }))
  }

  const closeCreateModal = () => {
    if (isSubmittingTenant) return
    setIsCreateModalOpen(false)
    setTenantError('')
  }

  const handleCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTenantError('')
    setIsSubmittingTenant(true)

    try {
      await adminApi.createTenant(tenantForm)
      setTenantForm({
        companyName: '',
        subscriptionPlan: 'professional',
        domain: '',
        adminFullName: '',
        adminEmail: '',
      })
      setIsCreateModalOpen(false)
    } catch (error) {
      setTenantError(error instanceof Error ? error.message : 'Create tenant failed')
    } finally {
      setIsSubmittingTenant(false)
    }
  }

  return (
    <div className="role-content tenant-management-content">
      <div className="tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Tenant Management</strong>
      </div>

      <section className="tenant-filter-card">
        <div className="tenant-filter-tabs">
          <button type="button" className="active">All Tenants</button>
          <button type="button">Active</button>
          <button type="button">Inactive</button>
          <button type="button">Filter by Plan</button>
        </div>
        <div className="tenant-filter-search">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input type="search" value="Xingqiu" readOnly aria-label="Tenant search" />
        </div>
        <button type="button" className="tenant-create-btn" onClick={() => setIsCreateModalOpen(true)}>
          Create New Tenant
        </button>
      </section>

      <div className="role-metrics tenant-management-metrics">
        <MetricCard icon="fa-arrow-trend-up" label="Total Revenue" value="$124.5k" />
        <MetricCard icon="fa-building" label="Active Tenants" value="1,204" />
        <MetricCard icon="fa-circle-notch" label="Average Usage" value="68.2%" />
        <MetricCard icon="fa-triangle-exclamation" label="Churn Rate" value="0.8%" />
      </div>

      <section className="tenant-empty-state">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <strong>No tenants found.</strong>
      </section>

      {isCreateModalOpen && (
        <CreateTenantModal
          form={tenantForm}
          error={tenantError}
          isSubmitting={isSubmittingTenant}
          onChange={updateTenantForm}
          onClose={closeCreateModal}
          onSubmit={handleCreateTenant}
        />
      )}
    </div>
  )
}

function SubscriptionPlansView() {
  return (
    <div className="role-content subscription-plans-content">
      <div className="tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Subscription Plans</strong>
      </div>

      <div className="subscription-title-row">
        <div>
          <h1>Subscription Plans</h1>
          <p>Manage tier configurations and global recruitment limits for platform customers.</p>
        </div>
        <button type="button">Create New Plan</button>
      </div>

      <div className="role-metrics subscription-plan-metrics">
        <article className="role-metric subscription-plan-card">
          <small>Active Plans</small>
          <strong>12</strong>
          <em><i className="fa-solid fa-arrow-trend-up"></i> +2 this month</em>
        </article>
        <article className="role-metric subscription-plan-card">
          <small>Top Tier</small>
          <strong>Enterprise</strong>
          <p><i className="fa-solid fa-users"></i> 452 Subscribers</p>
        </article>
        <article className="role-metric subscription-plan-card">
          <small>Avg. Revenue/Plan</small>
          <strong>$428</strong>
          <p><i className="fa-solid fa-wand-magic-sparkles"></i> Tier Optimization: High</p>
        </article>
        <article className="role-metric subscription-plan-card recommendation">
          <small>AI Recommendation</small>
          <p>Adjust Starter pricing for better conversion.</p>
          <a href="#insights">View insights <i className="fa-solid fa-arrow-right"></i></a>
        </article>
      </div>

      <section className="tenant-empty-state subscription-empty-state">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <strong>No subscription plans found.</strong>
      </section>
    </div>
  )
}

function PromptManagementView() {
  const prompts = [
    ['JD Generator', 'Structural role description creator', 'Recruitment Module', 'Today, 09:42 AM', 'Active'],
    ['AI CV Parsing', 'JSON extraction from PDF/Docx', 'Talent Module', 'Yesterday, 4:15 PM', 'Active'],
    ['Chatbot Screening', 'Initial candidate engagement flow', 'Interview Module', '2 days ago', 'Inactive'],
    ['DSS Analytics', 'Decision Support System Scoring', 'Analytics Module', '3 weeks ago', 'Active'],
    ['Priority Support', 'Priority Support really joelman', 'Priority Module', '4 weeks ago', 'Active'],
  ]

  return (
    <div className="role-content prompt-management-content">
      <div className="tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Prompt Management</strong>
      </div>

      <div className="subscription-title-row prompt-title-row">
        <div>
          <h1>Prompt Management</h1>
          <p>Configure and optimize core AI instructions across the platform.</p>
        </div>
        <button type="button">Create New Prompt</button>
      </div>

      <div className="role-metrics prompt-management-metrics">
        <article className="role-metric prompt-summary-card">
          <span><i className="fa-solid fa-code-branch"></i></span>
          <em>Updated 2h ago</em>
          <small>Total Prompts</small>
          <strong>08</strong>
        </article>
        <article className="role-metric prompt-summary-card system-health-card">
          <span><i className="fa-solid fa-shield-halved"></i></span>
          <i className="fa-solid fa-ellipsis"></i>
          <small>System Health</small>
          <div><strong>6</strong> Optimal <strong>2</strong> Review</div>
        </article>
        <article className="role-metric prompt-summary-card latency-card">
          <span><i className="fa-solid fa-gauge-high"></i></span>
          <small>Global Latency</small>
          <strong>184ms</strong>
          <i className="latency-line" aria-hidden="true"></i>
        </article>
      </div>

      <section className="prompt-table-card">
        <div className="prompt-table-row prompt-table-head">
          <span>Prompt Name</span>
          <span>Associated AI Feature</span>
          <span>Module</span>
          <span>Last Modified Date</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {prompts.map(([name, feature, module, date, status]) => (
          <div className="prompt-table-row" key={name}>
            <strong>{name}</strong>
            <span>{feature}</span>
            <span>{module}</span>
            <span>{date}</span>
            <em className={status === 'Active' ? 'active' : 'inactive'}>{status}</em>
            <button type="button" aria-label={`Edit ${name}`}><i className="fa-regular fa-pen-to-square"></i></button>
          </div>
        ))}
        <footer>
          <span>Showing 5 of 8 prompt</span>
          <div><button type="button"><i className="fa-solid fa-chevron-left"></i></button><button type="button" className="active">1</button><button type="button">2</button><button type="button"><i className="fa-solid fa-chevron-right"></i></button></div>
        </footer>
      </section>

      <div className="prompt-sync-footer">
        <span><i className="fa-solid fa-rotate"></i> Global AI nodes are synchronizing changes...</span>
        <span>Match Accuracy: 98.4%</span>
      </div>
    </div>
  )
}

function SuperAdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeView, setActiveView] = useState<SuperAdminView>(() => getInitialSuperAdminView())

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getInitialSuperAdminView())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const selectView = (view: SuperAdminView) => {
    setActiveView(view)
    updateSuperAdminViewUrl(view)
  }
  const navItems = superNav.map((item) => ({
    icon: item.icon,
    label: item.label,
    active: item.view === activeView,
    onClick: () => selectView(item.view as SuperAdminView),
  }))

  return (
    <DashboardShell navItems={navItems} subtitle="Super Admin" onLogout={onLogout}>
      {activeView === 'tenantManagement' ? (
        <TenantManagementView />
      ) : activeView === 'subscriptionPlans' ? (
        <SubscriptionPlansView />
      ) : activeView === 'promptManagement' ? (
        <PromptManagementView />
      ) : activeView === 'settings' ? (
        <AccountSettingsView onBack={() => selectView('dashboard')} />
      ) : (
        <div className="role-content">
        <div className="role-metrics four">
          <MetricCard icon="fa-building" label="Total Tenants" value="1,204" note="+4.2%" />
          <MetricCard icon="fa-bolt" label="Active Tenants" value="1,180" note="+2.1%" />
          <MetricCard icon="fa-money-bill-trend-up" label="Monthly Recurring Revenue" value="$124,500" note="+22k" />
          <MetricCard icon="fa-triangle-exclamation" label="Tenants expiring within 30 days" value="12" />
        </div>
        <div className="role-grid super-grid">
          <section className="role-panel tenant-table">
            <div className="role-panel-head"><h2>Recent Tenants</h2><a href="#tenants">View All</a></div>
            {['Velocity AI', 'Quanto Recruits', 'GreenGrid Solar', 'Nexus Media', 'TechFlow'].map((name, index) => (
              <article key={name}>
                <strong>{name}</strong><span>{index % 2 ? 'PRO PLAN' : 'ENTERPRISE'}</span><em>{index === 4 ? 'Inactive' : 'Active'}</em>
                <i className="fa-regular fa-eye"></i><i className="fa-regular fa-trash-can"></i>
              </article>
            ))}
          </section>
          <section className="role-panel plan-bars">
            <h2>Tenants by Plan</h2>
            {['Enterprise', 'Pro', 'Basic', 'Free'].map((label, index) => (
              <div className="bar-row" key={label}><span>{label}</span><strong>{[245, 482, 312, 165][index]}</strong><i style={{ width: `${[38, 68, 45, 22][index]}%` }} /></div>
            ))}
            <div className="quick-actions"><button>Manage Subscriptions</button><button>Create New Tenant</button><button>Edit System Prompts</button></div>
          </section>
          <section className="role-panel prompt-panel">
            <div className="role-panel-head"><h2>System Prompts Status</h2><small>Update: 2h ago</small></div>
            {['JD Generator', 'DSS Analytics', 'CV Parsing Engine'].map((name, index) => (
              <article key={name}><strong>{name}</strong><span>{index === 1 ? 'Stale Pipeline' : 'Optimal'}</span><button>{index === 1 ? 'Update Now' : 'Edit'}</button></article>
            ))}
          </section>
          <section className="role-panel activity-panel">
            <h2>Platform Activity (24h)</h2>
            <div className="activity-grid"><span>Staff Accounts <strong>4,120</strong></span><span>CVs Processed <strong>124,582</strong></span><span>Job Postings <strong>12,402</strong></span><span>Emails Sent <strong>892,110</strong></span></div>
            <footer>System Healthy: Global AWS Load 14%</footer>
          </section>
        </div>
      </div>
      )}
    </DashboardShell>
  )
}

function HrDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeView, setActiveView] = useState<RoleHomeView>('dashboard')
  const navItems = getRoleHomeNav(hrNav, activeView, setActiveView)

  return (
    <DashboardShell navItems={navItems} subtitle="HR" onLogout={onLogout} showWorkspaceSwitcher>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => setActiveView('dashboard')} />
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

function InterviewerDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeView, setActiveView] = useState<RoleHomeView>('dashboard')
  const navItems = getRoleHomeNav(interviewerNav, activeView, setActiveView)

  return (
    <DashboardShell navItems={navItems} subtitle="Interviewer" onLogout={onLogout} showWorkspaceSwitcher>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => setActiveView('dashboard')} />
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

export function RoleDashboardPage({ role, onLogout }: RoleDashboardPageProps) {
  if (role === 'superAdmin') return <SuperAdminDashboard onLogout={onLogout} />
  if (role === 'tenantAdmin') return <TenantAdminDashboard onLogout={onLogout} />
  if (role === 'interviewer') return <InterviewerDashboard onLogout={onLogout} />
  return <HrDashboard onLogout={onLogout} />
}
