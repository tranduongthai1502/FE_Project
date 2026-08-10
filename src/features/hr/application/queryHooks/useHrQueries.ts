import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminListParams } from '@/core/api/api.types'
import type {
  JobCriteriaPayload,
  JobListFilters,
  JobPostingPayload,
} from '@/features/hr/domain/hrApi.types'
import { hrApi } from '../../infrastructure/hrApi'
import { hrQueryKeys } from './hrQueryKeys'

export function useJobPostings(params?: AdminListParams<JobListFilters>) {
  return useQuery({
    queryKey: hrQueryKeys.list(params),
    queryFn: () => hrApi.getJobPostings(params),
  })
}

export function useJobPostingDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: hrQueryKeys.detail(id),
    queryFn: () => hrApi.getJobPostingById(id),
    enabled: Boolean(id) && enabled,
  })
}

export function useJobPostingStats() {
  return useQuery({
    queryKey: hrQueryKeys.stats(),
    queryFn: () => hrApi.getJobPostingStats(),
  })
}

export function useJobPostingLimit() {
  return useQuery({
    queryKey: hrQueryKeys.jobPostingLimit(),
    queryFn: () => hrApi.getJobPostingLimit(),
  })
}

export function useJobCriteria(jobId: string, enabled = true) {
  return useQuery({
    queryKey: hrQueryKeys.criteria(jobId),
    queryFn: () => hrApi.getJobCriteriaByJobId(jobId),
    enabled: Boolean(jobId) && enabled,
  })
}

export function useCreateJobPosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: JobPostingPayload) => hrApi.createJobPosting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.stats() })
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.jobPostingLimit() })
    },
  })
}

export function useUpdateJobPosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: JobPostingPayload }) =>
      hrApi.updateJobPosting(id, payload),
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.stats() })
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.jobPostingLimit() })
      if (updatedJob?.id) {
        queryClient.invalidateQueries({ queryKey: hrQueryKeys.detail(updatedJob.id) })
      }
    },
  })
}

export function useDeleteJobPosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => hrApi.deleteJobPosting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.stats() })
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.jobPostingLimit() })
    },
  })
}

export function useSaveJobCriteria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      jobId,
      createdRows,
      deletedIds,
    }: {
      jobId: string
      createdRows: JobCriteriaPayload[]
      deletedIds: string[]
    }) => {
      if (deletedIds.length > 0) {
        await Promise.all(deletedIds.map((id) => hrApi.deleteJobCriteria(id)))
      }
      if (createdRows.length > 0) {
        await hrApi.createJobCriteria(createdRows)
      }
      return hrApi.getJobCriteriaByJobId(jobId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.criteria(variables.jobId) })
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.detail(variables.jobId) })
    },
  })
}
