import type {
  JobCriteriaPayload,
  JobCriteriaResponse,
  JobPosting,
  JobPostingPayload,
  JobRevisionHistoryItem,
} from '../../domain/hrApi.types'

export interface HrRepository {
  getJobPostings(): Promise<JobPosting[]>
  getJobPostingById(id: string): Promise<JobPosting>
  createJobPosting(payload: JobPostingPayload): Promise<JobPosting>
  updateJobPosting(id: string, payload: JobPostingPayload): Promise<JobPosting>
  deleteJobPosting(id: string): Promise<void>
  updateJobPostingStatus(id: string, status: string): Promise<JobPosting>

  getJobCriteria(jobId: string): Promise<JobCriteriaResponse[]>
  updateJobCriteria(jobId: string, criteria: JobCriteriaPayload[]): Promise<JobCriteriaResponse[]>

  getJobRevisionHistory(jobId: string): Promise<JobRevisionHistoryItem[]>
}
