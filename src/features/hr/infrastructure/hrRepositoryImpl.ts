import type { HrRepository } from '../application/ports/hrRepository'
import type {
  JobCriteriaPayload,
  JobCriteriaResponse,
  JobPosting,
  JobPostingPayload,
  JobRevisionHistoryItem,
} from '../domain/hrApi.types'
import { hrApi } from './hrApi'

export class HrRepositoryImpl implements HrRepository {
  async getJobPostings(): Promise<JobPosting[]> {
    return hrApi.getJobPostings()
  }

  async getJobPostingById(id: string): Promise<JobPosting> {
    return hrApi.getJobPostingById(id)
  }

  async createJobPosting(payload: JobPostingPayload): Promise<JobPosting> {
    return hrApi.createJobPosting(payload)
  }

  async updateJobPosting(id: string, payload: JobPostingPayload): Promise<JobPosting> {
    return hrApi.updateJobPosting(id, payload)
  }

  async deleteJobPosting(id: string): Promise<void> {
    return hrApi.deleteJobPosting(id)
  }

  async updateJobPostingStatus(id: string, status: string): Promise<JobPosting> {
    return hrApi.updateJobPostingStatus(id, status)
  }

  async getJobCriteria(jobId: string): Promise<JobCriteriaResponse[]> {
    return hrApi.getJobCriteria(jobId)
  }

  async updateJobCriteria(jobId: string, criteria: JobCriteriaPayload[]): Promise<JobCriteriaResponse[]> {
    return hrApi.updateJobCriteria(jobId, criteria)
  }

  async getJobRevisionHistory(jobId: string): Promise<JobRevisionHistoryItem[]> {
    return hrApi.getJobRevisionHistory(jobId)
  }
}

export const hrRepository = new HrRepositoryImpl()
