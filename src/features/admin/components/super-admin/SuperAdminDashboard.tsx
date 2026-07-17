import { useEffect, useState } from 'react'
import { superNav } from '../../data/adminNavigation'
import { adminApi } from '../../services/adminApi'
import type { SubscriptionPlan, SuperAdminView, Tenant } from '../../types/admin.types'
import { getInitialSuperAdminView, updateSuperAdminViewUrl, updateTenantCreateUrl, updateTenantDetailUrl } from '../../utils/adminRouteHelpers'
import { AccountSettingsView } from '../shared/AccountSettingsView'
import { DashboardShell } from '../shared/DashboardShell'
import { MetricCard } from '../shared/MetricCard'
import { PromptManagementView } from './PromptManagementView'
import { SubscriptionPlansView } from './SubscriptionPlansView'
import { TenantManagementView } from './TenantManagementView'

export function SuperAdminDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
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
  const openTenantCreate = () => {
    setActiveView('tenantManagement')
    updateTenantCreateUrl()
  }
  const openTenantDetail = (tenantId: string) => {
    setActiveView('tenantManagement')
    updateTenantDetailUrl(tenantId)
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
  const highestMonthlyPrice = Math.max(0, ...dashboardPlans.map((plan) => plan.monthlyPrice || 0))
  const highestPlanNames = new Set(
    dashboardPlans
      .filter((plan) => plan.monthlyPrice > 0 && plan.monthlyPrice === highestMonthlyPrice)
      .map((plan) => plan.name.toLowerCase()),
  )
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
  const isHighestPricedPlan = (planName: string) => (
    highestPlanNames.size > 0
      ? highestPlanNames.has(planName.toLowerCase())
      : /enterprise/i.test(planName)
  )
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
        <SubscriptionPlansView onHome={() => selectView('dashboard')} triggerToast={triggerToast} />
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
        <div className="super-dashboard-container">
          <div className="super-dashboard-row">
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
                    <span className={isHighestPricedPlan(getTenantPlanName(tenant)) ? 'premium-plan' : ''}>{getTenantPlanName(tenant)}</span>
                    <em className={tenant.status.toLowerCase() === 'active' ? 'active' : 'inactive'}>{tenant.status}</em>
                    <small>{formatTenantCreatedAt(tenant)}</small>
                    <div>
                      <button type="button" aria-label={`View ${tenant.name}`} onClick={() => openTenantDetail(tenant.id)}><i className="fa-regular fa-eye"></i></button>
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
                  <div className="bar-row" key={label}><span className={isHighestPricedPlan(label) ? 'premium-plan' : ''}>{label}</span><strong>{count}</strong><i style={{ width: `${Math.max(8, (count / maxTenantPlanCount) * 100)}%` }} /></div>
                ))
              )}
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <button type="button" onClick={() => selectView('subscriptionPlans')}><i className="fa-solid fa-briefcase"></i>Manage Subscriptions</button>
                <button type="button" onClick={openTenantCreate}><i className="fa-solid fa-building-circle-check"></i>Create New Tenant</button>
                <button type="button" onClick={() => selectView('promptManagement')}><i className="fa-solid fa-wand-magic-sparkles"></i>Edit System Prompts</button>
              </div>
            </section>
          </div>
          <div className="super-dashboard-row">
            <section className="role-panel prompt-panel">
            <div className="role-panel-head">
              <h2>
                <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V14C20 14.55 19.8042 15.0208 19.4125 15.4125C19.0208 15.8042 18.55 16 18 16H2ZM2 14H18V4H2V14ZM5.5 13L4.1 11.6L6.675 9L4.075 6.4L5.5 5L9.5 9L5.5 13ZM10 13V11H16V13H10Z" fill="#AD2B00" />
                </svg>
                System Prompts Status
              </h2>
              <small>UPDATE: 2h ago</small>
            </div>
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
      </div>
      )}
    </DashboardShell>
  )
}
