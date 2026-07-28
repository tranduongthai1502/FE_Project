import axiosClient from '@/services/api/axiosClient'
import { API_LIST_PAGE_SIZE } from '@/services/api/apiConstants'
import type {
  AdminListParams,
  DashboardStatsJobPostingResponse,
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

function normalizeApplicationDeadline(value?: string | null): string | null {
  if (!value || !value.trim()) return null
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T23:59:59`
  }
  return trimmed
}

function normalizeEmploymentType(value?: string): string {
  const norm = String(value || '').toUpperCase().replace(/[- ]/g, '_')
  if (norm === 'FULLTIME' || norm === 'FULL_TIME') return 'FULL_TIME'
  if (norm === 'PARTTIME' || norm === 'PART_TIME') return 'PART_TIME'
  if (norm === 'CONTRACT') return 'CONTRACT'
  if (norm === 'INTERNSHIP' || norm === 'INTERN') return 'INTERNSHIP'
  if (norm === 'TEMPORARY' || norm === 'TEMP') return 'TEMPORARY'
  return 'FULL_TIME'
}

function normalizeLocationType(value?: string): string {
  const norm = String(value || '').toUpperCase().replace(/[- ]/g, '_')
  if (norm === 'ON_SITE' || norm === 'ONSITE' || norm === 'OFFICE') return 'OFFICE'
  if (norm === 'REMOTE') return 'REMOTE'
  if (norm === 'HYBRID') return 'HYBRID'
  return 'OFFICE'
}

function normalizeJobStatus(value?: string): string {
  const norm = String(value || '').toUpperCase()
  if (norm === 'OPEN' || norm === 'PUBLISHED' || norm === 'ACTIVE') return 'OPEN'
  if (norm === 'CLOSED' || norm === 'INACTIVE') return 'CLOSED'
  return 'DRAFT'
}

function buildJobListRequest(params?: AdminListParams<JobListFilters>): JobListRequest {
  const page = params?.page ?? 1
  const rawFilters = params?.filters
  let cleanedFilters: JobListFilters | null = null

  if (rawFilters && typeof rawFilters === 'object') {
    const entries = Object.entries(rawFilters)
      .map(([key, val]) => {
        const strVal = String(val ?? '').trim()
        if (!strVal) return null
        if (key === 'employmentType') return [key, normalizeEmploymentType(strVal)]
        if (key === 'locationType') return [key, normalizeLocationType(strVal)]
        if (key === 'status') return [key, normalizeJobStatus(strVal)]
        return [key, strVal]
      })
      .filter((entry): entry is [string, string] => entry !== null)

    if (entries.length > 0) {
      cleanedFilters = Object.fromEntries(entries) as JobListFilters
    }
  }

  return {
    sortField: params?.sortField ?? 'createdAt',
    filters: cleanedFilters,
    sortBy: params?.sortBy ?? 'DESC',
    page: Math.max(1, page),
    size: params?.size ?? HR_LIST_PAGE_SIZE,
  }
}

function buildBackendJobPostingPayload(payload: JobPostingPayload) {
  return {
    title: payload.title?.trim() || '',
    department: payload.department?.trim() || '',
    level: payload.level?.trim() || null,
    employmentType: normalizeEmploymentType(payload.employmentType),
    locationType: normalizeLocationType(payload.locationType),
    location: payload.location?.trim() || '',
    applicationDeadline: normalizeApplicationDeadline(payload.applicationDeadline),
    description: payload.description || '',
    requirements: payload.requirements || '',
    benefits: payload.benefits || null,
    salaryMin: typeof payload.salaryMin === 'number' && payload.salaryMin >= 0 ? payload.salaryMin : null,
    salaryMax: typeof payload.salaryMax === 'number' && payload.salaryMax >= 0 ? payload.salaryMax : null,
    status: normalizeJobStatus(payload.status),
  }
}

function getJobCriteriaList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.content)) return payload.data.content
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.records)) return payload.data.records
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  if (payload && typeof payload === 'object') return [payload]
  return []
}

function normalizeJobCriteria(item: any): JobCriteriaResponse | null {
  if (!item || typeof item !== 'object') return null

  const id = String(item.id ?? item.criteriaId ?? '')
  const jobId = String(item.jobId ?? item.job?.id ?? '')
  const criterionName = String(item.criterionName ?? item.name ?? '')

  if (!id && !criterionName) return null

  return {
    id,
    jobId,
    category: item.category,
    criterionName,
    name: criterionName,
    weight: item.weight === undefined || item.weight === null ? undefined : Number(item.weight),
    description: item.description ?? '',
    sortOrder: item.sortOrder === undefined || item.sortOrder === null ? undefined : Number(item.sortOrder),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
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

  async getJobPostingStats(): Promise<DashboardStatsJobPostingResponse> {
    const response = await axiosClient.get('/api/dashboard/stats/job-posting')
    return getResponsePayload(response)
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
    const backendPayload = buildBackendJobPostingPayload(payload)
    const response = await axiosClient.post('/api/job-posting', backendPayload)
    return normalizeJobPosting(getResponsePayload(response))
  },

  async updateJobPosting(id: string, payload: JobPostingPayload) {
    const backendPayload = buildBackendJobPostingPayload(payload)
    const response = await axiosClient.put(`/api/job-posting/${encodeURIComponent(id)}`, backendPayload)
    return normalizeJobPosting(getResponsePayload(response))
  },

  async deleteJobPosting(id: string) {
    return axiosClient.delete(`/api/job-posting/${encodeURIComponent(id)}`)
  },

  async checkTitleUniqueness(title: string, excludeId?: string) {
    const params = new URLSearchParams({ title })
    if (excludeId) params.append('excludeId', excludeId)
    const response = await axiosClient.get(`/api/job-posting/check-title?${params.toString()}`)
    return getResponsePayload(response)
  },

  async createJobCriteria(requests: JobCriteriaPayload[]): Promise<JobCriteriaResponse[]> {
    const backendRequests = requests.map((req) => ({
      jobId: req.jobId,
      criterionName: req.criterionName || req.name || '',
      description: req.description,
      category: req.category,
      weight: req.weight,
    }))
    const response = await axiosClient.post('/api/job-criteria', backendRequests)
    return getJobCriteriaList(getResponsePayload(response))
      .map((item) => normalizeJobCriteria(item))
      .filter((item): item is JobCriteriaResponse => Boolean(item))
  },

  async getJobCriteriaById(id: string): Promise<JobCriteriaResponse> {
    const response = await axiosClient.get(`/api/job-criteria/${encodeURIComponent(id)}`)
    return normalizeJobCriteria(getResponsePayload(response)) as JobCriteriaResponse
  },

  async getJobCriteriaByJobId(jobId: string): Promise<JobCriteriaResponse[]> {
    const response = await axiosClient.get(`/api/job-criteria/job/${encodeURIComponent(jobId)}`)
    return getJobCriteriaList(getResponsePayload(response))
      .map((item) => normalizeJobCriteria(item))
      .filter((item): item is JobCriteriaResponse => Boolean(item))
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
    return normalizeJobCriteria(getResponsePayload(response)) as JobCriteriaResponse
  },

  async deleteJobCriteria(id: string) {
    return axiosClient.delete(`/api/job-criteria/${encodeURIComponent(id)}`)
  },
}
