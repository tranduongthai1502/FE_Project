import type { AdminListParams } from '@/core/api/api.types'
import type { JobListFilters } from '@/features/hr/domain/hrApi.types'

export const hrQueryKeys = {
  all: ['hr'] as const,
  lists: () => [...hrQueryKeys.all, 'job-postings'] as const,
  list: (params?: AdminListParams<JobListFilters>) => [...hrQueryKeys.lists(), params ?? {}] as const,
  details: () => [...hrQueryKeys.all, 'job-posting'] as const,
  detail: (id: string) => [...hrQueryKeys.details(), id] as const,
  stats: () => [...hrQueryKeys.all, 'dashboard-stats'] as const,
  jobPostingLimit: () => [...hrQueryKeys.all, 'job-posting-limit'] as const,
  criteria: (jobId: string) => [...hrQueryKeys.all, 'job-criteria', jobId] as const,
}
