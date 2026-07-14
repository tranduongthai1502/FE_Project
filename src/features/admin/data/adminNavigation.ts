import type { RoleHomeView, TenantAdminView } from '../types/admin.types'

export const tenantNav = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', active: true },
  { icon: 'fa-users-gear', label: 'Staff Management' },
  { icon: 'fa-chart-line', label: 'Analytics' },
  { icon: 'fa-gear', label: 'Settings' },
]

export const superNav = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', view: 'dashboard' },
  { icon: 'fa-building-user', label: 'Tenant Management', view: 'tenantManagement' },
  { icon: 'fa-money-check-dollar', label: 'Subscription Plans', view: 'subscriptionPlans' },
  { icon: 'fa-briefcase', label: 'Prompt Management', view: 'promptManagement' },
  { icon: 'fa-gear', label: 'Settings', view: 'settings' },
]

export const hrNav = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', active: true },
  { icon: 'fa-briefcase', label: 'Jobs' },
  { icon: 'fa-users', label: 'Candidates' },
  { icon: 'fa-envelope', label: 'Email Management' },
  { icon: 'fa-calendar-check', label: 'Interviews' },
  { icon: 'fa-chart-simple', label: 'Analytics' },
  { icon: 'fa-gear', label: 'Settings' },
]

export const interviewerNav = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', active: true },
  { icon: 'fa-calendar-day', label: 'My Interviews' },
  { icon: 'fa-users', label: 'Candidates' },
  { icon: 'fa-rectangle-list', label: 'Interview Detail' },
  { icon: 'fa-gear', label: 'Settings' },
]

export function getRoleHomeNav(
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

export function getTenantAdminNav(activeView: TenantAdminView, setActiveView: (view: TenantAdminView) => void) {
  return tenantNav.map((item) => ({
    icon: item.icon,
    label: item.label,
    active:
      (item.label === 'Dashboard' && activeView === 'dashboard') ||
      (item.label === 'Staff Management' && (activeView === 'staffManagement' || activeView === 'staffCreate')) ||
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
