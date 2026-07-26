import axiosClient from '@/services/api/axiosClient'
import { API_LIST_PAGE_SIZE } from '@/services/api/apiConstants'
import type {
  AdminListParams,
  JobListFilters,
  JobListRequest,
  JobPosting,
  JobPostingPayload,
} from '@/services/api/api.types'
import { attachPaginationMeta } from '@/utils/pagination'
import {
  getJobPostingList,
  getResponsePayload,
  normalizeJobPosting,
} from '@/services/api/apiMappers'

export const HR_LIST_PAGE_SIZE = API_LIST_PAGE_SIZE

function buildJobListRequest(params?: AdminListParams<JobListFilters>): JobListRequest {
  const page = params?.page ?? 1
  const filters = params?.filters
  const hasFilters = Boolean(filters && Object.values(filters).some((value) => String(value ?? '').trim() !== ''))

  return {
    sortField: params?.sortField ?? 'createdAt',
    filters: hasFilters ? filters ?? null : null,
    sortBy: params?.sortBy ?? 'DESC',
    page: Math.max(1, page),
    size: params?.size ?? HR_LIST_PAGE_SIZE,
  }
}

export const hrApi = {
  async getJobPostings(params?: AdminListParams<JobListFilters>) {
    const request = buildJobListRequest(params)

    console.log('[hrApi.getJobPostings] request payload', request)
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
