export const adminQueryKeys = {
  all: ['admin'] as const,

  tenants: () => [...adminQueryKeys.all, 'tenants'] as const,
  tenantsLists: () => [...adminQueryKeys.tenants(), 'list'] as const,
  tenantList: (filters: Record<string, unknown>, page: number, size: number, sortField?: string, sortBy?: string) =>
    [...adminQueryKeys.tenantsLists(), { filters, page, size, sortField, sortBy }] as const,
  tenantDashboardStats: () => [...adminQueryKeys.tenants(), 'dashboard-stats'] as const,
  tenantDetail: (id: string) => [...adminQueryKeys.tenants(), 'detail', id] as const,
  tenantAdminUser: (tenantId: string) => [...adminQueryKeys.tenants(), 'admin-user', tenantId] as const,

  plans: () => [...adminQueryKeys.all, 'plans'] as const,
  plansLists: () => [...adminQueryKeys.plans(), 'list'] as const,
  planList: (params?: Record<string, unknown>) => [...adminQueryKeys.plansLists(), { params }] as const,
  planDashboardStats: () => [...adminQueryKeys.plans(), 'dashboard-stats'] as const,
  topTierPlan: () => [...adminQueryKeys.plans(), 'top-tier'] as const,
  planDetail: (id: string) => [...adminQueryKeys.plans(), 'detail', id] as const,

  prompts: () => [...adminQueryKeys.all, 'prompts'] as const,



  TENANT_LIST: 'TENANT_LIST',
}






