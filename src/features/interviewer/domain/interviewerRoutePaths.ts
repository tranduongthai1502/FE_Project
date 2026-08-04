import type { InterviewerHomeView } from './interviewerHome.types'

export const interviewerPathByView: Record<InterviewerHomeView, string> = {
  dashboard: '/interviewer/dashboard',
  settings: '/interviewer/settings',
}

export function getActiveInterviewerView(pathname: string): InterviewerHomeView {
  if (pathname.startsWith(interviewerPathByView.settings)) return 'settings'
  return 'dashboard'
}
