import { useEffect, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
  const editStaffForm = useForm<{ fullName: string }>({
    resolver: zodResolver(z.object({
      fullName: z.string().superRefine((value, context) => {
        if (!value.trim()) context.addIssue({ code: 'custom', message: validationErrorMessages.staffFullNameRequired })
        if (hasDuplicateStaffFullName(staffList, value, staffMember.id)) context.addIssue({ code: 'custom', message: validationErrorMessages.duplicateStaffFullName })
      }),
    })),
    defaultValues: { fullName: staffMember.fullName },
    mode: 'onSubmit',
  })
  const fullName = editStaffForm.watch('fullName')
  const fullNameError = editStaffForm.formState.errors.fullName?.message || ''
  const [roleError, setRoleError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => getStaffRoles(staffMember))
  const staffFullNameMaxLength = FIELD_LENGTH_LIMITS.defaultText

  useEffect(() => {
    if (serverFieldErrors.fullName) editStaffForm.setError('fullName', { type: 'server', message: serverFieldErrors.fullName })
    if (serverFieldErrors.role) setRoleError(serverFieldErrors.role)
  }, [editStaffForm, serverFieldErrors])

  const updateFullName = (value: string) => {
    const isOverMaxLength = value.length > staffFullNameMaxLength
    editStaffForm.setValue('fullName', isOverMaxLength ? value.slice(0, staffFullNameMaxLength) : value, { shouldDirty: true })
    if (isOverMaxLength) {
      editStaffForm.setError('fullName', { type: 'maxLength', message: buildMaxLengthMessage('Full name', staffFullNameMaxLength) })
      return
    }
    editStaffForm.clearErrors('fullName')
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

    if (selectedRoles.length === 0) {
      setRoleError(validationErrorMessages.accountRoleRequired)
      return
    }

    void editStaffForm.handleSubmit((values) => {
      const rolePayload = selectedRoles.map((role) => (role === 'hr' ? 'HR' : 'Interviewer'))

      onConfirm({
        fullName: values.fullName.trim(),
        email: staffMember.email,
        role: rolePayload,
        status: staffMember.status,
      })
    })()
  }

  const resetEditStaffForm = () => {
    editStaffForm.reset({ fullName: staffMember.fullName })
    setSelectedRoles(getStaffRoles(staffMember))
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
