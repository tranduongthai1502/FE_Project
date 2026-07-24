import axiosClient from '../client/axiosClient'
import type { AdminListParams, ActivityLog, Tenant } from '@/features/admin/types/admin.types'
import {
  attachPaginationMeta,
  getResponsePayload,
  getUserDetailPayload,
  normalizeTenant,
  normalizeTenantAdminUser,
} from '@/features/admin/utils/adminMappers'
import { getActivityLogList, normalizeActivityLog } from './roleAdapters'
import { ADMIN_LIST_PAGE_SIZE, buildListRequest } from './roleRequests'

type StaffPayload = {
  email: string
  fullName: string
  role: string[]
  status?: string
  tenantId?: string
}

export const tenantAdminApi = {
  async getStaffList(pageOrParams: number | AdminListParams = 1, size = ADMIN_LIST_PAGE_SIZE) {
    const params = typeof pageOrParams === 'number'
      ? { page: pageOrParams, size }
      : pageOrParams
    const request = buildListRequest({
      sortField: 'fullName',
      filters: {},
      sortBy: 'ASC',
      page: 1,
      size: ADMIN_LIST_PAGE_SIZE,
    }, params)

    console.log('[tenantAdminApi.getStaffList] request payload', request)
    return axiosClient.post('/api/user/staff/list', request)
  },

  async getStaffAccountLimit() {
    return axiosClient.get('/api/user/staff/limit')
  },

  async getTenantById(id: string) {
    const response = await axiosClient.get(`/api/tenant/${encodeURIComponent(id)}`)
    const tenant = normalizeTenant(getResponsePayload(response))

    if (!tenant) {
      throw new Error('Tenant detail not found')
    }

    return tenant as Tenant
  },

  async getUserById(id: string) {
    const response = await axiosClient.get(`/api/user/${encodeURIComponent(id)}`)
    const user = normalizeTenantAdminUser(getUserDetailPayload(response))

    if (!user) {
      throw new Error('User detail not found')
    }

    return user
  },

  async getActivityLogs(params?: AdminListParams) {
    const request = buildListRequest({
      sortField: 'createdAt',
      filters: {},
      sortBy: 'DESC',
      page: 1,
      size: ADMIN_LIST_PAGE_SIZE,
    }, params)

    console.log('[tenantAdminApi.getActivityLogs] request payload', request)
    const response = await axiosClient.post('/api/activity-log/list', request)

    return attachPaginationMeta(getActivityLogList(response)
      .map((log, index) => normalizeActivityLog(log, index))
      .filter((log): log is ActivityLog => Boolean(log)), response)
  },

  async createStaff(payload: StaffPayload) {
    return axiosClient.post('/api/user/staff', payload)
  },

  async updateStaff(id: string, payload: StaffPayload) {
    return axiosClient.put(`/api/user/staff/${encodeURIComponent(id)}`, payload)
  },

  async deleteStaff(id: string) {
    return axiosClient.delete(`/api/user/staff/${encodeURIComponent(id)}`)
  },
}
