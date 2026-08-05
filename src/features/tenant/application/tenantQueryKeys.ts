import type { AdminListParams } from '@/core/api/api.types'

export const tenantQueryKeys = {
  all: ['tenant'] as const,
  staffLists: () => [...tenantQueryKeys.all, 'staff-list'] as const,
  staffList: (params?: AdminListParams<Record<string, unknown> | null>) =>
    [...tenantQueryKeys.staffLists(), params ?? {}] as const,
  staffQuota: () => [...tenantQueryKeys.all, 'staff-quota'] as const,
  activityLogs: (params?: AdminListParams<Record<string, unknown> | null>) =>
    [...tenantQueryKeys.all, 'activity-logs', params ?? {}] as const,
}
