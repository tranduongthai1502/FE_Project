export { HrDashboard } from './presentation/pages/HrDashboard'
export { CandidateManagementView } from './presentation/pages/CandidateManagementView'
export { CandidateDetailView } from './presentation/components/candidate/CandidateDetailView'

export {
  hrPathByView,
  hrJobsPath,
  hrCandidatesPath,
  hrCandidateDetailPathPrefix,
  getHrCandidateDetailPath,
  getActiveHrView,
} from './domain/hrRoutePaths'

export {
  useCandidateListController,
  useCandidateDetailController,
  useHrDashboardController,
  useHrJobsController,
  useHrJobCriteriaController,
  hrQueryKeys,
  useJobPostings,
  useJobPostingDetail,
  useJobPostingStats,
  useJobCriteria,
  useCreateJobPosting,
  useUpdateJobPosting,
  useDeleteJobPosting,
  useSaveJobCriteria,
} from './application'

export type { Candidate, CandidateDetail, CandidateStage, CandidateDashboardStats } from './domain/candidate.types'
