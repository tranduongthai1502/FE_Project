import axiosClient from '@/services/api/axiosClient'
import { API_LIST_PAGE_SIZE } from '@/services/api/apiConstants'
import type {
  ActivityLog,
  AdminListParams,
  StaffMember,
  TenantAdminUser,
} from '@/services/api/api.types'
import { attachPaginationMeta } from '@/utils/pagination'
import {
  getResponsePayload,
  getTenantList,
  getUserDetailPayload,
  normalizeTenant,
  normalizeTenantAdminUser,
} from '@/services/api/apiMappers'

export const TENANT_ADMIN_LIST_PAGE_SIZE = API_LIST_PAGE_SIZE

type StaffPayload = {
  email: string
  fullName: string
  role: string[]
  status?: string
  tenantId?: string
}

function buildListRequest(params?: AdminListParams<Record<string, unknown> | null>): AdminListParams<Record<string, unknown> | null> {
  const page = params?.page ?? 1

  return {
    sortField: params?.sortField ?? 'createdAt',
    filters: params?.filters ?? null,
    sortBy: params?.sortBy ?? 'DESC',
    page: Math.max(1, page),
    size: params?.size ?? TENANT_ADMIN_LIST_PAGE_SIZE,
  }
}

function getActivityLogList(payload: any): any[] {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    if (Array.isArray(candidate?.content)) return candidate.content
    if (Array.isArray(candidate?.items)) return candidate.items
    if (Array.isArray(candidate?.records)) return candidate.records
    if (Array.isArray(candidate?.list)) return candidate.list
  }

  return []
}

function readStringValue(payload: any, keys: string[]) {
  for (const key of keys) {
    const value = payload?.[key]

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value)
    }
  }

  return undefined
}

function normalizeActivityLog(log: any, index: number): ActivityLog | null {
  const description =
    readStringValue(log, ['description', 'desc', 'detailDescription', 'detail_description']) ||
    readStringValue(log?.metadata, ['description', 'desc', 'detailDescription', 'detail_description']) ||
    readStringValue(log?.details, ['description', 'desc', 'detailDescription', 'detail_description'])
  const ipAddress =
    readStringValue(log, ['ipAddress', 'ip_address', 'clientIp', 'client_ip', 'ip']) ||
    readStringValue(log?.metadata, ['ipAddress', 'ip_address', 'clientIp', 'client_ip', 'ip']) ||
    readStringValue(log?.details, ['ipAddress', 'ip_address', 'clientIp', 'client_ip', 'ip'])
  const title =
    readStringValue(log, ['title', 'message', 'action', 'activity', 'eventName', 'event_name']) ||
    readStringValue(log?.metadata, ['title', 'message', 'action', 'activity', 'eventName', 'event_name']) ||
    readStringValue(log?.details, ['title', 'message', 'action', 'activity', 'eventName', 'event_name']) ||
    description ||
    'Activity logged'

  return {
    id: String(log?.id || log?.logId || log?.eventId || log?.uuid || `${title}-${index}`),
    eventType: String(log?.eventType || log?.event_type || log?.type || 'ACTION'),
    title,
    description,
    ipAddress,
    createdAt: log?.createdAt || log?.created_at || log?.createdDate || log?.timestamp || log?.eventTime || log?.time
      ? String(log?.createdAt || log?.created_at || log?.createdDate || log?.timestamp || log?.eventTime || log?.time)
      : undefined,
  }
}

export const tenantAdminApi = {
  async getStaffList(pageOrParams: number | AdminListParams = 1, size = TENANT_ADMIN_LIST_PAGE_SIZE) {
    const params = typeof pageOrParams === 'number'
      ? { page: pageOrParams, size }
      : pageOrParams
    const request = buildListRequest(params)

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

    return tenant
  },

  async getActivityLogs(params?: AdminListParams<Record<string, unknown> | null>) {
    const uiPage = params?.page ?? 1
    const request = {
      ...buildListRequest(params),
      page: Math.max(0, uiPage - 1),
    }

    const response = await axiosClient.post('/api/activity-log/list', request)

    return attachPaginationMeta(getActivityLogList(response)
      .map((log, index) => normalizeActivityLog(log, index))
      .filter((log): log is ActivityLog => Boolean(log)), response)
  },

  async deleteStaffActivityLogs(id: string) {
    return axiosClient.delete(`/api/activity-log/staff/${encodeURIComponent(id)}`)
  },

  async getUserById(id: string) {
    const response = await axiosClient.get(`/api/user/${encodeURIComponent(id)}`)
    const user = normalizeTenantAdminUser(getUserDetailPayload(response))

    if (!user) {
      throw new Error('User detail not found')
    }

    return user
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

  async resendStaffActivation(id: string) {
    return axiosClient.post(`/api/user/staff/${encodeURIComponent(id)}/resend-activation`)
  },

  normalizeStaffList(response: unknown) {
    return getTenantList(response)
      .map((item) => normalizeTenantAdminUser(item))
      .filter((item): item is TenantAdminUser => Boolean(item)) as StaffMember[]
  },
}
