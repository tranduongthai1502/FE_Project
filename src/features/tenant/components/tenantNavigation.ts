import type { NavigationConfigItem } from '@/components/common/navigation'
import type { TenantAdminView } from '@/app/routes/route.types'

export const tenantNav: Array<NavigationConfigItem<TenantAdminView>> = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', view: 'dashboard' },
  {
    icon: 'fa-users-gear',
    label: 'Staff Management',
    view: 'staffManagement',
    activeWhen: ['staffManagement', 'staffCreate', 'staffEdit', 'staffDetail', 'staffActivityLog'],
  },
  { icon: 'fa-chart-line', label: 'Analytics' },
  { icon: 'fa-gear', label: 'Settings', view: 'settings' },
]
