import type { RoleHomeView } from './roleHome.types'

export const hrPathByView: Record<RoleHomeView, string> = {
  dashboard: '/hr/dashboard',
  jobs: '/hr/jobs',
  settings: '/hr/settings',
}

export const hrJobsPath = '/hr/jobs'
export const hrCreateJobPostingPath = '/hr/jobs/createjobposting'
export const hrGenerateJobAiPath = '/hr/jobs/createjobposting/generatewithai'
export const hrJobDetailPathPrefix = `${hrJobsPath}/`

export function getActiveHrView(pathname: string): RoleHomeView {
  if (pathname.startsWith(hrJobsPath)) return 'jobs'
  if (pathname.startsWith(hrPathByView.settings)) return 'settings'
  return 'dashboard'
}
