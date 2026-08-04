import { getListPageCount } from '@/core/utils/pagination'
import type { StaffMember, SubscriptionPlan, Tenant } from '../domain/tenantApi.types'
import type { StaffAccountLimit } from '../domain/tenantApi.types'
import { TENANT_STAFF_LIST_PAGE_SIZE } from '../domain/tenantPagination'
import type { TenantAdminRepository } from './tenantAdminRepository'

export type TenantWorkspaceData = {
  staffList: StaffMember[]
  staffPageCount: number
  staffAccountLimit: StaffAccountLimit
  tenantDetail: Tenant | null
  tenantPlan: SubscriptionPlan | null
}

const tenantWorkspaceRequestCache = new Map<string, Promise<TenantWorkspaceData>>()

export function getTenantWorkspaceRequestKey(
  tenantId: string,
  staffPage: number,
  staffListFilters: Record<string, unknown>,
  shouldLoadTenantDetail: boolean,
) {
  return JSON.stringify({
    tenantId,
    staffPage,
    staffListFilters,
    shouldLoadTenantDetail,
  })
}

export function loadTenantWorkspaceData(
  repository: TenantAdminRepository,
  tenantId: string,
  staffPage: number,
  staffListFilters: Record<string, unknown>,
) {
  const shouldLoadTenantDetail = Boolean(tenantId)
  const requestKey = getTenantWorkspaceRequestKey(tenantId, staffPage, staffListFilters, shouldLoadTenantDetail)
  const cachedRequest = tenantWorkspaceRequestCache.get(requestKey)

  if (cachedRequest) {
    return cachedRequest
  }

  const request = Promise.all([
    repository.getStaffList({
      sortField: 'createdAt',
      filters: staffListFilters,
      sortBy: 'DESC',
      page: staffPage,
      size: TENANT_STAFF_LIST_PAGE_SIZE,
    }),
    repository.getStaffAccountLimit(),
    shouldLoadTenantDetail ? repository.getTenantById(tenantId) : Promise.resolve(null),
  ])
    .then(([staffList, staffAccountLimit, tenant]) => {
      return {
        staffList,
        staffPageCount: getListPageCount(staffList, staffPage, TENANT_STAFF_LIST_PAGE_SIZE),
        staffAccountLimit,
        tenantDetail: tenant,
        tenantPlan: tenant?.subscriptionPlanDetail || null,
      }
    })
    .finally(() => {
      tenantWorkspaceRequestCache.delete(requestKey)
    })

  tenantWorkspaceRequestCache.set(requestKey, request)
  return request
}
