import type { InterviewerHomeView } from './interviewerHome.types'

export const interviewerPathByView: Record<InterviewerHomeView, string> = {
  dashboard: '/interviewer/dashboard',
  interviews: '/interviewer/interviews',
  settings: '/interviewer/settings',
}

export function getActiveInterviewerView(pathname: string): InterviewerHomeView {
  if (pathname.startsWith(interviewerPathByView.settings)) return 'settings'
  if (pathname.startsWith(interviewerPathByView.interviews)) return 'interviews'
  return 'dashboard'
}
