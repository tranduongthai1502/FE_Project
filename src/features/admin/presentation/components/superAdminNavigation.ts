import type { NavigationConfigItem } from '@/core/components/navigation'
import type { SuperAdminView } from '@/features/admin/presentation/pages/superAdmin.types'

export const superNav: Array<NavigationConfigItem<SuperAdminView>> = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', view: 'dashboard' },
  { icon: 'fa-building-user', label: 'Tenant Management', view: 'tenantManagement' },
  { icon: 'fa-money-check-dollar', label: 'Subscription Plans', view: 'subscriptionPlans' },
  { icon: 'fa-briefcase', label: 'Prompt Management', view: 'promptManagement' },
  { icon: 'fa-gear', label: 'Settings', view: 'settings' },
]
