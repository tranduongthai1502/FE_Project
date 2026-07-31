import type { NavigationConfigItem } from '@/core/components/common/navigation'
import type { RoleHomeView } from '@/features/hr/presentation/pages/roleHome.types'

export const hrNav: Array<NavigationConfigItem<RoleHomeView>> = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', view: 'dashboard' },
  { icon: 'fa-briefcase', label: 'Jobs', view: 'jobs' },
  { icon: 'fa-users', label: 'Candidates' },
  { icon: 'fa-envelope', label: 'Email Management' },
  { icon: 'fa-calendar-check', label: 'Interviews' },
  { icon: 'fa-chart-simple', label: 'Analytics' },
  { icon: 'fa-gear', label: 'Settings', view: 'settings' },
]
