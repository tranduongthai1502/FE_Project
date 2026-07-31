import type { NavigationConfigItem } from '@/core/components/common/navigation'
import type { InterviewerHomeView } from '@/features/interviewer/presentation/pages/interviewerHome.types'

export const interviewerNav: Array<NavigationConfigItem<InterviewerHomeView>> = [
  { icon: 'fa-table-cells-large', label: 'Dashboard', view: 'dashboard' },
  { icon: 'fa-calendar-day', label: 'My Interviews' },
  { icon: 'fa-users', label: 'Candidates' },
  { icon: 'fa-rectangle-list', label: 'Interview Detail' },
  { icon: 'fa-gear', label: 'Settings', view: 'settings' },
]
