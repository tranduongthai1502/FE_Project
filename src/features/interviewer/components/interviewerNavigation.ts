import type { NavigationConfigItem } from '@/components/common/navigation'
import type { RoleHomeView } from '@/app/routes/route.types'

export const interviewerNav: Array<NavigationConfigItem<RoleHomeView>> = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', view: 'dashboard' },
  { icon: 'fa-calendar-day', label: 'My Interviews' },
  { icon: 'fa-users', label: 'Candidates' },
  { icon: 'fa-rectangle-list', label: 'Interview Detail' },
  { icon: 'fa-gear', label: 'Settings', view: 'settings' },
]
