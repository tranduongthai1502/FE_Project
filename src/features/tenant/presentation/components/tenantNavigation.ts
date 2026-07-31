import type { NavigationConfigItem } from '@/core/components/common/navigation'
import type { TenantAdminView } from '@/features/tenant/presentation/pages/tenantAdmin.types'

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
