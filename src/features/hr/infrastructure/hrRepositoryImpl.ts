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
    const job = await hrApi.createJobPosting(payload)
    if (!job) {
      throw new Error('Failed to create job posting')
    }
    return job
  }

  async updateJobPosting(id: string, payload: JobPostingPayload): Promise<JobPosting> {
    const job = await hrApi.updateJobPosting(id, payload)
    if (!job) {
      throw new Error('Failed to update job posting')
    }
    return job
  }

  async deleteJobPosting(id: string): Promise<void> {
    await hrApi.deleteJobPosting(id)
  }

  async updateJobPostingStatus(id: string, status: string): Promise<JobPosting> {
    const currentJob = await hrApi.getJobPostingById(id)
    const payload: JobPostingPayload = {
      title: currentJob.title,
      department: currentJob.department,
      level: currentJob.level || '',
      employmentType: currentJob.employmentType,
      locationType: currentJob.locationType || 'OFFICE',
      location: currentJob.location || '',
      applicationDeadline: currentJob.applicationDeadline || '',
      description: currentJob.description || '',
      requirements: currentJob.requirements || '',
      benefits: currentJob.benefits || '',
      salaryMin: currentJob.salaryMin || 0,
      salaryMax: currentJob.salaryMax || 0,
      status,
    }
    const job = await hrApi.updateJobPosting(id, payload)
    if (!job) {
      throw new Error('Failed to update job posting status')
    }
    return job
  }

  async getJobCriteria(jobId: string): Promise<JobCriteriaResponse[]> {
    return hrApi.getJobCriteriaByJobId(jobId)
  }

  async updateJobCriteria(jobId: string, criteria: JobCriteriaPayload[]): Promise<JobCriteriaResponse[]> {
    return hrApi.createJobCriteria(criteria)
  }

  async getJobRevisionHistory(jobId: string): Promise<JobRevisionHistoryItem[]> {
    const job = await hrApi.getJobPostingById(jobId)
    return job.revisionHistory || []
  }
}

export const hrRepository = new HrRepositoryImpl()
