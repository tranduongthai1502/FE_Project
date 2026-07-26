import axiosClient from '@/services/api/axiosClient'
import { API_LIST_PAGE_SIZE } from '@/services/api/apiConstants'
import type {
  AdminListParams,
  JobCriteriaPayload,
  JobCriteriaResponse,
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

  async checkTitleUniqueness(title: string, excludeId?: string) {
    const params = new URLSearchParams({ title })
    if (excludeId) params.append('excludeId', excludeId)
    return axiosClient.get(`/api/job-posting/check-title?${params.toString()}`)
  },

  async createJobCriteria(requests: JobCriteriaPayload[]): Promise<JobCriteriaResponse[]> {
    const backendRequests = requests.map((req) => ({
      jobId: req.jobId,
      criterionName: req.criterionName || req.name || '',
      category: req.category,
      description: req.description,
      weight: req.weight,
    }))
    const response = await axiosClient.post('/api/job-criteria', backendRequests)
    return getResponsePayload(response)
  },

  async getJobCriteriaById(id: string): Promise<JobCriteriaResponse> {
    const response = await axiosClient.get(`/api/job-criteria/${encodeURIComponent(id)}`)
    return getResponsePayload(response)
  },

  async getJobCriteriaByJobId(jobId: string): Promise<JobCriteriaResponse[]> {
    const response = await axiosClient.get(`/api/job-criteria/job/${encodeURIComponent(jobId)}`)
    return getResponsePayload(response)
  },

  async updateJobCriteria(id: string, payload: JobCriteriaPayload): Promise<JobCriteriaResponse> {
    const backendPayload = {
      jobId: payload.jobId,
      criterionName: payload.criterionName || payload.name || '',
      category: payload.category,
      description: payload.description,
      weight: payload.weight,
    }
    const response = await axiosClient.put(`/api/job-criteria/${encodeURIComponent(id)}`, backendPayload)
    return getResponsePayload(response)
  },

  async deleteJobCriteria(id: string) {
    return axiosClient.delete(`/api/job-criteria/${encodeURIComponent(id)}`)
  },
}
