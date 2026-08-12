import { validateEmail, validationErrorMessages } from '@/core/api/axiosErrorHandler'
import { mapErrorTextToFieldErrors } from '@/core/utils/errors/fieldErrorUtils'
import type { AdminListParams } from '@/core/api/api.types'
import type { CreateTenantForm, SubscriptionPlan, Tenant } from '@/features/admin/domain/adminApi.types'
import { ADMIN_LIST_PAGE_SIZE } from './adminApi'
import type { CreateTenantFieldErrors } from '../presentation/components/tenant/CreateTenant'

export type TenantStatusFilter = 'all' | 'active' | 'inactive'

export const requiredTenantFieldMessage = validationErrorMessages.requiredField
export const duplicateCompanyNameMessage = validationErrorMessages.duplicateCompanyName
export const duplicateAdminEmailMessage = 'This email address is already in use.'
export const invalidTenantEmailMessage = validationErrorMessages.validEmailAddressRequired
export const PLAN_FILTER_LIST_SIZE = 100

export const emptyTenantForm: CreateTenantForm = {
  companyName: '',
  domain: '',
  industry: '',
  region: '',
  planId: '',
  adminFullName: '',
  adminEmail: '',
}

export function normalizeFilterValue(value?: string) {
  return String(value || '').trim().toLowerCase()
}

export function tenantHasCompanyName(tenants: Tenant[], companyName: string) {
  const normalizedCompanyName = normalizeFilterValue(companyName)
  if (!normalizedCompanyName) return false

  return tenants.some((tenant) => normalizeFilterValue(tenant.name) === normalizedCompanyName)
}

export function isValidTenantAdminEmail(email: string) {
  return !validateEmail(email)
}

export function tenantMatchesPlanFilter(tenant: Tenant, selectedPlanId: string, selectedPlan?: SubscriptionPlan) {
  if (!selectedPlanId) return true

  const selectedId = normalizeFilterValue(selectedPlanId)
  const selectedName = normalizeFilterValue(selectedPlan?.name)
  const tenantPlanId = normalizeFilterValue(tenant.subscriptionPlanId)
  const tenantPlanName = normalizeFilterValue(tenant.subscriptionPlanDetail?.name || tenant.subscriptionPlan)

  return (
    tenantPlanId === selectedId ||
    tenantPlanName === selectedId ||
    Boolean(selectedName && (tenantPlanName === selectedName || tenantPlanId === selectedName))
  )
}

export function buildTenantListParams(
  statusFilter: TenantStatusFilter,
  planFilter: string,
  searchQuery: string,
  page: number,
): AdminListParams {
  const filters: Record<string, unknown> = {}
  const keyword = searchQuery.trim()
  const selectedPlan = planFilter.trim()

  if (statusFilter === 'active') {
    filters.status = 'ACTIVE'
  }

  if (statusFilter === 'inactive') {
    filters.status = 'INACTIVE'
  }

  if (keyword) {
    filters.search = keyword
  }

  if (selectedPlan) {
    filters.planId = selectedPlan
  }

  return {
    sortField: 'createdAt',
    filters,
    sortBy: 'DESC',
    page,
    size: ADMIN_LIST_PAGE_SIZE,
  }
}

export function getCreateTenantFieldErrors(error: unknown, message: string): CreateTenantFieldErrors {
  return mapErrorTextToFieldErrors<keyof CreateTenantFieldErrors>(error, message, [
    { field: 'adminEmail', message: duplicateAdminEmailMessage, keywords: ['email', 'email_already_exists', 'duplicate_email'] },
    { field: 'domain', message: 'Domain already exists. Please use another domain.', keywords: ['domain'] },
    { field: 'companyName', message: duplicateCompanyNameMessage, keywords: ['company', 'tenant', 'name_already_exists', 'duplicate_name'] },
  ])
}
