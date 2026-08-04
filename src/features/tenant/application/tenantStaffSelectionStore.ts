import type { StaffMember } from '../domain/tenantApi.types'

export type TenantStaffSelectionStore = {
  getStoredTenantId: () => string
  getStoredSelectedStaff: () => StaffMember | null
  saveSelectedStaff: (staff: StaffMember) => void
  clearSelectedStaff: () => void
}
