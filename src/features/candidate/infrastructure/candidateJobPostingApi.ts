import axiosClient from '@/core/api/axiosClient'
import type { AdminListParams } from '@/core/api/api.types'
import { attachPaginationMeta } from '@/core/utils/pagination'

export type CandidateJobPosting = {
  id: string
  title: string
  department?: string
  employmentType?: string
  locationType?: string
  location?: string
  applicationDeadline?: string
  salaryMin?: number
  salaryMax?: number
  applicantCount?: number
}

type CandidateJobListFilters = {
  search?: string
  title?: string
  department?: string
  level?: string
  employmentType?: string
  locationType?: string
  status?: string
  tenantId?: string
}

type CandidateJobListRequest = {
  sortField?: string
  filters?: CandidateJobListFilters | null
  sortBy?: 'ASC' | 'DESC'
  page?: number
  size?: number
}

function getJobPostingList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data?.content)) return payload.data.content
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.records)) return payload.data.records
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  return []
}

function getJobPostingSource(job: any): any {
  if (!job || typeof job !== 'object') return job

  return (
    job.jobPosting ||
    job.jobPostingResponse ||
    job.jobPostingDetail ||
    job.jobPostingDto ||
    job.posting ||
    job.job ||
    job.detail ||
    job.record ||
    job.item ||
    job.content ||
    job.data?.jobPosting ||
    job.data?.posting ||
    job.data?.job ||
    job.data?.detail ||
    job.data?.record ||
    job.data?.item ||
    job
  )
}

function getNumberOfApplicant(...sources: any[]): number | undefined {
  for (const source of sources) {
    if (!source || typeof source !== 'object' || !('numberOfApplicant' in source)) continue
    const count = Number(source.numberOfApplicant)
    if (Number.isFinite(count)) return count
  }

  return undefined
}

function normalizeCandidateJobPosting(job: any): CandidateJobPosting | null {
  const source = getJobPostingSource(job)
  const id = source?.id || source?.jobId || source?.job_id || source?.uuid
  if (!id) return null

  return {
    id: String(id),
    title: source?.title || source?.jobTitle || source?.job_title ? String(source?.title || source?.jobTitle || source?.job_title) : '',
    department: source?.department || source?.departmentName || source?.department_name ? String(source?.department || source?.departmentName || source?.department_name) : undefined,
    employmentType: source?.employmentType || source?.employment_type || source?.type ? String(source?.employmentType || source?.employment_type || source?.type) : undefined,
    locationType: source?.locationType || source?.location_type ? String(source?.locationType || source?.location_type) : undefined,
    location: source?.location ? String(source.location) : undefined,
    applicationDeadline: source?.applicationDeadline || source?.application_deadline || source?.deadline
      ? String(source?.applicationDeadline || source?.application_deadline || source?.deadline)
      : undefined,
    salaryMin: source?.salaryMin ?? source?.salary_min ? Number(source?.salaryMin ?? source?.salary_min) : undefined,
    salaryMax: source?.salaryMax ?? source?.salary_max ? Number(source?.salaryMax ?? source?.salary_max) : undefined,
    applicantCount: getNumberOfApplicant(source, job),
  }
}

export const candidateJobPostingApi = {
  async getCompanyJobs(params?: AdminListParams<CandidateJobListFilters>) {
    const request: CandidateJobListRequest = {
      sortField: params?.sortField ?? 'createdAt',
      filters: params?.filters ?? null,
      sortBy: params?.sortBy ?? 'DESC',
      page: params?.page ?? 1,
      size: params?.size ?? 6,
    }

    const response = await axiosClient.post('/api/job-posting/list', request)
    return attachPaginationMeta(
      getJobPostingList(response)
        .map((job) => normalizeCandidateJobPosting(job))
        .filter((job): job is CandidateJobPosting => Boolean(job)),
      response,
    )
  },
}
