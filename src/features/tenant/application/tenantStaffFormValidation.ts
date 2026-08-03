import { validationErrorMessages } from '@/core/api/axiosErrorHandler'
import { mapErrorTextToFieldErrors } from '@/core/utils/errors/fieldErrorUtils'
import type { StaffMember } from '../domain/tenantApi.types'

export type StaffFormFieldErrors = Partial<Record<'fullName' | 'email' | 'role', string>>

export function getStaffFormFieldErrors(error: unknown, message: string): StaffFormFieldErrors {
  return mapErrorTextToFieldErrors<keyof StaffFormFieldErrors>(error, message, [
    { field: 'email', message: validationErrorMessages.emailAlreadyRegistered, keywords: ['email'] },
    { field: 'fullName', message: validationErrorMessages.duplicateStaffFullName, keywords: ['full', 'name', 'duplicate'] },
    { field: 'role', message: validationErrorMessages.accountRoleRequired, keywords: ['role'] },
  ])
}

export function hasDuplicateStaffFullName(staffList: StaffMember[], fullName: string, ignoredStaffId?: string) {
  const normalizedFullName = fullName.trim().toLowerCase()
  if (!normalizedFullName) return false

  return staffList.some((staff) => (
    staff.id !== ignoredStaffId &&
    staff.fullName.trim().toLowerCase() === normalizedFullName
  ))
}
