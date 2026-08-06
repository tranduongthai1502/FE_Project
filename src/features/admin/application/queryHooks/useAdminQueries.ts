import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi, ADMIN_LIST_PAGE_SIZE } from '../../infrastructure/adminApi'
import { adminQueryKeys } from './adminQueryKeys'
import type { CreatePlanPayload, CreateTenantPayload, UpdatePlanPayload, UpdateTenantPayload } from '../../domain/adminApi.types'

export function useAdminTenants(params: {
  sortField?: string
  filters?: Record<string, unknown>
  sortBy?: 'ASC' | 'DESC'
  page?: number
  size?: number
  enabled?: boolean
}) {
  const { sortField = 'companyName', filters = {}, sortBy = 'ASC', page = 1, size = ADMIN_LIST_PAGE_SIZE, enabled = true } = params

  return useQuery({
    queryKey: adminQueryKeys.tenantList(filters, page, size, sortField, sortBy),
    queryFn: () => adminApi.getTenants({ sortField, filters, sortBy, page, size }),
    enabled,
  })
}

export function useAdminTenantDashboardStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.tenantDashboardStats(),
    queryFn: () => adminApi.getTenantDashboardStats(),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminTenantDetail(tenantId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.tenantDetail(tenantId ?? ''),
    queryFn: () => adminApi.getTenantById(tenantId!),
    enabled: Boolean(tenantId) && (options?.enabled ?? true),
  })
}

export function useAdminTenantUser(tenantId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.tenantAdminUser(tenantId ?? ''),
    queryFn: () => adminApi.getUserById(tenantId!),
    enabled: Boolean(tenantId) && (options?.enabled ?? true),
  })
}

export function useAdminSubscriptionPlans(params?: Record<string, unknown>, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.planList(params),
    queryFn: () => adminApi.getSubscriptionPlans(params),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminPlanDashboardStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.planDashboardStats(),
    queryFn: () => adminApi.getPlanDashboardStats(),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminTopTierPlan(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.topTierPlan(),
    queryFn: () => adminApi.getSubscriptionPlans({ size: 100 }),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminPlanDetail(planId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.planDetail(planId ?? ''),
    queryFn: () => adminApi.getPlanById(planId!),
    enabled: Boolean(planId) && (options?.enabled ?? true),
  })
}

export function useSuperAdminDashboardData(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'super-dashboard-data'],
    queryFn: async () => {
      const [tenants, plans] = await Promise.all([
        adminApi.getTenants({ size: 100 }),
        adminApi.getSubscriptionPlans({ size: 100 }),
      ])
      return { tenants, plans }
    },
    enabled: options?.enabled ?? true,
  })
}

export function useAdminPrompts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.prompts(),
    queryFn: () => adminApi.getPrompts(),
    enabled: options?.enabled ?? true,
  })
}

// Mutations

export function useCreateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTenantPayload) => adminApi.createTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tenants() })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTenantPayload }) => adminApi.updateTenant(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tenants() })
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tenantDetail(id) })
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tenants() })
    },
  })
}

export function useCreatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePlanPayload) => adminApi.createSubscriptionPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.plans() })
    },
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePlanPayload }) => adminApi.updateSubscriptionPlan(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.plans() })
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.planDetail(id) })
    },
  })
}

export function useDeletePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteSubscriptionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.plans() })
    },
  })
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => adminApi.updatePrompt(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.prompts() })
    },
  })
}
