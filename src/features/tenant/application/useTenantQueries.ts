import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminListParams } from '@/core/api/api.types'
import { tenantAdminApi } from '../infrastructure/tenantAdminApi'
import { tenantQueryKeys } from './tenantQueryKeys'
import { downloadBlob } from '../infrastructure/tenantFileDownloader'

export function mapActivityLogParams(
  params?: AdminListParams<Record<string, unknown> | null>
): AdminListParams<Record<string, unknown> | null> {
  const uiPage = params?.page ?? 1
  return {
    ...params,
    page: Math.max(0, uiPage - 1),
  }
}

export function useTenantStaffList(
  params?: AdminListParams<Record<string, unknown> | null>
) {
  return useQuery({
    queryKey: tenantQueryKeys.staffList(params),
    queryFn: async () => {
      const response = await tenantAdminApi.getStaffList(params)
      return tenantAdminApi.normalizeStaffList(response)
    },
  })
}

export function useTenantStaffQuota() {
  return useQuery({
    queryKey: tenantQueryKeys.staffQuota(),
    queryFn: async () => {
      const response = await tenantAdminApi.getStaffAccountLimit()
      return response?.data ?? response
    },
  })
}

export function useActivityLogs(
  params?: AdminListParams<Record<string, unknown> | null>
) {
  return useQuery({
    queryKey: tenantQueryKeys.activityLogs(params),
    queryFn: () => tenantAdminApi.getActivityLogs(params),
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { email: string; fullName: string; role: string[]; status?: string; tenantId?: string }) =>
      tenantAdminApi.createStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.staffLists() })
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.staffQuota() })
    },
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { email: string; fullName: string; role: string[]; status?: string; tenantId?: string } }) =>
      tenantAdminApi.updateStaff(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.staffLists() })
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.staffQuota() })
    },
  })
}

export function useDeleteStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tenantAdminApi.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.staffLists() })
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.staffQuota() })
    },
  })
}

export function useResendStaffActivation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tenantAdminApi.resendStaffActivation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.staffLists() })
    },
  })
}

export function useExportStaffActivityLogs() {
  return useMutation({
    mutationFn: async ({ staffId, filename }: { staffId: string; filename?: string }) => {
      const response = await tenantAdminApi.exportStaffActivityLogs(staffId)
      const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data || response])
      const name = filename || `activity_log_${staffId}.xlsx`
      downloadBlob(blob, name)
      return true
    },
  })
}
