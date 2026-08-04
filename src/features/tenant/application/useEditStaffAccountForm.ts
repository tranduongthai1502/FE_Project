import { useEffect, useState, type FormEvent } from 'react'
import { FIELD_LENGTH_LIMITS, validationErrorMessages } from '@/core/api/axiosErrorHandler'
import { buildMaxLengthMessage } from '@/core/utils/errors/fieldErrorUtils'
import type { StaffMember, UserStatus } from '../domain/tenantApi.types'
import { hasDuplicateStaffFullName, type StaffFormFieldErrors } from './tenantStaffFormValidation'

type EditStaffAccountPayload = {
  fullName: string
  email: string
  role: string[]
  status: UserStatus
}

type UseEditStaffAccountFormOptions = {
  isActionLocked?: boolean
  onConfirm: (payload: EditStaffAccountPayload) => void
  serverFieldErrors?: StaffFormFieldErrors
  staffList?: StaffMember[]
  staffMember: StaffMember
}

function getStaffRoles(staffMember: StaffMember) {
  const roles = staffMember.userRole
    ? staffMember.userRole.split(',').map((role) => role.trim().toLowerCase())
    : []

  return roles.length > 0 ? roles : ['hr']
}

export function useEditStaffAccountForm({
  isActionLocked = false,
  onConfirm,
  serverFieldErrors = {},
  staffList = [],
  staffMember,
}: UseEditStaffAccountFormOptions) {
  const [fullName, setFullName] = useState(staffMember.fullName)
  const [fullNameError, setFullNameError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => getStaffRoles(staffMember))
  const staffFullNameMaxLength = FIELD_LENGTH_LIMITS.defaultText

  useEffect(() => {
    if (serverFieldErrors.fullName) setFullNameError(serverFieldErrors.fullName)
    if (serverFieldErrors.role) setRoleError(serverFieldErrors.role)
  }, [serverFieldErrors])

  const updateFullName = (value: string) => {
    const isOverMaxLength = value.length > staffFullNameMaxLength
    setFullName(isOverMaxLength ? value.slice(0, staffFullNameMaxLength) : value)
    setFullNameError(isOverMaxLength ? buildMaxLengthMessage('Full name', staffFullNameMaxLength) : '')
  }

  const toggleRole = (role: string) => {
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

    if (!fullName.trim()) {
      setFullNameError(validationErrorMessages.staffFullNameRequired)
      return
    }

    if (hasDuplicateStaffFullName(staffList, fullName, staffMember.id)) {
      setFullNameError(validationErrorMessages.duplicateStaffFullName)
      return
    }

    if (selectedRoles.length === 0) {
      setRoleError(validationErrorMessages.accountRoleRequired)
      return
    }

    const rolePayload = selectedRoles.map((role) => (role === 'hr' ? 'HR' : 'Interviewer'))

    onConfirm({
      fullName: fullName.trim(),
      email: staffMember.email,
      role: rolePayload,
      status: staffMember.status,
    })
  }

  const resetEditStaffForm = () => {
    setFullName(staffMember.fullName)
    setSelectedRoles(getStaffRoles(staffMember))
    setFullNameError('')
    setRoleError('')
    setShowCancelConfirm(false)
  }

  return {
    fullName,
    fullNameError,
    handleSubmit,
    resetEditStaffForm,
    roleError,
    selectedRoles,
    setShowCancelConfirm,
    showCancelConfirm,
    toggleRole,
    updateFullName,
  }
}
