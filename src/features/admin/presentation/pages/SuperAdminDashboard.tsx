import { useSuperAdminDashboardController } from '@/features/admin/application/hooks/useSuperAdminDashboardController'
import { AccountSettingsPanel } from '@/features/auth'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { DashboardShell } from '@/core/components/DashboardShell'
import { MetricCard } from '@/core/components/MetricCard'
import { PromptManagementView } from './PromptManagementView'
import { SubscriptionPlansView } from './SubscriptionPlansView'
import { TenantManagementView } from './TenantManagementView'

export function SuperAdminDashboard({
  onLogout,
  triggerToast,
}: {
  onLogout: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const ctrl = useSuperAdminDashboardController()

  return (
    <DashboardShell
      navItems={ctrl.navItems}
      subtitle="Super Admin"
      user={ctrl.user}
      onLogout={onLogout}
      onChangePassword={() => ctrl.selectView('settings')}
      className="super-admin-shell"
    >
      {ctrl.activeView === 'tenant-management' ? (
        <TenantManagementView key={ctrl.viewResetKeys['tenant-management']} onHome={() => ctrl.selectView('dashboard')} triggerToast={triggerToast} />
      ) : ctrl.activeView === 'subscription-plans' ? (
        <SubscriptionPlansView key={ctrl.viewResetKeys['subscription-plans']} onHome={() => ctrl.selectView('dashboard')} triggerToast={triggerToast} />
      ) : ctrl.activeView === 'prompt-management' ? (
        <PromptManagementView key={ctrl.viewResetKeys['prompt-management']} onHome={() => ctrl.selectView('dashboard')} />
      ) : ctrl.activeView === 'settings' ? (
        <AccountSettingsPanel key={ctrl.viewResetKeys.settings} onBack={() => ctrl.selectView('dashboard')} triggerToast={triggerToast} />
      ) : (
        <div key={ctrl.viewResetKeys.dashboard} className="role-content super-admin-content">
          <Breadcrumb items={[{ label: 'Home' }, { label: 'Dashboard' }]} />
          {ctrl.dashboardErrorMessage && (
            <p className="super-admin-alert">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{ctrl.dashboardErrorMessage}</span>
            </p>
          )}
          <div className="role-metrics four super-admin-metrics">
            <MetricCard icon="fa-building" label="Total Tenants" value={ctrl.isDashboardLoading ? '...' : (ctrl.dashboardTenants.length || 1204).toLocaleString()} note="+4.2%" />
            <MetricCard icon="fa-bolt" label="Active Tenants" value={ctrl.isDashboardLoading ? '...' : (ctrl.activeTenantsCount || 1180).toLocaleString()} note="+2.1%" />
            <MetricCard icon="fa-money-bill-trend-up" label="Monthly Recurring Revenue" value={ctrl.isDashboardLoading ? '...' : `$${(ctrl.monthlyRecurringRevenue || 124500).toLocaleString()}`} note="+12%" />
            <MetricCard icon="fa-triangle-exclamation" label="Tenants expiring within 30 days" value={ctrl.isDashboardLoading ? '...' : String(ctrl.expiringTenantCount || 12)} />
          </div>
          <div className="super-dashboard-container">
            <div className="super-dashboard-row">
              <section className="role-panel tenant-table super-tenant-table">
                <div className="role-panel-head"><h2>Recent Tenants</h2><button type="button" onClick={() => ctrl.selectView('tenant-management')}>View All</button></div>
                {ctrl.isDashboardLoading ? (
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
                    {ctrl.recentTenants.map((tenant) => (
                      <article key={tenant.id}>
                        <strong>{tenant.name}</strong>
                        <span className={ctrl.isHighestPricedPlan(ctrl.getTenantPlanName(tenant)) ? 'premium-plan' : ''}>{ctrl.getTenantPlanName(tenant)}</span>
                        <em className={tenant.status.toLowerCase() === 'active' ? 'active' : 'inactive'}>{tenant.status}</em>
                        <small>{ctrl.formatTenantCreatedAt(tenant)}</small>
                        <div>
                          <button type="button" className="icon-tooltip" aria-label={`View ${tenant.name}`} data-tooltip="Detail" onClick={() => ctrl.openTenantDetail(tenant.id)}><i className="fa-regular fa-eye"></i></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
              <section className="role-panel plan-bars">
                <h2>Tenants by Plan</h2>
                {ctrl.isDashboardLoading ? (
                  <p>Loading plans...</p>
                ) : (
                  ctrl.tenantPlanDisplayRows.map(([label, count]) => (
                    <div className="bar-row" key={label}><span className={ctrl.isHighestPricedPlan(label) ? 'premium-plan' : ''}>{label}</span><strong>{count}</strong><i style={{ width: `${Math.max(8, (count / ctrl.maxTenantPlanCount) * 100)}%` }} /></div>
                  ))
                )}
                <div className="quick-actions">
                  <h3>Quick Actions</h3>
                  <button type="button" onClick={() => ctrl.selectView('subscription-plans')}><i className="fa-solid fa-briefcase"></i>Manage Subscriptions</button>
                  <button type="button" onClick={ctrl.openTenantCreate}><i className="fa-solid fa-building-circle-check"></i>Create New Tenant</button>
                  <button type="button" onClick={() => ctrl.selectView('prompt-management')}><i className="fa-solid fa-wand-magic-sparkles"></i>Edit System Prompts</button>
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
                {ctrl.promptRows.map((prompt) => (
                  <article key={prompt.name}>
                    <div>
                      <strong>{prompt.name}</strong>
                      <small>{prompt.updated}</small>
                    </div>
                    <span className={prompt.status === 'Optimal' ? 'optimal' : 'stale'}>{prompt.status}</span>
                    <button type="button" onClick={() => ctrl.selectView('prompt-management')}>{prompt.action}</button>
                  </article>
                ))}
              </section>
              <section className="role-panel activity-panel">
                <h2>Platform Activity (24h)</h2>
                <div className="activity-grid">
                  <span><i className="fa-regular fa-address-card"></i>Staff Accounts <strong>{(ctrl.platformStaffAccounts || 4120).toLocaleString()}</strong></span>
                  <span><i className="fa-regular fa-file-lines"></i>CVs Processed <strong>124,582</strong></span>
                  <span><i className="fa-regular fa-clipboard"></i>Job Postings <strong>12,402</strong></span>
                  <span><i className="fa-regular fa-envelope"></i>Emails Sent <strong>892,110</strong></span>
                </div>
                <footer><span></span>{ctrl.systemStatusNote}<i className="fa-solid fa-arrow-trend-up"></i></footer>
              </section>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
