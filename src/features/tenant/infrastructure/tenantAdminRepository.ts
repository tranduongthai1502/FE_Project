import { getPaginationMeta } from '@/core/utils/pagination'
import type { ActivityLog, StaffMember } from '../domain/tenantApi.types'
import type { PaginatedTenantList, TenantAdminRepository } from '../application/tenantAdminRepository'
import { tenantAdminApi } from './tenantAdminApi'
import {
  getStaffListItems,
  normalizeStaffAccountLimit,
  normalizeStaffMember,
} from './tenantStaffNormalizers'

export const tenantAdminRepository: TenantAdminRepository = {
  async getStaffList(params) {
    const response = await tenantAdminApi.getStaffList(params)
    const payload = response?.data || response
    const staffList = getStaffListItems(payload)
      .map((staff) => normalizeStaffMember(staff))
      .filter((staff): staff is StaffMember => Boolean(staff))

    return Object.assign([...staffList], { __pagination: getPaginationMeta(response) }) as PaginatedTenantList<StaffMember>
  },

  async getStaffAccountLimit() {
    const response = await tenantAdminApi.getStaffAccountLimit()
    return normalizeStaffAccountLimit(response)
  },

  getTenantById: tenantAdminApi.getTenantById,

  async getActivityLogs(params) {
    const activityLogs = await tenantAdminApi.getActivityLogs(params)
    return activityLogs as PaginatedTenantList<ActivityLog>
  },

  async deleteStaffActivityLogs(id) {
    await tenantAdminApi.deleteStaffActivityLogs(id)
  },

  async exportStaffActivityLogs(id) {
    const response = await tenantAdminApi.exportStaffActivityLogs(id)
    return {
      data: response.data,
      headers: response.headers as Record<string, unknown>,
    }
  },

  async getUserById(id) {
    const user = await tenantAdminApi.getUserById(id)
    const staff = normalizeStaffMember(user)

    if (!staff) {
      throw new Error('User detail not found')
    }

    return staff
  },

  async createStaff(payload) {
    await tenantAdminApi.createStaff(payload)
  },

  async updateStaff(id, payload) {
    await tenantAdminApi.updateStaff(id, payload)
  },

  async deleteStaff(id) {
    await tenantAdminApi.deleteStaff(id)
  },
}
