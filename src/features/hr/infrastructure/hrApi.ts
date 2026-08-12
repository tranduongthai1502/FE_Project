import axiosClient from '@/core/api/axiosClient'
import { API_LIST_PAGE_SIZE } from '@/core/api/apiConstants'
import type {
  AdminListParams,
} from '@/core/api/api.types'
import type {
  DashboardStatsJobPostingResponse,
  GenerateJobPostingAiRequest,
  GenerateJobPostingAiResponse,
  JobCriteriaPayload,
  JobCriteriaResponse,
  JobListFilters,
  JobListRequest,
  JobPostingLimitResponse,
  JobPosting,
  JobPostingPayload,
} from '@/features/hr/domain/hrApi.types'
import { attachPaginationMeta } from '@/core/utils/pagination'
import {
  getResponsePayload,
} from '@/core/api/apiMappers'
import {
  getJobPostingList,
  normalizeJobPosting,
} from './hrMappers'

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

function pickAiPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload
  if (payload.data && typeof payload.data === 'object') return pickAiPayload(payload.data)
  if (payload.result && typeof payload.result === 'object') return pickAiPayload(payload.result)
  if (payload.jobPosting && typeof payload.jobPosting === 'object') return pickAiPayload(payload.jobPosting)
  if (payload.jobDescription && typeof payload.jobDescription === 'object') return pickAiPayload(payload.jobDescription)
  return payload
}

function toText(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean).join('\n')
  return String(value ?? '').trim()
}

function normalizeGeneratedJobPosting(payload: any): GenerateJobPostingAiResponse {
  const item = pickAiPayload(payload)
  if (!item || typeof item !== 'object') return {}

  return {
    title: toText(item.title ?? item.jobTitle ?? item.job_title),
    jobTitle: toText(item.jobTitle ?? item.job_title ?? item.title),
    department: toText(item.department),
    employmentType: toText(item.employmentType ?? item.employment_type),
    locationType: toText(item.locationType ?? item.location_type),
    location: toText(item.location),
    applicationDeadline: toText(item.applicationDeadline ?? item.application_deadline ?? item.deadline),
    description: toText(item.description ?? item.jobDescription ?? item.job_description ?? item.summary),
    jobDescription: toText(item.jobDescription ?? item.job_description ?? item.description ?? item.summary),
    requirements: toText(item.requirements ?? item.keySkills ?? item.key_skills ?? item.skills ?? item.additionalRequirements),
    keySkills: Array.isArray(item.keySkills ?? item.key_skills ?? item.skills)
      ? (item.keySkills ?? item.key_skills ?? item.skills).map((skill: unknown) => String(skill ?? '').trim()).filter(Boolean)
      : toText(item.keySkills ?? item.key_skills ?? item.skills),
    additionalRequirements: toText(item.additionalRequirements ?? item.additional_requirements),
    benefits: toText(item.benefits),
    salaryMin: item.salaryMin ?? item.salary_min ?? item.minSalary ?? item.min_salary,
    salaryMax: item.salaryMax ?? item.salary_max ?? item.maxSalary ?? item.max_salary,
    status: toText(item.status),
  }
}

function normalizeJobPostingLimit(payload: any): JobPostingLimitResponse {
  const item = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  if (!item || typeof item !== 'object') return {}

  const limitKeys = ['activeJobPostingLimit', 'activeJobPostingsLimit', 'maxActiveJobs', 'jobPostingLimit', 'limit', 'max']
  const limitKey = limitKeys.find((key) => Object.prototype.hasOwnProperty.call(item, key))
  const rawLimit = limitKey ? item[limitKey] : undefined
  const used = Number(item.activeJobPostingUsed ?? item.activeJobPostingsUsed ?? item.currentActiveJobs ?? item.jobPostingUsed ?? item.used ?? item.current ?? item.count)
  const limit = Number(rawLimit)
  const unlimited = rawLimit === null || Boolean(item.activeJobPostingUnlimited ?? item.activeJobPostingsUnlimited ?? item.jobPostingUnlimited ?? item.unlimited)

  return {
    activeJobPostingUsed: Number.isFinite(used) ? used : undefined,
    activeJobPostingLimit: Number.isFinite(limit) ? limit : undefined,
    activeJobPostingUnlimited: unlimited,
    used: Number.isFinite(used) ? used : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
    unlimited,
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

  async getJobPostingLimit(): Promise<JobPostingLimitResponse> {
    const response = await axiosClient.get('/api/job-posting/limit')
    return normalizeJobPostingLimit(getResponsePayload(response))
  },

  async getJobPostingById(id: string) {
    const response = await axiosClient.get(`/api/job-posting/${encodeURIComponent(id)}`)
    const payload = getResponsePayload(response)
    const job = normalizeJobPosting(payload)

    if (!job) {
      throw new Error('Job posting not found')
    }

    console.log('[hrApi.getJobPostingById] raw BE payload', payload)
    console.log('[hrApi.getJobPostingById] normalized revision history', {
      count: job.revisionHistory?.length || 0,
      items: job.revisionHistory || [],
    })

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

  async generateJobPostingAi(payload: GenerateJobPostingAiRequest): Promise<GenerateJobPostingAiResponse> {
    const response = await axiosClient.post('/api/job-posting/generate-jd', payload)
    return normalizeGeneratedJobPosting(getResponsePayload(response))
  },

  async createJobCriteria(requests: JobCriteriaPayload[]): Promise<JobCriteriaResponse[]> {
    const backendRequests = requests.map((req) => ({
      ...(req.id ? { id: req.id } : {}),
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

  async deleteJobCriteriaByJobId(jobId: string) {
    return axiosClient.delete(`/api/job-criteria/job/${encodeURIComponent(jobId)}`)
  },
}
