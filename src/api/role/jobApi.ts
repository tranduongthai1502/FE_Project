import axiosClient from '../client/axiosClient'
import type { AdminListParams, JobListFilters, JobPosting, JobPostingPayload } from '@/features/admin/types/admin.types'
import {
  attachPaginationMeta,
  getJobPostingList,
  getResponsePayload,
  normalizeJobPosting,
} from '@/features/admin/utils/adminMappers'
import { buildJobListRequest } from './roleRequests'

export const jobApi = {
  async getJobPostings(params?: AdminListParams<JobListFilters>) {
    const request = buildJobListRequest(params)

    console.log('[jobApi.getJobPostings] request payload', request)
    const response = await axiosClient.post('/api/job-posting/list', request)

    return attachPaginationMeta(getJobPostingList(response)
      .map((job) => normalizeJobPosting(job))
      .filter((job): job is JobPosting => Boolean(job)), response)
  },

  async getJobPostingById(id: string) {
    const response = await axiosClient.get(`/api/job-posting/${encodeURIComponent(id)}`)
    const job = normalizeJobPosting(getResponsePayload(response))

    if (!job) {
      throw new Error('Job posting not found')
    }

    return job
  },

  async createJobPosting(payload: JobPostingPayload) {
    const response = await axiosClient.post('/api/job-posting', payload)
    return normalizeJobPosting(getResponsePayload(response))
  },

  async updateJobPosting(id: string, payload: JobPostingPayload) {
    const response = await axiosClient.put(`/api/job-posting/${encodeURIComponent(id)}`, payload)
    return normalizeJobPosting(getResponsePayload(response))
  },

  async deleteJobPosting(id: string) {
    return axiosClient.delete(`/api/job-posting/${encodeURIComponent(id)}`)
  },
}
