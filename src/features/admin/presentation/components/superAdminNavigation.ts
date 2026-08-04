import type { NavigationConfigItem } from '@/core/hooks/navigation'
import type { SuperAdminView } from '@/features/admin/domain/superAdminRouteHelpers'

export const superNav: Array<NavigationConfigItem<SuperAdminView>> = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', view: 'dashboard' },
  { icon: 'fa-building-user', label: 'Tenant Management', view: 'tenant-management' },
  { icon: 'fa-money-check-dollar', label: 'Subscription Plans', view: 'subscription-plans' },
  { icon: 'fa-briefcase', label: 'Prompt Management', view: 'prompt-management' },
  { icon: 'fa-gear', label: 'Settings', view: 'settings' },
]
