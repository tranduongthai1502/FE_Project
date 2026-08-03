import { getListPageCount, getPaginationMeta } from '@/core/utils/pagination'
import type { StaffMember, SubscriptionPlan, Tenant } from '../domain/tenantApi.types'
import { TENANT_ADMIN_LIST_PAGE_SIZE, tenantAdminApi } from '../infrastructure/tenantAdminApi'
import {
  getStaffListItems,
  normalizeStaffAccountLimit,
  normalizeStaffMember,
  type StaffAccountLimit,
} from './tenantStaffNormalizers'

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

export function loadTenantWorkspaceData(tenantId: string, staffPage: number, staffListFilters: Record<string, unknown>) {
  const shouldLoadTenantDetail = Boolean(tenantId)
  const requestKey = getTenantWorkspaceRequestKey(tenantId, staffPage, staffListFilters, shouldLoadTenantDetail)
  const cachedRequest = tenantWorkspaceRequestCache.get(requestKey)

  if (cachedRequest) {
    return cachedRequest
  }

  const request = Promise.all([
    tenantAdminApi.getStaffList({
      sortField: 'createdAt',
      filters: staffListFilters,
      sortBy: 'DESC',
      page: staffPage,
      size: TENANT_ADMIN_LIST_PAGE_SIZE,
    }),
    tenantAdminApi.getStaffAccountLimit(),
    shouldLoadTenantDetail ? tenantAdminApi.getTenantById(tenantId) : Promise.resolve(null),
  ])
    .then(([staffResponse, staffLimitResponse, tenant]) => {
      const payload = staffResponse?.data || staffResponse
      const staffList = getStaffListItems(payload)
        .map((staff) => normalizeStaffMember(staff))
        .filter((staff): staff is StaffMember => Boolean(staff))
      const listWithPagination = Object.assign([...staffList], { __pagination: getPaginationMeta(staffResponse) })

      return {
        staffList: listWithPagination,
        staffPageCount: getListPageCount(listWithPagination, staffPage, TENANT_ADMIN_LIST_PAGE_SIZE),
        staffAccountLimit: normalizeStaffAccountLimit(staffLimitResponse),
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
