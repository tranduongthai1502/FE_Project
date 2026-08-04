import { useEffect, useState, type FormEvent } from 'react'
import { FIELD_LENGTH_LIMITS, validateStaffEmail, validationErrorMessages } from '@/core/api/axiosErrorHandler'
import { buildMaxLengthMessage } from '@/core/utils/errors/fieldErrorUtils'
import type { StaffMember, UserStatus } from '../domain/tenantApi.types'
import { hasDuplicateStaffFullName, type StaffFormFieldErrors } from './tenantStaffFormValidation'

type StaffAccountFormPayload = {
  fullName: string
  email: string
  role: string[]
  status?: UserStatus
}

type UseStaffAccountFormOptions = {
  isActionLocked?: boolean
  onConfirm: (payload: StaffAccountFormPayload) => void
  serverFieldErrors?: StaffFormFieldErrors
  staffList?: StaffMember[]
  staffMember?: StaffMember
}

export function useStaffAccountForm({
  isActionLocked = false,
  onConfirm,
  serverFieldErrors = {},
  staffList = [],
  staffMember,
}: UseStaffAccountFormOptions) {
  const isEdit = Boolean(staffMember)
  const [fullName, setFullName] = useState(staffMember?.fullName || '')
  const [email, setEmail] = useState(staffMember?.email || '')
  const [fullNameError, setFullNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    if (!staffMember?.userRole) return ['hr']
    return staffMember.userRole.split(', ').map((role) => role.trim().toLowerCase())
  })
  const [status, setStatus] = useState<UserStatus>(staffMember?.status || 'ACTIVE')
  const staffFullNameMaxLength = FIELD_LENGTH_LIMITS.defaultText
  const staffEmailMaxLength = 50

  useEffect(() => {
    if (serverFieldErrors.fullName) setFullNameError(serverFieldErrors.fullName)
    if (serverFieldErrors.email) setEmailError(serverFieldErrors.email)
    if (serverFieldErrors.role) setRoleError(serverFieldErrors.role)
  }, [serverFieldErrors])

  const updateLimitedStaffField = (
    value: string,
    maxLength: number,
    fieldName: string,
    setter: (nextValue: string) => void,
    setError: (message: string) => void,
  ) => {
    const isOverMaxLength = value.length > maxLength
    setter(isOverMaxLength ? value.slice(0, maxLength) : value)
    setError(isOverMaxLength ? buildMaxLengthMessage(fieldName, maxLength) : '')
  }

  const updateFullName = (value: string) => {
    updateLimitedStaffField(value, staffFullNameMaxLength, 'Full name', setFullName, setFullNameError)
  }

  const updateEmail = (value: string) => {
    updateLimitedStaffField(value, staffEmailMaxLength, 'Email', setEmail, setEmailError)
  }

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((currentRoles) => {
      if (currentRoles.includes(role)) {
        return currentRoles.filter((currentRole) => currentRole !== role)
      }

      if (roleError) setRoleError('')
      return [...currentRoles, role]
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (isActionLocked) return

    const nextFullNameError = !fullName.trim()
      ? validationErrorMessages.staffFullNameRequired
      : hasDuplicateStaffFullName(staffList, fullName, staffMember?.id)
        ? validationErrorMessages.duplicateStaffFullName
        : ''
    const nextEmailError = validateStaffEmail(email, staffList.map((staff) => staff.email), isEdit)
    const nextRoleError = selectedRoles.length > 0 ? '' : validationErrorMessages.roleRequired

    setFullNameError(nextFullNameError)
    setEmailError(nextEmailError)
    setRoleError(nextRoleError)

    if (nextFullNameError || nextEmailError || nextRoleError) {
      return
    }

    const rolePayload = selectedRoles.map((role) => {
      if (role === 'hr') return 'HR'
      return 'Interviewer'
    })

    onConfirm({
      fullName: fullName.trim(),
      email: email.trim(),
      role: rolePayload,
      ...(isEdit ? { status } : {}),
    })
  }

  return {
    email,
    emailError,
    fullName,
    fullNameError,
    handleRoleToggle,
    handleSubmit,
    isEdit,
    roleError,
    selectedRoles,
    setShowCancelConfirm,
    setStatus,
    showCancelConfirm,
    staffEmailMaxLength,
    staffFullNameMaxLength,
    status,
    updateEmail,
    updateFullName,
  }
}
