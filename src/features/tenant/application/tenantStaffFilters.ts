import type { UserStatus } from '../domain/tenantApi.types'

export type StaffListFilterValues = {
  search?: string
  fullName?: string
  email?: string
  phone?: string
  employeeCode?: string
  jobTitle?: string
  userRole?: string
  status?: UserStatus
}

export function buildStaffListFilters(values: StaffListFilterValues = {}) {
  const filters: Record<string, unknown> = {}
  const search = values.search?.trim()
  const fullName = values.fullName?.trim()
  const email = values.email?.trim()
  const phone = values.phone?.trim()
  const employeeCode = values.employeeCode?.trim()
  const jobTitle = values.jobTitle?.trim()
  const userRole = values.userRole?.trim()

  if (search) filters.search = search
  if (fullName) filters.fullName = fullName
  if (email) filters.email = email
  if (phone) filters.phone = phone
  if (employeeCode) filters.employeeCode = employeeCode
  if (jobTitle) filters.jobTitle = jobTitle
  if (userRole) filters.userRole = userRole
  if (values.status) filters.status = values.status

  return filters
}
