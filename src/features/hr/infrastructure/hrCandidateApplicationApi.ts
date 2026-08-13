import axiosClient from '@/core/api/axiosClient'
import { attachPaginationMeta } from '@/core/utils/pagination'
import type { Candidate } from '../domain/candidate.types'

function getCandidateApplicationList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data?.content)) return payload.data.content
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.records)) return payload.data.records
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.data?.data?.content)) return payload.data.data.content
  return []
}

function formatDate(value: unknown) {
  if (!value) return '-'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function normalizeCandidateApplication(item: any): Candidate | null {
  const source = item?.candidateApplication || item?.application || item?.data || item
  const candidate = source?.candidate || source?.candidateInfo || source?.candidate_info || source?.user || {}
  const job = source?.jobPosting || source?.job || source?.job_posting || {}
  const id = source?.id || source?.applicationId || source?.application_id || source?.candidateApplicationId || source?.candidate_application_id
  const candidateId =
    source?.candidateId ||
    source?.candidate_id ||
    candidate?.id ||
    candidate?.candidateId ||
    candidate?.candidate_id ||
    candidate?.userId ||
    candidate?.user_id
  const jobId =
    source?.jobId ||
    source?.job_id ||
    source?.jobPostingId ||
    source?.job_posting_id ||
    job?.id ||
    job?.jobId ||
    job?.job_id ||
    job?.jobPostingId ||
    job?.job_posting_id

  if (!id) return null

  return {
    id: String(id),
    candidateId: candidateId ? String(candidateId) : undefined,
    jobId: jobId ? String(jobId) : undefined,
    name: String(
      candidate?.fullName ||
      candidate?.full_name ||
      candidate?.name ||
      source?.candidateName ||
      source?.candidate_name ||
      source?.fullName ||
      source?.full_name ||
      source?.email ||
      'Candidate'
    ),
    targetJob: String(
      job?.title ||
      job?.jobTitle ||
      job?.job_title ||
      source?.jobTitle ||
      source?.job_title ||
      source?.targetJob ||
      source?.target_job ||
      '-'
    ),
    matchScore: Number(
      source?.matchingScore ??
      source?.candidateSelfScore ??
      source?.matchScore ??
      source?.match_score ??
      source?.score ??
      0
    ) || 0,
    recruitmentStage: String(
      source?.recruitmentStage ||
      source?.recruitment_stage ||
      source?.stage ||
      source?.status ||
      'Screening'
    ),
    dateApplied: formatDate(
      source?.appliedAt ||
      source?.applied_at ||
      source?.createdAt ||
      source?.created_at ||
      source?.applicationDate ||
      source?.application_date
    ),
    reviewed: Boolean(source?.reviewed ?? source?.isReviewed ?? source?.is_reviewed ?? source?.reviewedAt ?? source?.reviewed_at),
  }
}

export type CandidateApplicationListParams = {
  page?: number
  size?: number
  sortField?: string
  sortBy?: 'ASC' | 'DESC'
  filters?: Record<string, unknown>
}

export const hrCandidateApplicationApi = {
  async getCandidateApplications(params?: CandidateApplicationListParams) {
    const request = {
      sortField: params?.sortField ?? 'createdAt',
      filters: params?.filters ?? {},
      sortBy: params?.sortBy ?? 'DESC',
      page: Math.max(1, params?.page ?? 1),
      size: params?.size ?? 5,
    }

    const response = await axiosClient.post('/api/candidate-application/list', request)

    return attachPaginationMeta(getCandidateApplicationList(response)
      .map(normalizeCandidateApplication)
      .filter((candidate): candidate is Candidate => Boolean(candidate)), response)
  },

  async getCandidateApplicationById(id: string) {
    const response = await axiosClient.get(`/api/candidate-application/${encodeURIComponent(id)}`)
    return normalizeCandidateApplication(response) || normalizeCandidateApplication(response?.data)
  },

  async markAsReviewed(id: string) {
    const response = await axiosClient.patch(`/api/candidate-application/${encodeURIComponent(id)}/review`)
    return response.data
  },

  async updateCandidateApplicationStatus(id: string, status: string) {
    const response = await axiosClient.patch(`/api/candidate-application/${encodeURIComponent(id)}/status`, { status })
    return response.data
  },

  async getCandidateResumeByJobAndCandidate(jobId: string, candidateId: string) {
    const response = await axiosClient.get(
      `/api/candidate/resume/job/${encodeURIComponent(jobId)}/candidate/${encodeURIComponent(candidateId)}`,
    )
    return response.data
  },
}
