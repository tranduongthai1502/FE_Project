export type SuperAdminView = 'dashboard' | 'tenantManagement' | 'subscriptionPlans' | 'promptManagement' | 'settings'

export type RoleHomeView = 'dashboard' | 'jobs' | 'settings'

export type TenantAdminView = RoleHomeView | 'staffManagement' | 'staffCreate' | 'staffEdit' | 'staffDetail' | 'staffActivityLog'
