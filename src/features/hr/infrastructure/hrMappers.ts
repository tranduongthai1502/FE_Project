import type { JobPosting, JobRevisionHistory } from '@/features/hr/domain/hrApi.types'

export function getJobPostingList(payload: any): any[] {
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

export function normalizeJobPosting(job: any): JobPosting | null {
  const source = getJobPostingDetailSource(job)
  const id = source?.id || source?.jobId || source?.job_id || source?.uuid
  if (!id) return null
  const flag = source?.flag ?? job?.flag ?? job?.data?.flag

  return {
    id: String(id),
    title: String(source?.title || source?.jobTitle || source?.job_title || 'Untitled Job'),
    department: String(source?.department || source?.departmentName || source?.department_name || '-'),
    level: source?.level || source?.jobLevel || source?.job_level ? String(source?.level || source?.jobLevel || source?.job_level) : undefined,
    employmentType: String(source?.employmentType || source?.employment_type || source?.type || '-'),
    locationType: source?.locationType || source?.location_type ? String(source?.locationType || source?.location_type) : undefined,
    location: source?.location ? String(source.location) : undefined,
    applicationDeadline: source?.applicationDeadline || source?.application_deadline || source?.deadline
      ? String(source?.applicationDeadline || source?.application_deadline || source?.deadline)
      : undefined,
    description: source?.description ? String(source.description) : undefined,
    requirements: source?.requirements ? String(source.requirements) : undefined,
    benefits: source?.benefits ? String(source.benefits) : undefined,
    salaryMin: source?.salaryMin ?? source?.salary_min ? Number(source?.salaryMin ?? source?.salary_min) : undefined,
    salaryMax: source?.salaryMax ?? source?.salary_max ? Number(source?.salaryMax ?? source?.salary_max) : undefined,
    status: String(source?.status || source?.jobStatus || source?.job_status || 'DRAFT'),
    applicantCount: Number(source?.applicantCount ?? source?.applicantsCount ?? source?.noOfApplicants ?? source?.numberOfApplicant ?? source?.numberOfApplicants ?? source?.totalApplicants ?? 0) || 0,
    flag: typeof flag === 'boolean' ? flag : undefined,
    createdAt: source?.createdAt || source?.createdDate || source?.created_at ? String(source?.createdAt || source?.createdDate || source?.created_at) : undefined,
    updatedAt: source?.updatedAt || source?.updatedDate || source?.updated_at || source?.modifiedAt || source?.modified_at
      ? String(source?.updatedAt || source?.updatedDate || source?.updated_at || source?.modifiedAt || source?.modified_at)
      : undefined,
    publishedAt: source?.publishedAt || source?.publishedDate || source?.published_at || source?.openedAt || source?.opened_at
      ? String(source?.publishedAt || source?.publishedDate || source?.published_at || source?.openedAt || source?.opened_at)
      : undefined,
    openedAt: source?.openedAt || source?.opened_at || source?.openAt || source?.open_at
      ? String(source?.openedAt || source?.opened_at || source?.openAt || source?.open_at)
      : undefined,
    revisionHistory: getJobRevisionHistoryList(job, source)
      .map((item, index) => normalizeJobRevisionHistory(item, index))
      .filter((item): item is JobRevisionHistory => Boolean(item)),
  }
}

function getJobPostingDetailSource(job: any): any {
  if (!job || typeof job !== 'object') return job

  return (
    job.jobPosting ||
    job.jobPostingResponse ||
    job.jobPostingDetail ||
    job.jobPostingDto ||
    job.job_posting ||
    job.job_posting_response ||
    job.job_posting_detail ||
    job.job_posting_dto ||
    job.posting ||
    job.postingDetail ||
    job.posting_detail ||
    job.job ||
    job.jobDetail ||
    job.job_detail ||
    job.detail ||
    job.record ||
    job.item ||
    job.content ||
    job.data?.jobPosting ||
    job.data?.jobPostingResponse ||
    job.data?.jobPostingDetail ||
    job.data?.jobPostingDto ||
    job.data?.job_posting ||
    job.data?.job_posting_response ||
    job.data?.job_posting_detail ||
    job.data?.job_posting_dto ||
    job.data?.posting ||
    job.data?.postingDetail ||
    job.data?.posting_detail ||
    job.data?.job ||
    job.data?.jobDetail ||
    job.data?.job_detail ||
    job.data?.detail ||
    job.data?.record ||
    job.data?.item ||
    job
  )
}

function getJobRevisionHistoryList(...sources: any[]): any[] {
  const keys = [
    'revisionHistory',
    'revision_history',
    'revisionHistories',
    'revision_histories',
    'revisions',
    'jobRevisionHistory',
    'job_revision_history',
    'jobRevisionHistories',
    'job_revision_histories',
    'jobRevisions',
    'job_revisions',
    'jobPostingHistories',
    'job_posting_histories',
    'jobPostingHistory',
    'job_posting_history',
    'jobHistories',
    'job_histories',
    'jobHistory',
    'job_history',
    'revisionLogs',
    'revision_logs',
    'history',
    'histories',
    'logs',
    'auditLogs',
    'audit_logs',
    'auditTrail',
    'audit_trail',
    'activities',
    'activityLogs',
    'activity_logs',
  ]

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    for (const key of keys) {
      const candidate = source[key]
      if (Array.isArray(candidate)) return candidate
      if (Array.isArray(candidate?.content)) return candidate.content
      if (Array.isArray(candidate?.items)) return candidate.items
      if (Array.isArray(candidate?.records)) return candidate.records
      if (Array.isArray(candidate?.list)) return candidate.list
      if (Array.isArray(candidate?.data)) return candidate.data
      if (Array.isArray(candidate?.data?.content)) return candidate.data.content
      if (Array.isArray(candidate?.data?.items)) return candidate.data.items
      if (Array.isArray(candidate?.data?.records)) return candidate.data.records
      if (Array.isArray(candidate?.data?.list)) return candidate.data.list
    }
  }

  return []
}

function normalizeJobRevisionHistory(item: any, index: number): JobRevisionHistory | null {
  if (!item || typeof item !== 'object') return null

  const action = item?.action || item?.title || item?.eventName || item?.event_name || item?.eventType || item?.event_type
  if (!action) return null

  return {
    id: item?.id || item?.revisionId || item?.revision_id || item?.logId || item?.log_id
      ? String(item?.id || item?.revisionId || item?.revision_id || item?.logId || item?.log_id)
      : `${action}-${index}`,
    action: String(action),
    actorName: item?.actorName || item?.actor_name || item?.updatedBy || item?.updated_by || item?.createdBy || item?.created_by || item?.userName || item?.user_name
      ? String(item?.actorName || item?.actor_name || item?.updatedBy || item?.updated_by || item?.createdBy || item?.created_by || item?.userName || item?.user_name)
      : undefined,
    createdAt: item?.createdAt || item?.created_at || item?.timestamp || item?.eventTime || item?.event_time || item?.time
      ? String(item?.createdAt || item?.created_at || item?.timestamp || item?.eventTime || item?.event_time || item?.time)
      : undefined,
  }
}
