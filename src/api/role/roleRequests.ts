import type { AdminListParams, JobListFilters, JobListRequest, PlanListRequest } from '@/features/admin/types/admin.types'

export const ADMIN_LIST_PAGE_SIZE = 5

export function buildListRequest(defaults: PlanListRequest, params?: AdminListParams): PlanListRequest {
  const page = params?.page ?? defaults.page

  return {
    ...defaults,
    ...params,
    page: Math.max(1, page),
    filters: params?.filters ?? defaults.filters,
  }
}

export function buildJobListRequest(params?: AdminListParams<JobListFilters>): JobListRequest {
  const page = params?.page ?? 1
  const filters = params?.filters
  const hasFilters = Boolean(filters && Object.values(filters).some((value) => String(value ?? '').trim() !== ''))

  return {
    sortField: params?.sortField ?? 'createdAt',
    filters: hasFilters ? filters ?? null : null,
    sortBy: params?.sortBy ?? 'DESC',
    page: Math.max(1, page),
    size: params?.size ?? ADMIN_LIST_PAGE_SIZE,
  }
}
