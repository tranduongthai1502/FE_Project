import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { CandidateChangePasswordView } from './CandidatePortalPage'
import { adminApi, type CreatePlanPayload, type SubscriptionPlan, type Tenant } from '../features/admin/services/adminApi'

type RoleDashboardPageProps = {
  role: 'superAdmin' | 'tenantAdmin' | 'hr' | 'interviewer'
  onLogout: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

type StoredUser = {
  full_name?: string | null
  fullName?: string | null
  name?: string | null
  email?: string | null
  avatar?: string | null
  role?: string | null
  userRole?: string | null
  user_role?: string | null
  type?: string | null
}

type CreateTenantForm = {
  companyName: string
  domain: string
  planId: string
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

function getUserInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'U'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

function DashboardShell({
  children,
  navItems,
  subtitle,
  onLogout,
  onChangePassword,
  showWorkspaceSwitcher = false,
  searchPlaceholder = 'Search candidates, skills, or locations...',
  className = '',
}: {
  children: ReactNode
  navItems: Array<{ icon: string; label: string; active?: boolean; onClick?: () => void }>
  subtitle: string
  onLogout: () => void
  onChangePassword?: () => void
  showWorkspaceSwitcher?: boolean
  searchPlaceholder?: string
  className?: string
}) {
  const user = useMemo(() => getStoredUser(), [])
  const displayName = getDisplayName(user)
  const userInitials = getUserInitials(displayName)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChangePassword = () => {
    onChangePassword?.()
    setIsUserDropdownOpen(false)
  }

  const handleLogout = () => {
    setIsUserDropdownOpen(false)
    onLogout()
  }

  return (
    <main className={`role-page ${isSidebarVisible ? '' : 'is-sidebar-hidden'} ${className}`.trim()}>
      <aside className={`role-sidebar ${isSidebarVisible ? 'is-open' : ''}`}>
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
          <button
            type="button"
            className={`role-sidebar-trigger ${isSidebarVisible ? 'is-open' : ''}`}
            aria-label={isSidebarVisible ? 'Hide navigation sidebar' : 'Show navigation sidebar'}
            aria-expanded={isSidebarVisible}
            onClick={() => setIsSidebarVisible((value) => !value)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {isSidebarVisible ? 'arrow_menu_close' : 'arrow_menu_open'}
            </span>
          </button>

          <div className="role-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="search" placeholder={searchPlaceholder} aria-label="Search" />
          </div>
          {showWorkspaceSwitcher && <button type="button" className="role-switcher">Workspace Switcher</button>}
          <div className="role-icons">
            <i className="fa-regular fa-bell"></i>
            <i className="fa-regular fa-circle-question"></i>
          </div>
          <div className="role-user-menu-container" ref={userDropdownRef}>
            <button
              type="button"
              className={`role-user ${isUserDropdownOpen ? 'is-open' : ''}`}
              onClick={() => setIsUserDropdownOpen((value) => !value)}
              aria-label="User menu"
              aria-expanded={isUserDropdownOpen}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                <span className="role-user-avatar">{userInitials}</span>
              )}
              <span>{displayName}</span>
              <i className={`fa-solid fa-chevron-down role-user-chevron ${isUserDropdownOpen ? 'open' : ''}`}></i>
            </button>

            {isUserDropdownOpen && (
              <div className="role-user-dropdown" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="role-user-dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                  <i className="fa-solid fa-user-group"></i>
                  <span>Profile</span>
                </button>
                <button type="button" className="role-user-dropdown-item" onClick={handleChangePassword}>
                  <i className="fa-solid fa-lock"></i>
                  <span>Change password</span>
                </button>
                <button type="button" className="role-user-dropdown-item logout" onClick={handleLogout}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
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

function CreateTenantPage({
  form,
  error,
  plans,
  isLoadingPlans,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  form: CreateTenantForm
  error: string
  plans: SubscriptionPlan[]
  isLoadingPlans: boolean
  isSubmitting: boolean
  onChange: (field: keyof CreateTenantForm, value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="role-content create-tenant-content">
      <div className="tenant-breadcrumb create-tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <span>Tenant Management</span>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Create New Tenant</strong>
      </div>

      <section className="tenant-modal create-tenant-card" aria-labelledby="create-tenant-title">
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
              <select
                value={form.planId}
                onChange={(event) => onChange('planId', event.target.value)}
                disabled={isLoadingPlans || isSubmitting}
                required
              >
                <option value="">{isLoadingPlans ? 'Loading plans...' : 'Select a plan'}</option>
                {plans.map((plan) => (
                  <option value={plan.id} key={plan.id}>
                    {plan.priceLabel ? `${plan.name} - ${plan.priceLabel}` : plan.name}
                  </option>
                ))}
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

function AccountSettingsView({ onBack, triggerToast }: { onBack: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  return <CandidateChangePasswordView onBack={onBack} triggerToast={triggerToast} />
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
  const match = Object.entries(superAdminViewSlugs).find(([, value]) => slug === value || slug.startsWith(`${value}/`))

  return (match?.[0] as SuperAdminView | undefined) || 'dashboard'
}

function updateSuperAdminViewUrl(view: SuperAdminView) {
  window.history.pushState(null, '', `/super-admin/${superAdminViewSlugs[view]}`)
}

function getTenantDetailIdFromUrl() {
  const match = window.location.pathname.match(/^\/super-admin\/tenant-management\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : ''
}

function updateTenantDetailUrl(tenantId: string) {
  window.history.pushState(null, '', `/super-admin/tenant-management/${encodeURIComponent(tenantId)}`)
}

type RoleHomeView = 'dashboard' | 'settings'
type TenantAdminView = RoleHomeView | 'staffManagement'

function getRoleHomeNav(
  navItems: Array<{ icon: string; label: string }>,
  activeView: RoleHomeView | TenantAdminView,
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

function getTenantAdminNav(activeView: TenantAdminView, setActiveView: (view: TenantAdminView) => void) {
  return tenantNav.map((item) => ({
    icon: item.icon,
    label: item.label,
    active:
      (item.label === 'Dashboard' && activeView === 'dashboard') ||
      (item.label === 'Staff Management' && activeView === 'staffManagement') ||
      (item.label === 'Settings' && activeView === 'settings'),
    onClick: item.label === 'Staff Management'
      ? () => setActiveView('staffManagement')
      : item.label === 'Settings'
        ? () => setActiveView('settings')
        : item.label === 'Dashboard'
          ? () => setActiveView('dashboard')
          : undefined,
  }))
}

function StaffManagementView() {
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
        <button type="button">Create Staff Account</button>
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

function TenantAdminDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<TenantAdminView>('dashboard')
  const navItems = getTenantAdminNav(activeView, setActiveView)

  return (
    <DashboardShell navItems={navItems} subtitle="Tenant Admin" onLogout={onLogout} onChangePassword={() => setActiveView('settings')}>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => setActiveView('dashboard')} triggerToast={triggerToast} />
      ) : activeView === 'staffManagement' ? (
        <StaffManagementView />
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

function ConfirmActionModal({
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="tenant-confirm-backdrop" role="presentation">
      <section className="tenant-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="tenant-confirm-title">
        <header>
          <h2 id="tenant-confirm-title">Confirm Action</h2>
          <button type="button" onClick={onCancel} aria-label="Close confirm dialog" disabled={isSubmitting}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>
        <p>Are you sure you want to proceed? This action will trigger the next step in the recruitment workflow. Your changes will not be saved.</p>
        <footer>
          <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isSubmitting}>{isSubmitting ? 'Confirming...' : 'Confirm'}</button>
        </footer>
      </section>
    </div>
  )
}

function TenantManagementView({ triggerToast }: { triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<'list' | 'detail'>(() => (
    getTenantDetailIdFromUrl() ? 'detail' : 'list'
  ))
  const [selectedTenantId, setSelectedTenantId] = useState(() => getTenantDetailIdFromUrl())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false)
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [tenantError, setTenantError] = useState('')
  const [tenantListError, setTenantListError] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [refreshTenantsKey, setRefreshTenantsKey] = useState(0)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [tenantForm, setTenantForm] = useState<CreateTenantForm>({
    companyName: '',
    domain: '',
    planId: '',
    adminFullName: '',
    adminEmail: '',
  })

  useEffect(() => {
    let isActive = true
    setIsLoadingTenants(true)
    setTenantListError('')

    adminApi.getTenants()
      .then((items) => {
        if (isActive) {
          setTenants(items)
        }
      })
      .catch((error) => {
        if (isActive) {
          setTenantListError(error instanceof Error ? error.message : 'Load tenants failed')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingTenants(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [refreshTenantsKey])

  useEffect(() => {
    let isActive = true
    setIsLoadingPlans(true)

    adminApi.getSubscriptionPlans()
      .then((plans) => {
        if (isActive) {
          setSubscriptionPlans(plans)
        }
      })
      .catch(() => {
        if (isActive) {
          setSubscriptionPlans([])
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPlans(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!isCreateModalOpen || subscriptionPlans.length > 0) return

    let isActive = true
    setIsLoadingPlans(true)
    setTenantError('')

    adminApi.getSubscriptionPlans()
      .then((plans) => {
        if (!isActive) return
        setSubscriptionPlans(plans)
        setTenantForm((current) => ({
          ...current,
          planId: current.planId || plans[0]?.id || '',
        }))
        if (plans.length === 0) {
          setTenantError('No subscription plans found.')
        }
      })
      .catch((error) => {
        if (!isActive) return
        setTenantError(error instanceof Error ? error.message : 'Load subscription plans failed')
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPlans(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isCreateModalOpen, subscriptionPlans.length])

  useEffect(() => {
    const handlePopState = () => {
      const tenantId = getTenantDetailIdFromUrl()
      setSelectedTenantId(tenantId)
      setActiveView(tenantId ? 'detail' : 'list')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const updateTenantForm = (field: keyof CreateTenantForm, value: string) => {
    setTenantError('')
    setTenantForm((current) => ({ ...current, [field]: value }))
  }

  const closeCreateModal = () => {
    if (isSubmittingTenant) return
    setIsCreateModalOpen(false)
    setIsCreateConfirmOpen(false)
    setTenantError('')
  }

  const handleCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTenantError('')

    if (!tenantForm.planId) {
      setTenantError('Please select a subscription plan.')
      return
    }

    setIsCreateConfirmOpen(true)
  }

  const confirmCreateTenant = async () => {
    setIsSubmittingTenant(true)

    try {
      await adminApi.createTenant(tenantForm)
      setTenantForm({
        companyName: '',
        domain: '',
        planId: '',
        adminFullName: '',
        adminEmail: '',
      })
      setIsCreateModalOpen(false)
      setIsCreateConfirmOpen(false)
      setRefreshTenantsKey((value) => value + 1)
      triggerToast?.('Tenant create successfully. Activation email send to Tenant Admin', 'success')
    } catch (error) {
      setIsCreateConfirmOpen(false)
      setTenantError(error instanceof Error ? error.message : 'Create tenant failed')
      triggerToast?.('Error system. Please try again', 'error')
    } finally {
      setIsSubmittingTenant(false)
    }
  }

  const activeTenantCount = useMemo(() => (
    tenants.filter((tenant) => tenant.status.toLowerCase() === 'active').length
  ), [tenants])
  const inactiveTenantCount = tenants.length - activeTenantCount
  const planById = useMemo(() => (
    new Map(subscriptionPlans.map((plan) => [plan.id, plan]))
  ), [subscriptionPlans])
  const planByName = useMemo(() => (
    new Map(subscriptionPlans.map((plan) => [plan.name.toLowerCase(), plan]))
  ), [subscriptionPlans])
  const totalRevenue = useMemo(() => (
    tenants.reduce((total, tenant) => {
      const plan = tenant.subscriptionPlanId
        ? planById.get(tenant.subscriptionPlanId)
        : planByName.get(tenant.subscriptionPlan.toLowerCase())

      return total + (plan?.monthlyPrice || 0)
    }, 0)
  ), [planById, planByName, tenants])
  const metricsAreLoading = isLoadingTenants || isLoadingPlans
  const getTenantPlan = (tenant: Tenant) => (
    tenant.subscriptionPlanId
      ? planById.get(tenant.subscriptionPlanId)
      : planByName.get(tenant.subscriptionPlan.toLowerCase())
  )
  const openTenantDetail = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    setActiveView('detail')
    updateTenantDetailUrl(tenantId)
  }
  const closeTenantDetail = () => {
    setSelectedTenantId('')
    setActiveView('list')
    updateSuperAdminViewUrl('tenantManagement')
  }

  if (isCreateModalOpen) {
    return (
      <>
        <CreateTenantPage
          form={tenantForm}
          error={tenantError}
          plans={subscriptionPlans}
          isLoadingPlans={isLoadingPlans}
          isSubmitting={isSubmittingTenant}
          onChange={updateTenantForm}
          onClose={closeCreateModal}
          onSubmit={handleCreateTenant}
        />

        {isCreateConfirmOpen && (
          <ConfirmActionModal
            isSubmitting={isSubmittingTenant}
            onCancel={() => {
              if (!isSubmittingTenant) setIsCreateConfirmOpen(false)
            }}
            onConfirm={confirmCreateTenant}
          />
        )}
      </>
    )
  }

  if (activeView === 'detail') {
    const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId)
    const selectedPlan = selectedTenant ? getTenantPlan(selectedTenant) : undefined
    const isActive = selectedTenant?.status.toLowerCase() === 'active'
    const quotaLabel = selectedTenant
      ? selectedTenant.userQuotaLimit > 0
        ? `${selectedTenant.userQuotaUsed}/${selectedTenant.userQuotaLimit}`
        : String(selectedTenant.userQuotaUsed)
      : '-'

    return (
      <div className="role-content tenant-detail-content">
        <div className="tenant-breadcrumb">
          <i className="fa-solid fa-house"></i>
          <span>Home</span>
          <i className="fa-solid fa-chevron-right"></i>
          <button type="button" onClick={closeTenantDetail}>Tenant Management</button>
          <i className="fa-solid fa-chevron-right"></i>
          <strong>Tenant detail</strong>
        </div>

        {isLoadingTenants ? (
          <div className="tenant-list-table-state">Loading tenant details...</div>
        ) : tenantListError ? (
          <div className="tenant-list-table-state error">{tenantListError}</div>
        ) : !selectedTenant ? (
          <div className="tenant-list-table-state">Tenant not found.</div>
        ) : (
          <>
            <div className="tenant-detail-title-row">
              <div>
                <h1>{selectedTenant.name}</h1>
                <em className={isActive ? 'active' : 'inactive'}>{selectedTenant.status}</em>
              </div>
              <button type="button">Deactivate Tenant</button>
            </div>

            <div className="tenant-detail-grid">
              <section className="tenant-detail-card tenant-company-card">
                <header>
                  <span><i className="fa-regular fa-building"></i></span>
                  <h2>Company Information</h2>
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </header>
                <div className="tenant-detail-info-grid">
                  <div><small>Company Name</small><strong>{selectedTenant.name}</strong></div>
                  <div><small>Domain</small><strong>{selectedTenant.id}</strong></div>
                  <div><small>Industry</small><strong>-</strong></div>
                  <div><small>Company Size</small><strong>{quotaLabel} Employees</strong></div>
                  <div><small>Created Date</small><strong>-</strong></div>
                  <div><small>Region</small><strong>-</strong></div>
                </div>
              </section>

              <section className="tenant-detail-empty-card">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <strong>No tenants found.</strong>
              </section>

              <section className="tenant-detail-card tenant-subscription-card">
                <header>
                  <span><i className="fa-regular fa-id-badge"></i></span>
                  <h2>Subscription Plan</h2>
                </header>
                <strong className="tenant-plan-heading">{selectedPlan?.name || selectedTenant.subscriptionPlan || '-'}</strong>
                <small className="tenant-plan-tier">{selectedPlan?.description || '-'}</small>
                <div className="tenant-subscription-metrics">
                  <div><small>Monthly Billing</small><strong>{selectedPlan ? `$${selectedPlan.monthlyPrice.toLocaleString()}` : '-'}</strong></div>
                  <div><small>Days Remaining</small><strong>{selectedTenant.expirationDate}</strong></div>
                </div>
                <div className="tenant-subscription-lines">
                  <span>Start Date <strong>-</strong></span>
                  <span>ExpirationDate <strong>{selectedTenant.expirationDate}</strong></span>
                  <span>Renewal Cycle <strong>Annual</strong></span>
                  <span>Trailing <strong>Enabled</strong></span>
                </div>
              </section>

              <section className="tenant-detail-card tenant-admin-card">
                <header>
                  <span><i className="fa-regular fa-calendar-check"></i></span>
                  <h2>Tenant Admin</h2>
                </header>
                <div className="tenant-admin-layout">
                  <div className="tenant-admin-avatar"><i className="fa-regular fa-user"></i><b /></div>
                  <div><small>Full Name</small><strong>-</strong></div>
                  <div><small>Email Address</small><strong>-</strong></div>
                  <div><small>Current Status</small><em className={isActive ? 'active' : 'inactive'}>{selectedTenant.status}</em></div>
                  <div><small>Activated Date</small><strong>-</strong></div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    )
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
        <MetricCard icon="fa-arrow-trend-up" label="Total Revenue" value={metricsAreLoading ? '...' : `$${totalRevenue.toLocaleString()}`} />
        <MetricCard icon="fa-building" label="Active Tenants" value={isLoadingTenants ? '...' : String(activeTenantCount)} />
        <MetricCard icon="fa-circle-notch" label="Total Tenants" value={isLoadingTenants ? '...' : String(tenants.length)} />
        <MetricCard icon="fa-triangle-exclamation" label="Inactive Tenants" value={isLoadingTenants ? '...' : String(inactiveTenantCount)} />
      </div>

      <section className="tenant-list-table-card">
        <div className="tenant-list-table-row tenant-list-table-head">
          <span>Full Name</span>
          <span>Subscription Plan</span>
          <span>Expiration Date</span>
          <span>User Quota</span>
          <span>Status</span>
          <span>Actions</span>
        </div>



        {isLoadingTenants ? (
          <div className="tenant-list-table-state">Loading tenants...</div>
        ) : tenantListError ? (
          <div className="tenant-list-table-state error">{tenantListError}</div>
        ) : tenants.length === 0 ? (
          <div className="tenant-list-table-state">No tenants found.</div>
        ) : (
          tenants.map((tenant) => {
            const isActive = tenant.status.toLowerCase() === 'active'
            const quotaPercent = tenant.userQuotaLimit > 0
              ? Math.min(100, Math.round((tenant.userQuotaUsed / tenant.userQuotaLimit) * 100))
              : 0

            return (
              <div className="tenant-list-table-row" key={tenant.id}>
                <strong>{tenant.name}</strong>
                <span className="tenant-plan-name">{getTenantPlan(tenant)?.name || tenant.subscriptionPlan || '-'}</span>
                <span>{tenant.expirationDate}</span>
                <span className="tenant-quota">
                  <i><b style={{ width: `${quotaPercent}%` }} /></i>
                  {tenant.userQuotaLimit > 0 ? `${tenant.userQuotaUsed}/${tenant.userQuotaLimit}` : `${tenant.userQuotaUsed}`}
                </span>
                <em className={isActive ? 'active' : 'inactive'}>{isActive ? 'Active' : tenant.status}</em>
                <button type="button" aria-label={`View ${tenant.name}`} onClick={() => openTenantDetail(tenant.id)}>
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M8.75 21.25V16.25L21.25 3.75L26.25 8.75L13.75 21.25H8.75Z" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3.75 26.25H26.25" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.5 7.5L22.5 12.5" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )
          })
        )}

        <footer>
          <span>Showing {tenants.length} Tenant{tenants.length === 1 ? '' : 's'}</span>
          <div>
            <button type="button" disabled><i className="fa-solid fa-chevron-left"></i></button>
            <button type="button" className="active">1</button>
            <button type="button" disabled><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </footer>
      </section>

      {isCreateConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={isSubmittingTenant}
          onCancel={() => {
            if (!isSubmittingTenant) setIsCreateConfirmOpen(false)
          }}
          onConfirm={confirmCreateTenant}
        />
      )}
    </div>
  )
}

const planFeatureDefaults = [
  {
    key: 'aiJdGenerator',
    code: 'AI_JD_GENERATOR',
    icon: 'fa-briefcase-medical',
    title: 'AI JD Generator',
    description: 'Auto-generate job descriptions with AI.',
    enabled: true,
  },
  {
    key: 'aiCvParsing',
    code: 'AI_CV_PARSING',
    icon: 'fa-file-code',
    title: 'AI CV Parsing',
    description: 'Extract data from resumes automatically.',
    enabled: true,
  },
  {
    key: 'chatbotScreening',
    code: 'CHATBOT_SCREENING',
    icon: 'fa-message',
    title: 'Chatbot Screening',
    description: 'Interactive AI screening for candidates.',
    enabled: false,
  },
  {
    key: 'dssAnalytics',
    code: 'DSS_ANALYTICS',
    icon: 'fa-chart-simple',
    title: 'DSS Analytics',
    description: 'Advanced Decision Support System data.',
    enabled: true,
  },
  {
    key: 'prioritySupport',
    code: 'PRIORITY_SUPPORT',
    icon: 'fa-headset',
    title: 'Priority Support',
    description: '24/7 dedicated account manager.',
    enabled: true,
  },
  {
    key: 'customBranding',
    code: 'CUSTOM_BRANDING',
    icon: 'fa-window-maximize',
    title: 'Custom Branding',
    description: 'White-label options for dashboards.',
    enabled: false,
  },
  {
    key: 'apiAccess',
    code: 'API_ACCESS',
    icon: 'fa-arrows-spin',
    title: 'API Access',
    description: 'Full access to JobFusion endpoints.',
    enabled: true,
  },
  {
    key: 'multiRegionSupport',
    code: 'MULTI_REGION_SUPPORT',
    icon: 'fa-earth-americas',
    title: 'Multi-Region Support',
    description: 'Manage hiring across multiple countries.',
    enabled: false,
  },
]

function CreatePlanView({
  onBack,
  onCreated,
  triggerToast,
}: {
  onBack: () => void
  onCreated: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const [planName, setPlanName] = useState('')
  const [description, setDescription] = useState('')
  const [monthlyPrice, setMonthlyPrice] = useState('')
  const [maxStaffAccount, setMaxStaffAccount] = useState('')
  const [maxActiveJobPosting, setMaxActiveJobPosting] = useState('')
  const [features, setFeatures] = useState(planFeatureDefaults)
  const [isStaffUnlimited, setIsStaffUnlimited] = useState(false)
  const [isJobsUnlimited, setIsJobsUnlimited] = useState(false)
  const [planError, setPlanError] = useState('')
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false)

  const toggleFeature = (key: string) => {
    setFeatures((current) => current.map((feature) => (
      feature.key === key ? { ...feature, enabled: !feature.enabled } : feature
    )))
  }

  const handleCreatePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlanError('')
    setIsCreateConfirmOpen(true)
  }

  const confirmCreatePlan = async () => {
    const payload: CreatePlanPayload = {
      "name": planName,
      "description": description,
      "monthlyPrice": Number(monthlyPrice || 0),
      "maxStaffAccount": isStaffUnlimited ? 0 : Number(maxStaffAccount || 0),
      "staffAccountUnlimited": isStaffUnlimited,
      "maxActiveJobPosting": isJobsUnlimited ? 0 : Number(maxActiveJobPosting || 0),
      "activeJobPostingUnlimited": isJobsUnlimited,
      "features": features.map((feature) => ({
        "key": feature.code,
        "status": feature.enabled ? 'ENABLED' : 'DISABLED',
      })),
    }

    setIsSavingPlan(true)
    try {
      await adminApi.createPlan(payload)
      setIsCreateConfirmOpen(false)
      triggerToast?.('Subscription plan saved successfully', 'success')
      onCreated()
    } catch (error) {
      setIsCreateConfirmOpen(false)
      setPlanError(error instanceof Error ? error.message : 'Create plan failed')
      triggerToast?.('Error system. Please try again.', 'error')
    } finally {
      setIsSavingPlan(false)
    }
  }

  return (
    <form className="role-content create-plan-content" onSubmit={handleCreatePlan}>
      <div className="tenant-breadcrumb create-plan-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <span>Subscription Plans</span>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Create New Plan</strong>
      </div>

      <header className="create-plan-title">
        <h1>Create New Plan</h1>
        <p>Configure a new subscription tier and define its features and limitations to match specific enterprise requirements.</p>
      </header>

      <section className="create-plan-card">
        <h2><i className="fa-regular fa-file-lines"></i> Plan Details</h2>
        <div className="create-plan-divider" />

        <div className="create-plan-details-grid">
          <label>
            <span>Plan Name</span>
            <input
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              placeholder="Plan Name"
              maxLength={255}
              required
            />
          </label>

          <label>
            <span>Monthly Price</span>
            <div className="price-input">
              <span>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlyPrice}
                onChange={(event) => setMonthlyPrice(event.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </label>

          <label className="description-field">
            <span>Short Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description,....."
              maxLength={1000}
            />
          </label>

          <div className="limit-fields">
            <label>
              <span>Max Staff Accounts</span>
              <div className="limit-input">
                <input
                  type="number"
                  min="0"
                  value={maxStaffAccount}
                  onChange={(event) => setMaxStaffAccount(event.target.value)}
                  placeholder="0"
                  disabled={isStaffUnlimited}
                />
                <button
                  type="button"
                  className={`mini-toggle ${isStaffUnlimited ? 'active' : ''}`}
                  onClick={() => setIsStaffUnlimited((value) => !value)}
                  aria-pressed={isStaffUnlimited}
                >
                  <span />
                </button>
                <em>Unlimited</em>
              </div>
            </label>

            <label>
              <span>Max Active Job Postings</span>
              <div className="limit-input">
                <input
                  type="number"
                  min="0"
                  value={maxActiveJobPosting}
                  onChange={(event) => setMaxActiveJobPosting(event.target.value)}
                  placeholder="0"
                  disabled={isJobsUnlimited}
                />
                <button
                  type="button"
                  className={`mini-toggle ${isJobsUnlimited ? 'active' : ''}`}
                  onClick={() => setIsJobsUnlimited((value) => !value)}
                  aria-pressed={isJobsUnlimited}
                >
                  <span />
                </button>
                <em>Unlimited</em>
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="create-plan-card">
        <h2><i className="fa-solid fa-wand-magic-sparkles"></i> Feature Permissions</h2>
        <div className="create-plan-divider" />

        <div className="feature-permission-grid">
          {features.map((feature) => (
            <article className="feature-permission-card" key={feature.key}>
              <div className="feature-icon"><i className={`fa-solid ${feature.icon}`}></i></div>
              <button
                type="button"
                className={`feature-toggle ${feature.enabled ? 'active' : ''}`}
                onClick={() => toggleFeature(feature.key)}
                aria-pressed={feature.enabled}
                aria-label={`Toggle ${feature.title}`}
              >
                <span />
              </button>
              <strong>{feature.title}</strong>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      {planError && <p className="create-plan-error">{planError}</p>}

      <footer className="create-plan-actions">
        <button type="button" onClick={onBack} disabled={isSavingPlan}>Cancel</button>
        <button type="submit" disabled={isSavingPlan}>{isSavingPlan ? 'Saving...' : 'Save'}</button>
      </footer>

      {isCreateConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={isSavingPlan}
          onCancel={() => {
            if (!isSavingPlan) setIsCreateConfirmOpen(false)
          }}
          onConfirm={confirmCreatePlan}
        />
      )}
    </form>
  )
}

function getSubscriptionPlanIdFromUrl() {
  const match = window.location.pathname.match(/^\/super-admin\/subscription-plans\/([^/]+)(?:\/edit-detail)?$/)
  return match ? decodeURIComponent(match[1]) : ''
}

function isSubscriptionPlanEditUrl() {
  return /^\/super-admin\/subscription-plans\/[^/]+\/edit-detail$/.test(window.location.pathname)
}

function updateSubscriptionPlanDetailUrl(planId: string) {
  window.history.pushState(null, '', `/super-admin/subscription-plans/${encodeURIComponent(planId)}`)
}

function updateSubscriptionPlanEditUrl(planId: string) {
  window.history.pushState(null, '', `/super-admin/subscription-plans/${encodeURIComponent(planId)}/edit-detail`)
}

function formatPlanDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatFeatureLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getPlanFeatureState(plan?: SubscriptionPlan) {
  const featureStatusByKey = new Map((plan?.features || []).map((feature) => [
    feature.key.toUpperCase(),
    feature.status.toUpperCase(),
  ]))

  return planFeatureDefaults.map((feature) => {
    const status = featureStatusByKey.get(feature.code)
    return {
      ...feature,
      enabled: status ? status === 'ENABLED' : feature.enabled,
    }
  })
}

function EditPlanDetailView({
  plan,
  onBack,
  onSaved,
  triggerToast,
}: {
  plan: SubscriptionPlan
  onBack: () => void
  onSaved: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const [planName, setPlanName] = useState(plan.name)
  const [description, setDescription] = useState(plan.description)
  const [monthlyPrice, setMonthlyPrice] = useState(plan.monthlyPrice.toFixed(2))
  const [maxStaffAccount, setMaxStaffAccount] = useState(String(plan.maxStaffAccount || ''))
  const [maxActiveJobPosting, setMaxActiveJobPosting] = useState(String(plan.maxActiveJobPosting || ''))
  const [features, setFeatures] = useState(() => getPlanFeatureState(plan))
  const [isStaffUnlimited, setIsStaffUnlimited] = useState(plan.staffAccountUnlimited)
  const [isJobsUnlimited, setIsJobsUnlimited] = useState(plan.activeJobPostingUnlimited)
  const [isActive, setIsActive] = useState(plan.status.toLowerCase() === 'active')
  const [planError, setPlanError] = useState('')
  const [isSavingPlan, setIsSavingPlan] = useState(false)

  const toggleFeature = (key: string) => {
    setFeatures((current) => current.map((feature) => (
      feature.key === key ? { ...feature, enabled: !feature.enabled } : feature
    )))
  }

  const handleSavePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlanError('')

    if (!planName.trim() || !monthlyPrice.trim()) {
      setPlanError('Please fill in all required fields.')
      return
    }

    const payload: CreatePlanPayload = {
      "name": planName,
      "description": description,
      "monthlyPrice": Number(monthlyPrice || 0),
      "maxStaffAccount": isStaffUnlimited ? 0 : Number(maxStaffAccount || 0),
      "staffAccountUnlimited": isStaffUnlimited,
      "maxActiveJobPosting": isJobsUnlimited ? 0 : Number(maxActiveJobPosting || 0),
      "activeJobPostingUnlimited": isJobsUnlimited,
      "features": features.map((feature) => ({
        "key": feature.code,
        "status": feature.enabled ? 'ENABLED' : 'DISABLED',
      })),
    }

    setIsSavingPlan(true)
    try {
      await adminApi.updatePlan(plan.id, payload)
      triggerToast?.('Subscription plan updated successfully', 'success')
      onSaved()
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Update plan failed')
      triggerToast?.('Error system. Please try again.', 'error')
    } finally {
      setIsSavingPlan(false)
    }
  }

  return (
    <form className="role-content edit-plan-content" onSubmit={handleSavePlan}>
      <div className="tenant-breadcrumb create-plan-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <button type="button" onClick={onBack}>Subscription Plans</button>
        <i className="fa-solid fa-chevron-right"></i>
        <span>Plan Detail</span>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Edit Plan</strong>
      </div>

      <div className="edit-plan-layout">
        <div className="edit-plan-main">
          <section className="create-plan-card edit-plan-card">
            <h2><i className="fa-solid fa-list-check"></i> General Configuration</h2>
            <div className="create-plan-divider" />
            <div className="edit-plan-general-grid">
              <label>
                <span>Plan Name</span>
                <input value={planName} onChange={(event) => setPlanName(event.target.value)} required />
              </label>
              <label>
                <span>Short Tagline</span>
                <input value={description} onChange={(event) => setDescription(event.target.value)} />
              </label>
              <div className="edit-price-status-row">
                <label>
                  <span>Monthly Price (USD)</span>
                  <div className="price-input">
                    <span>$</span>
                    <input type="number" min="0" step="0.01" value={monthlyPrice} onChange={(event) => setMonthlyPrice(event.target.value)} required />
                  </div>
                </label>
                <button type="button" className={`mini-toggle ${isActive ? 'active' : ''}`} onClick={() => setIsActive((value) => !value)} aria-pressed={isActive}>
                  <span />
                </button>
                <strong>Active Status</strong>
              </div>
            </div>
            {planError && <p className="create-plan-error">{planError}</p>}
          </section>

          <section className="create-plan-card edit-plan-card">
            <h2><i className="fa-solid fa-chart-simple"></i> Resource Limits</h2>
            <div className="create-plan-divider" />
            <div className="edit-resource-list">
              <article>
                <i className="fa-solid fa-id-card-clip"></i>
                <div>
                  <strong>Max Staff Accounts</strong>
                  <p>Number of administrative users allowed</p>
                </div>
                <input type="number" min="0" value={maxStaffAccount} onChange={(event) => setMaxStaffAccount(event.target.value)} disabled={isStaffUnlimited} />
                <button type="button" className={`mini-toggle ${isStaffUnlimited ? 'active' : ''}`} onClick={() => setIsStaffUnlimited((value) => !value)} aria-pressed={isStaffUnlimited}>
                  <span />
                </button>
                <em>Unlimited</em>
              </article>
              <article>
                <i className="fa-solid fa-briefcase"></i>
                <div>
                  <strong>Max Active Job Postings</strong>
                  <p>Concurrent open roles allowed per tenant</p>
                </div>
                <input type="number" min="0" value={maxActiveJobPosting} onChange={(event) => setMaxActiveJobPosting(event.target.value)} disabled={isJobsUnlimited} />
                <button type="button" className={`mini-toggle ${isJobsUnlimited ? 'active' : ''}`} onClick={() => setIsJobsUnlimited((value) => !value)} aria-pressed={isJobsUnlimited}>
                  <span />
                </button>
                <em>Unlimited</em>
              </article>
            </div>
          </section>
        </div>

        <section className="create-plan-card edit-plan-card edit-feature-panel">
          <h2><i className="fa-solid fa-bolt"></i> Plan Features <small>AI ENABLED</small></h2>
          <div className="edit-feature-list">
            {features.map((feature) => (
              <article key={feature.key} className={feature.enabled ? '' : 'disabled'}>
                <span><i className={`fa-solid ${feature.icon}`}></i>{feature.title}</span>
                <button type="button" className={`feature-toggle ${feature.enabled ? 'active' : ''}`} onClick={() => toggleFeature(feature.key)} aria-pressed={feature.enabled} aria-label={`Toggle ${feature.title}`}>
                  <span />
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className="create-plan-actions edit-plan-actions">
        <p><i className="fa-solid fa-circle-info"></i> Last modified by Super Admin on {formatPlanDate(plan.createdAt) || 'Oct 24, 2023'}</p>
        <button type="button" onClick={onBack} disabled={isSavingPlan}>Cancel</button>
        <button type="submit" disabled={isSavingPlan}>{isSavingPlan ? 'Saving...' : 'Save Changes'}</button>
      </footer>
    </form>
  )
}

function SubscriptionPlansView({ triggerToast }: { triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail' | 'edit'>(() => (
    getSubscriptionPlanIdFromUrl() ? (isSubscriptionPlanEditUrl() ? 'edit' : 'detail') : 'list'
  ))
  const [selectedPlanId, setSelectedPlanId] = useState(() => getSubscriptionPlanIdFromUrl())
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [planListError, setPlanListError] = useState('')
  const [refreshPlansKey, setRefreshPlansKey] = useState(0)

  useEffect(() => {
    if (activeView !== 'list' && activeView !== 'detail' && activeView !== 'edit') return

    let isActive = true
    setIsLoadingPlans(true)
    setPlanListError('')

    adminApi.getSubscriptionPlans()
      .then((items) => {
        if (isActive) {
          setPlans(items)
        }
      })
      .catch((error) => {
        if (isActive) {
          setPlanListError(error instanceof Error ? error.message : 'Load subscription plans failed')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPlans(false)
        }
      })

    adminApi.getTenants()
      .then((tenantItems) => {
        if (isActive) {
          setTenants(tenantItems)
        }
      })
      .catch(() => {
        if (isActive) {
          setTenants([])
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView, refreshPlansKey])

  useEffect(() => {
    const handlePopState = () => {
      const planId = getSubscriptionPlanIdFromUrl()
      setSelectedPlanId(planId)
      setActiveView(planId ? (isSubscriptionPlanEditUrl() ? 'edit' : 'detail') : 'list')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const activePlansCount = plans.filter((plan) => plan.status.toLowerCase() === 'active').length
  const topTier = plans.reduce<SubscriptionPlan | null>((current, plan) => (
    !current || plan.monthlyPrice > current.monthlyPrice ? plan : current
  ), null)
  const averageRevenue = plans.length
    ? Math.round(plans.reduce((total, plan) => total + plan.monthlyPrice, 0) / plans.length)
    : 0
  const handlePlanCreated = () => {
    setActiveView('list')
    setSelectedPlanId('')
    updateSuperAdminViewUrl('subscriptionPlans')
    setRefreshPlansKey((value) => value + 1)
  }

  const closePlanDetail = () => {
    setSelectedPlanId('')
    setActiveView('list')
    updateSuperAdminViewUrl('subscriptionPlans')
  }

  const openPlanEdit = (planId: string) => {
    setSelectedPlanId(planId)
    setActiveView('edit')
    updateSubscriptionPlanEditUrl(planId)
  }

  if (activeView === 'create') {
    return <CreatePlanView onBack={() => {
      setActiveView('list')
      updateSuperAdminViewUrl('subscriptionPlans')
    }} onCreated={handlePlanCreated} triggerToast={triggerToast} />
  }

  if (activeView === 'detail') {
    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId)
    const matchingTenants = selectedPlan
      ? tenants.filter((tenant) => (
        tenant.subscriptionPlanId === selectedPlan.id ||
        tenant.subscriptionPlan.toLowerCase() === selectedPlan.name.toLowerCase()
      ))
      : []

    return (
      <div className="role-content subscription-plan-detail-content">
        <div className="tenant-breadcrumb">
          <i className="fa-solid fa-house"></i>
          <span>Home</span>
          <i className="fa-solid fa-chevron-right"></i>
          <button type="button" onClick={closePlanDetail}>Subscription Plans</button>
          <i className="fa-solid fa-chevron-right"></i>
          <strong>Plan Detail</strong>
        </div>

        {isLoadingPlans ? (
          <div className="subscription-table-state">Loading plan details...</div>
        ) : planListError ? (
          <div className="subscription-table-state error">{planListError}</div>
        ) : !selectedPlan ? (
          <div className="subscription-table-state">Plan not found.</div>
        ) : (
          <>
            <div className="plan-detail-title-row">
              <div>
                <h1>{selectedPlan.name}</h1>
                <p>{selectedPlan.description || 'Manage configuration and monitor active subscribers for this subscription plan.'}</p>
              </div>
              <div className="plan-detail-title-actions">
                <em className={selectedPlan.status.toLowerCase() === 'active' ? 'active' : 'inactive'}>
                  {selectedPlan.status}
                </em>
                <button type="button" onClick={() => openPlanEdit(selectedPlan.id)}>Edit</button>
              </div>
            </div>

            <section className="plan-detail-card plan-configuration-card">
              <h2>Plan Configuration</h2>
              <div className="plan-config-grid">
                <div>
                  <span>Tagline</span>
                  <strong>{selectedPlan.description || '-'}</strong>
                </div>
                <div>
                  <span>Base Price</span>
                  <strong className="price">{selectedPlan.priceLabel || `$${selectedPlan.monthlyPrice.toFixed(2)} / mo`}</strong>
                </div>
                <div>
                  <span>Staff Limit</span>
                  <strong><i className="fa-regular fa-calendar-days"></i> {selectedPlan.staffAccountUnlimited ? 'Unlimited' : `${selectedPlan.maxStaffAccount} Members`}</strong>
                </div>
                <div>
                  <span>Job Limit</span>
                  <strong><i className="fa-regular fa-folder-open"></i> {selectedPlan.activeJobPostingUnlimited ? 'Unlimited' : `${selectedPlan.maxActiveJobPosting} Active Jobs`}</strong>
                </div>
                <div>
                  <span>Created Date</span>
                  <strong><i className="fa-regular fa-calendar"></i> {formatPlanDate(selectedPlan.createdAt)}</strong>
                </div>
                <div>
                  <span>AI Features</span>
                  <div className="plan-feature-tags">
                    {selectedPlan.features.length > 0 ? (
                      selectedPlan.features.map((feature) => (
                        <em key={feature.key} className={feature.status.toLowerCase() === 'enabled' ? 'enabled' : 'disabled'}>
                          {formatFeatureLabel(feature.key)}
                        </em>
                      ))
                    ) : (
                      <strong>-</strong>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="plan-detail-card active-subscribers-card">
              <div className="plan-detail-card-head">
                <h2>Active Subscribers</h2>
                <div>
                  <i className="fa-solid fa-filter"></i>
                  <i className="fa-solid fa-download"></i>
                </div>
              </div>

              {matchingTenants.length === 0 ? (
                <div className="plan-no-tenants">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>No tenants found.</span>
                </div>
              ) : (
                <div className="plan-tenant-list">
                  {matchingTenants.map((tenant) => (
                    <div className="plan-tenant-row" key={tenant.id}>
                      <strong>{tenant.name}</strong>
                      <span>{tenant.status}</span>
                      <span>{tenant.userQuotaUsed}/{tenant.userQuotaLimit || 'Unlimited'} users</span>
                      <span>{tenant.expirationDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    )
  }

  if (activeView === 'edit') {
    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId)

    if (isLoadingPlans) {
      return (
      <div className="role-content subscription-plan-detail-content">
        <div className="subscription-table-state">Loading plan details...</div>
      </div>
    )
    }

    if (planListError || !selectedPlan) {
      return (
        <div className="role-content subscription-plan-detail-content">
          <div className={`subscription-table-state ${planListError ? 'error' : ''}`}>
            {planListError || 'Plan not found.'}
          </div>
        </div>
      )
    }

    return (
      <EditPlanDetailView
        plan={selectedPlan}
        onBack={() => {
          setActiveView('detail')
          updateSubscriptionPlanDetailUrl(selectedPlan.id)
        }}
        onSaved={() => {
          setRefreshPlansKey((value) => value + 1)
          setActiveView('detail')
          updateSubscriptionPlanDetailUrl(selectedPlan.id)
        }}
        triggerToast={triggerToast}
      />
    )
  }

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
        <button type="button" onClick={() => setActiveView('create')}>Create New Plan</button>
      </div>

      <div className="role-metrics subscription-plan-metrics">
        <article className="role-metric subscription-plan-card">
          <small>Active Plans</small>
          <strong>{activePlansCount}</strong>
          <em><i className="fa-solid fa-arrow-trend-up"></i> {plans.length} total plans</em>
        </article>
        <article className="role-metric subscription-plan-card">
          <small>Top Tier</small>
          <strong>{topTier?.name || '-'}</strong>
          <p><i className="fa-solid fa-users"></i> {topTier?.staffAccountUnlimited ? 'Unlimited' : `${topTier?.maxStaffAccount || 0} staff`} accounts</p>
        </article>
        <article className="role-metric subscription-plan-card">
          <small>Avg. Revenue/Plan</small>
          <strong>${averageRevenue}</strong>
          <p><i className="fa-solid fa-wand-magic-sparkles"></i> Tier Optimization: High</p>
        </article>
        <article className="role-metric subscription-plan-card recommendation">
          <small>AI Recommendation</small>
          <p>Adjust Starter pricing for better conversion.</p>
          <a href="#insights">View insights <i className="fa-solid fa-arrow-right"></i></a>
        </article>
      </div>

      <section className="subscription-table-card">
        <div className="subscription-table-row subscription-table-head">
          <span>Plan Name</span>
          <span>Monthly Price</span>
          <span>Max Staff Accounts</span>
          <span>Max Job Postings</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {isLoadingPlans ? (
          <div className="subscription-table-state">Loading subscription plans...</div>
        ) : planListError ? (
          <div className="subscription-table-state error">{planListError}</div>
        ) : plans.length === 0 ? (
          <div className="subscription-table-state">No subscription plans found.</div>
        ) : (
          plans.map((plan) => {
            const isActive = plan.status.toLowerCase() === 'active'

            return (
              <div className="subscription-table-row" key={plan.id}>
                <strong>{plan.name}</strong>
                <span>{plan.priceLabel || `$${plan.monthlyPrice.toFixed(2)} / mo`}</span>
                <span>{plan.staffAccountUnlimited ? 'Unlimited' : `${plan.maxStaffAccount} Accounts`}</span>
                <span>{plan.activeJobPostingUnlimited ? 'Unlimited' : `${plan.maxActiveJobPosting} Active`}</span>
                <em className={isActive ? 'active' : 'inactive'}>{isActive ? 'Active' : plan.status}</em>
                <button type="button" aria-label={`Edit ${plan.name}`} onClick={() => openPlanEdit(plan.id)}>
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M8.75 21.25V16.25L21.25 3.75L26.25 8.75L13.75 21.25H8.75Z" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3.75 26.25H26.25" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.5 7.5L22.5 12.5" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )
          })
        )}

        <footer>
          <span>Showing {plans.length} plan{plans.length === 1 ? '' : 's'}</span>
          <div>
            <button type="button" disabled><i className="fa-solid fa-chevron-left"></i></button>
            <button type="button" className="active">1</button>
            <button type="button" disabled><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </footer>
      </section>
    </div>
  )
}

function CreatePromptView({ onBack }: { onBack: () => void }) {
  const [internalName, setInternalName] = useState('xinquiU9')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('Gemini 1.5 Pro')
  const [maxTokens, setMaxTokens] = useState('1024')
  const [instructions, setInstructions] = useState(`# System Persona
You are a highly experienced
Recruitment Consultant and Copywriter
for JobFusion. Your goal is to produce
job descriptions that are engaging,
SEO-optimized, and free of bias.`)

  const lineCount = Math.max(40, instructions.split('\n').length + 6)

  return (
    <form
      className="role-content create-prompt-content"
      onSubmit={(event) => {
        event.preventDefault()
        onBack()
      }}
    >
      <div className="tenant-breadcrumb create-plan-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <button type="button" onClick={onBack}>Prompt Management</button>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Create New Prompt</strong>
      </div>

      <div className="create-prompt-layout">
        <aside className="create-prompt-sidebar">
          <section className="create-prompt-card">
            <h2>General Settings</h2>
            <label>
              <span>Internal Name</span>
              <input value={internalName} onChange={(event) => setInternalName(event.target.value)} placeholder="e.g., xinquiU9" required />
            </label>
            <label>
              <span>Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the purpose of this prompt..." />
            </label>
          </section>

          <section className="create-prompt-card">
            <h2>AI ModelConfig</h2>
            <label>
              <span>Primary Model</span>
              <select value={model} onChange={(event) => setModel(event.target.value)}>
                <option>Gemini 1.5 Pro</option>
                <option>GPT-4.1</option>
                <option>Claude 3.5 Sonnet</option>
              </select>
            </label>
            <label>
              <span>Max Output Tokens</span>
              <input value={maxTokens} onChange={(event) => setMaxTokens(event.target.value)} inputMode="numeric" />
            </label>
          </section>
          <p className="create-prompt-deploy">Not yet deployed</p>
        </aside>

        <section className="prompt-editor-panel">
          <header>
            <h2><i className="fa-solid fa-terminal"></i> System Role & Instructions</h2>
            <div><i className="fa-regular fa-copy"></i><i className="fa-solid fa-expand"></i></div>
          </header>
          <div className="prompt-code-editor">
            <ol aria-hidden="true">
              {Array.from({ length: lineCount }, (_, index) => <li key={index}>{index + 1}</li>)}
            </ol>
            <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} spellCheck={false} />
          </div>
          <footer>
            <input placeholder="Typing..." />
          </footer>
        </section>

        <aside className="prompt-version-panel">
          <h2>Version History</h2>
          <div className="prompt-empty-history">
            <span><i className="fa-regular fa-folder-open"></i></span>
            <strong>No version history yet.</strong>
            <p>Versions will appear here once you save your first draft.</p>
          </div>
          <div className="prompt-ai-tip">
            <strong><i className="fa-solid fa-wand-magic-sparkles"></i> AI Optimizer</strong>
            <p>Write your instructions first, then click "Test Prompt" to analyze token usage and efficiency.</p>
          </div>
        </aside>
      </div>

      <footer className="create-prompt-actions">
        <button type="button" onClick={onBack}>Cancel</button>
        <button type="submit">Save Changes</button>
      </footer>
    </form>
  )
}

function PromptManagementView() {
  const [activeView, setActiveView] = useState<'list' | 'create'>('list')
  const prompts = [
    ['JD Generator', 'Structural role description creator', 'Recruitment Module', 'Today, 09:42 AM', 'Active'],
    ['AI CV Parsing', 'JSON extraction from PDF/Docx', 'Talent Module', 'Yesterday, 4:15 PM', 'Active'],
    ['Chatbot Screening', 'Initial candidate engagement flow', 'Interview Module', '2 days ago', 'Inactive'],
    ['DSS Analytics', 'Decision Support System Scoring', 'Analytics Module', '3 weeks ago', 'Active'],
    ['Priority Support', 'Priority Support really joelman', 'Priority Module', '4 weeks ago', 'Active'],
  ]

  if (activeView === 'create') {
    return <CreatePromptView onBack={() => setActiveView('list')} />
  }

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
        <button type="button" onClick={() => setActiveView('create')}>Create New Prompt</button>
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

function SuperAdminDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<SuperAdminView>(() => getInitialSuperAdminView())
  const [dashboardTenants, setDashboardTenants] = useState<Tenant[]>([])
  const [dashboardPlans, setDashboardPlans] = useState<SubscriptionPlan[]>([])
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getInitialSuperAdminView())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (activeView !== 'dashboard') return

    let isActive = true
    setIsDashboardLoading(true)
    setDashboardError('')

    Promise.all([adminApi.getTenants(), adminApi.getSubscriptionPlans()])
      .then(([tenants, plans]) => {
        if (!isActive) return
        setDashboardTenants(tenants)
        setDashboardPlans(plans)
      })
      .catch((error) => {
        if (isActive) {
          setDashboardError(error instanceof Error ? error.message : 'Load dashboard failed')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsDashboardLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView])

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
  const activeTenants = dashboardTenants.filter((tenant) => tenant.status.toLowerCase() === 'active')
  const expiringTenantCount = dashboardTenants.filter((tenant) => {
    const expiresAt = Date.parse(tenant.expirationDate)
    if (Number.isNaN(expiresAt)) return false
    const daysUntilExpiration = (expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiration >= 0 && daysUntilExpiration <= 30
  }).length
  const planById = new Map(dashboardPlans.map((plan) => [plan.id, plan]))
  const planByName = new Map(dashboardPlans.map((plan) => [plan.name.toLowerCase(), plan]))
  const monthlyRecurringRevenue = dashboardTenants.reduce((total, tenant) => {
    const plan = tenant.subscriptionPlanId
      ? planById.get(tenant.subscriptionPlanId)
      : planByName.get(tenant.subscriptionPlan.toLowerCase())
    return total + (plan?.monthlyPrice || 0)
  }, 0)
  const tenantCountsByPlan = dashboardTenants.reduce<Record<string, number>>((counts, tenant) => {
    const plan = tenant.subscriptionPlanId
      ? planById.get(tenant.subscriptionPlanId)
      : planByName.get(tenant.subscriptionPlan.toLowerCase())
    const planName = plan?.name || tenant.subscriptionPlan || '-'
    counts[planName] = (counts[planName] || 0) + 1
    return counts
  }, {})
  const getTenantPlanName = (tenant: { subscriptionPlan: string; subscriptionPlanId?: string }) => {
    const plan = tenant.subscriptionPlanId
      ? planById.get(tenant.subscriptionPlanId)
      : planByName.get(tenant.subscriptionPlan.toLowerCase())
    return plan?.name || tenant.subscriptionPlan || '-'
  }
  const tenantPlanRows = Object.entries(tenantCountsByPlan)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 4)
  const tenantPlanDisplayRows = tenantPlanRows.length > 0 ? tenantPlanRows : [
    ['Enterprise', 245],
    ['Pro', 482],
    ['Basic', 312],
    ['Free', 165],
  ] as Array<[string, number]>
  const maxTenantPlanCount = Math.max(1, ...tenantPlanDisplayRows.map(([, count]) => count))
  const platformStaffAccounts = dashboardTenants.reduce((total, tenant) => total + tenant.userQuotaUsed, 0)
  const dashboardErrorMessage = dashboardError ? 'Unable to load platform data. Please try again later.' : ''
  const recentTenants = dashboardTenants.length > 0 ? dashboardTenants.slice(0, 5) : [
    { id: 'velocity-ai', name: 'Velocity AI', subscriptionPlan: 'Enterprise', status: 'Active', createdAt: 'Jul 03, 2026' },
    { id: 'quantum-recruits', name: 'Quantro Recruits', subscriptionPlan: 'Pro Plan', status: 'Active', createdAt: 'Jun 29, 2026' },
    { id: 'greengrid-solar', name: 'GreenGrid Solar', subscriptionPlan: 'Growth', status: 'Active', createdAt: 'Jun 28, 2026' },
    { id: 'nexus-media', name: 'Nexus Media', subscriptionPlan: 'Enterprise', status: 'Active', createdAt: 'Jun 12, 2026' },
    { id: 'techflow', name: 'TechFlow', subscriptionPlan: 'Pro Plan', status: 'Inactive', createdAt: 'May 25, 2026' },
  ] as Array<Pick<Tenant, 'id' | 'name' | 'subscriptionPlan' | 'status'> & { createdAt: string }>
  const formatTenantCreatedAt = (tenant: typeof recentTenants[number]) => {
    const date = 'createdAt' in tenant ? tenant.createdAt : ''
    return date || 'Jul 03, 2026'
  }
  const promptRows = [
    { name: 'JD Generator', updated: 'Updated 2 days ago', status: 'Optimal', action: 'Edit' },
    { name: 'DSS Analytics', updated: 'Updated 34 days ago', status: 'Stale Pipeline', action: 'Update Now' },
    { name: 'CV Parsing Engine', updated: 'Updated 6 days ago', status: 'Optimal', action: 'Edit' },
  ]

  return (
    <DashboardShell
      navItems={navItems}
      subtitle="Super Admin"
      onLogout={onLogout}
      onChangePassword={() => selectView('settings')}
      searchPlaceholder="Search tenants, plans, prompts..."
      className="super-admin-shell"
    >
      {activeView === 'tenantManagement' ? (
        <TenantManagementView triggerToast={triggerToast} />
      ) : activeView === 'subscriptionPlans' ? (
        <SubscriptionPlansView triggerToast={triggerToast} />
      ) : activeView === 'promptManagement' ? (
        <PromptManagementView />
      ) : activeView === 'settings' ? (
        <AccountSettingsView onBack={() => selectView('dashboard')} triggerToast={triggerToast} />
      ) : (
        <div className="role-content super-admin-content">
        {dashboardErrorMessage && (
          <p className="super-admin-alert">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{dashboardErrorMessage}</span>
          </p>
        )}
        <div className="role-metrics four super-admin-metrics">
          <MetricCard icon="fa-building" label="Total Tenants" value={isDashboardLoading ? '...' : (dashboardTenants.length || 1204).toLocaleString()} note="+4.2%" />
          <MetricCard icon="fa-bolt" label="Active Tenants" value={isDashboardLoading ? '...' : (activeTenants.length || 1180).toLocaleString()} note="+2.1%" />
          <MetricCard icon="fa-money-bill-trend-up" label="Monthly Recurring Revenue" value={isDashboardLoading ? '...' : `$${(monthlyRecurringRevenue || 124500).toLocaleString()}`} note="+12%" />
          <MetricCard icon="fa-triangle-exclamation" label="Tenants expiring within 30 days" value={isDashboardLoading ? '...' : String(expiringTenantCount || 12)} />
        </div>
        <div className="role-grid super-grid">
          <section className="role-panel tenant-table super-tenant-table">
            <div className="role-panel-head"><h2>Recent Tenants</h2><button type="button" onClick={() => selectView('tenantManagement')}>View All</button></div>
            {isDashboardLoading ? (
              <p>Loading tenants...</p>
            ) : (
              <div className="super-tenant-table-grid">
                <div className="super-tenant-table-header">
                  <span>Company</span>
                  <span>Plan</span>
                  <span>Status</span>
                  <span>Date Created</span>
                  <span>Actions</span>
                </div>
                {recentTenants.map((tenant) => (
                <article key={tenant.id}>
                  <strong>{tenant.name}</strong>
                  <span>{getTenantPlanName(tenant)}</span>
                  <em className={tenant.status.toLowerCase() === 'active' ? 'active' : 'inactive'}>{tenant.status}</em>
                  <small>{formatTenantCreatedAt(tenant)}</small>
                  <div>
                    <button type="button" aria-label={`View ${tenant.name}`}><i className="fa-regular fa-eye"></i></button>
                    <button type="button" aria-label={`Delete ${tenant.name}`}><i className="fa-regular fa-trash-can"></i></button>
                  </div>
                </article>
                ))}
              </div>
            )}
          </section>
          <section className="role-panel plan-bars">
            <h2>Tenants by Plan</h2>
            {isDashboardLoading ? (
              <p>Loading plans...</p>
            ) : (
              tenantPlanDisplayRows.map(([label, count]) => (
                <div className="bar-row" key={label}><span>{label}</span><strong>{count}</strong><i style={{ width: `${Math.max(8, (count / maxTenantPlanCount) * 100)}%` }} /></div>
              ))
            )}
            <div className="quick-actions">
              <button type="button" onClick={() => selectView('subscriptionPlans')}><i className="fa-solid fa-briefcase"></i>Manage Subscriptions</button>
              <button type="button" onClick={() => selectView('tenantManagement')}><i className="fa-solid fa-building-circle-check"></i>Create New Tenant</button>
              <button type="button" onClick={() => selectView('promptManagement')}><i className="fa-solid fa-wand-magic-sparkles"></i>Edit System Prompts</button>
            </div>
          </section>
          <section className="role-panel prompt-panel">
            <div className="role-panel-head"><h2><i className="fa-solid fa-terminal"></i>System Prompts Status</h2><small>UPDATE: 2h ago</small></div>
            {promptRows.map((prompt) => (
              <article key={prompt.name}>
                <div>
                  <strong>{prompt.name}</strong>
                  <small>{prompt.updated}</small>
                </div>
                <span className={prompt.status === 'Optimal' ? 'optimal' : 'stale'}>{prompt.status}</span>
                <button type="button" onClick={() => selectView('promptManagement')}>{prompt.action}</button>
              </article>
            ))}
          </section>
          <section className="role-panel activity-panel">
            <h2>Platform Activity (24h)</h2>
            <div className="activity-grid">
              <span><i className="fa-regular fa-address-card"></i>Staff Accounts <strong>{(platformStaffAccounts || 4120).toLocaleString()}</strong></span>
              <span><i className="fa-regular fa-file-lines"></i>CVs Processed <strong>124,582</strong></span>
              <span><i className="fa-regular fa-clipboard"></i>Job Postings <strong>12,402</strong></span>
              <span><i className="fa-regular fa-envelope"></i>Emails Sent <strong>892,110</strong></span>
            </div>
            <footer><span></span>{dashboardError ? 'System status unavailable' : 'System Healthy: Global AWS Load 14%'}<i className="fa-solid fa-arrow-trend-up"></i></footer>
          </section>
        </div>
      </div>
      )}
    </DashboardShell>
  )
}

function HrDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
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

function InterviewerDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
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

export function RoleDashboardPage({ role, onLogout, triggerToast }: RoleDashboardPageProps) {
  if (role === 'superAdmin') return <SuperAdminDashboard onLogout={onLogout} triggerToast={triggerToast} />
  if (role === 'tenantAdmin') return <TenantAdminDashboard onLogout={onLogout} triggerToast={triggerToast} />
  if (role === 'interviewer') return <InterviewerDashboard onLogout={onLogout} triggerToast={triggerToast} />
  return <HrDashboard onLogout={onLogout} triggerToast={triggerToast} />
}
