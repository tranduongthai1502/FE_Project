import type { StaffMember } from '../domain/tenantApi.types'
import { normalizeUserStatus } from './tenantStaffNormalizers'

const selectedTenantStaffStorageKey = 'jobfusion_selected_tenant_staff'

export function getStoredTenantId() {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return ''

  try {
    const user = JSON.parse(rawUser)
    const tenant =
      user?.tenant ||
      user?.tenantInfo ||
      user?.company ||
      user?.workspace ||
      {}
    const tenantId =
      user?.tenantId ||
      user?.tenant_id ||
      user?.companyId ||
      user?.company_id ||
      user?.workspaceId ||
      user?.workspace_id ||
      tenant?.id ||
      tenant?.tenantId ||
      tenant?.uuid

    return tenantId ? String(tenantId) : ''
  } catch {
    return ''
  }
}

export function getStoredSelectedStaff() {
  const rawStaff = window.sessionStorage.getItem(selectedTenantStaffStorageKey)
  if (!rawStaff) return null

  try {
    const staff = JSON.parse(rawStaff) as Partial<StaffMember>
    const status = normalizeUserStatus(staff.status)

    if (!staff.id || !staff.fullName || !staff.email || !status) {
      clearSelectedStaff()
      return null
    }

    return {
      ...staff,
      id: String(staff.id),
      email: String(staff.email),
      fullName: String(staff.fullName),
      status,
      userRole: String(staff.userRole || ''),
    } as StaffMember
  } catch {
    clearSelectedStaff()
    return null
  }
}

export function saveSelectedStaff(staff: StaffMember) {
  window.sessionStorage.setItem(selectedTenantStaffStorageKey, JSON.stringify(staff))
}

export function clearSelectedStaff() {
  window.sessionStorage.removeItem(selectedTenantStaffStorageKey)
}
