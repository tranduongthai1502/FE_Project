import type { RoleHomeView } from './roleHome.types'

export const hrPathByView: Record<RoleHomeView, string> = {
  dashboard: '/hr/dashboard',
  jobs: '/hr/jobs',
  candidates: '/hr/candidates',
  settings: '/hr/settings',
}

export const hrJobsPath = '/hr/jobs'
export const hrCandidatesPath = '/hr/candidates'
export const hrCreateJobPostingPath = '/hr/jobs/createjobposting'
export const hrGenerateJobAiPath = '/hr/jobs/createjobposting/generatewithai'
export const hrJobDetailPathPrefix = `${hrJobsPath}/`
export const hrCandidateDetailPathPrefix = `${hrCandidatesPath}/`

export const getHrCandidateDetailPath = (id: string) => `${hrCandidateDetailPathPrefix}${id}`

export function getActiveHrView(pathname: string): RoleHomeView {
  if (pathname.startsWith(hrJobsPath)) return 'jobs'
  if (pathname.startsWith(hrCandidatesPath)) return 'candidates'
  if (pathname.startsWith(hrPathByView.settings)) return 'settings'
  return 'dashboard'
}
