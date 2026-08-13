import type { NavigationConfigItem } from '@/core/hooks/navigation'
import type { InterviewerHomeView } from '@/features/interviewer/domain/interviewerHome.types'

export const interviewerNav: Array<NavigationConfigItem<InterviewerHomeView>> = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', view: 'dashboard' },
  { icon: 'fa-calendar-day', label: 'My Interviews', view: 'interviews' },
  { icon: 'fa-gear', label: 'Settings', view: 'settings' },
]
