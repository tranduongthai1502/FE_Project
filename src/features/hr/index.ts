export { HrDashboard } from './presentation/components/HrDashboard'
export { CandidateManagementView } from './presentation/components/candidate/CandidateManagementView'
export { CandidateDetailView } from './presentation/components/candidate/CandidateDetailView'

export {
  hrPathByView,
  hrJobsPath,
  hrCandidatesPath,
  hrCandidateDetailPathPrefix,
  getHrCandidateDetailPath,
  getActiveHrView,
} from './domain/hrRoutePaths'

export { useCandidateListController } from './application/useCandidateListController'
export { useCandidateDetailController } from './application/useCandidateDetailController'

export type { Candidate, CandidateDetail, CandidateStage, CandidateDashboardStats } from './domain/candidate.types'
