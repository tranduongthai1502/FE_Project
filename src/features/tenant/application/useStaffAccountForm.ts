import { useEffect, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
  const staffForm = useForm<{ fullName: string; email: string }>({
    resolver: zodResolver(z.object({
      fullName: z.string().superRefine((value, context) => {
        if (!value.trim()) context.addIssue({ code: 'custom', message: validationErrorMessages.staffFullNameRequired })
        if (hasDuplicateStaffFullName(staffList, value, staffMember?.id)) context.addIssue({ code: 'custom', message: validationErrorMessages.duplicateStaffFullName })
      }),
      email: z.string().superRefine((value, context) => {
        const message = validateStaffEmail(value, staffList.map((staff) => staff.email), isEdit)
        if (message) context.addIssue({ code: 'custom', message })
      }),
    })),
    defaultValues: {
      fullName: staffMember?.fullName || '',
      email: staffMember?.email || '',
    },
    mode: 'onSubmit',
  })
  const fullName = staffForm.watch('fullName')
  const email = staffForm.watch('email')
  const fullNameError = staffForm.formState.errors.fullName?.message || ''
  const emailError = staffForm.formState.errors.email?.message || ''
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
    if (serverFieldErrors.fullName) staffForm.setError('fullName', { type: 'server', message: serverFieldErrors.fullName })
    if (serverFieldErrors.email) staffForm.setError('email', { type: 'server', message: serverFieldErrors.email })
    if (serverFieldErrors.role) setRoleError(serverFieldErrors.role)
  }, [serverFieldErrors, staffForm])

  const updateLimitedStaffField = (
    value: string,
    maxLength: number,
    fieldName: string,
    field: 'fullName' | 'email',
  ) => {
    const isOverMaxLength = value.length > maxLength
    staffForm.setValue(field, isOverMaxLength ? value.slice(0, maxLength) : value, { shouldDirty: true })
    if (isOverMaxLength) {
      staffForm.setError(field, { type: 'maxLength', message: buildMaxLengthMessage(fieldName, maxLength) })
      return
    }
    staffForm.clearErrors(field)
  }

  const updateFullName = (value: string) => {
    updateLimitedStaffField(value, staffFullNameMaxLength, 'Full name', 'fullName')
  }

  const updateEmail = (value: string) => {
    updateLimitedStaffField(value, staffEmailMaxLength, 'Email', 'email')
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

    const nextRoleError = selectedRoles.length > 0 ? '' : validationErrorMessages.roleRequired

    setRoleError(nextRoleError)

    if (nextRoleError) return

    void staffForm.handleSubmit((values) => {
      const rolePayload = selectedRoles.map((role) => {
        if (role === 'hr') return 'HR'
        return 'Interviewer'
      })

      onConfirm({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        role: rolePayload,
        ...(isEdit ? { status } : {}),
      })
    })()
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
