import { useEffect, useState, type FormEvent } from 'react'
import { authApi } from '@/features/auth/infrastructure/authApi'
import { getMissingPasswordRequirementLabels, getPasswordStrength } from '@/core/utils/passwordStrength'
import { getAppErrorMessage, getErrorCode } from '@/core/utils/errorManager'
import { authErrorMessages } from '@/core/utils/errors/authErrorMessages'
import { isPasswordLengthValid } from '@/core/api/axiosErrorHandler'
import { clearAuthStorage, clearRequirePasswordChange } from '../infrastructure/authStorageRepository'

export type UseChangePasswordFormOptions = {
  isPasswordChangeRequired?: boolean
  onBack: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

export function useChangePasswordForm({
  isPasswordChangeRequired = false,
  onBack,
  triggerToast,
}: UseChangePasswordFormOptions) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const strength = getPasswordStrength(newPassword)
  const missingRequirements = getMissingPasswordRequirementLabels(newPassword)
  const visibleStrengthClass = newPassword ? strength.strengthClass : ''
  const visibleStrengthLabel = newPassword ? strength.strengthLabel : 'Not entered'

  useEffect(() => {
    if (!saveMessage) return undefined

    const hideToastTimer = window.setTimeout(() => {
      setSaveMessage('')
    }, 3000)

    return () => window.clearTimeout(hideToastTimer)
  }, [saveMessage])

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setCurrentPasswordError('')
    setNewPasswordError('')
    setConfirmPasswordError('')
    setSaveMessage('')
    setShowSaveConfirm(false)
  }

  const closeSaveConfirm = () => {
    setShowSaveConfirm(false)
  }

  const openCancelConfirm = () => {
    if (isPasswordChangeRequired) {
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setShowCancelConfirm(true)
  }

  const openBackConfirm = () => {
    if (isPasswordChangeRequired) {
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setShowBackConfirm(true)
  }

  const closeCancelConfirm = () => {
    setShowCancelConfirm(false)
  }

  const closeBackConfirm = () => {
    setShowBackConfirm(false)
  }

  const confirmCancelChanges = () => {
    setShowCancelConfirm(false)
    resetForm()
  }

  const confirmBackHome = () => {
    setShowBackConfirm(false)
    resetForm()
    onBack()
  }

  const confirmSavePassword = async () => {
    setIsSaving(true)
    try {
      const response: any = await authApi.changePassword({ currentPassword, newPassword })
      const status = Number(response?.httpStatus ?? 0)
      const isSuccess = response?.success === true || (status >= 200 && status < 300)

      if (!isSuccess) {
        triggerToast?.(authErrorMessages.systemError, 'error')
        return
      }

      setShowSaveConfirm(false)
      resetForm()
      clearRequirePasswordChange()
      clearAuthStorage()
      triggerToast?.('Password changed successfully. Please log in again.', 'success')
      window.location.assign('/login')
    } catch (error: any) {
      const status = Number(error?.status ?? 0)
      if (status === 0 || status >= 500) {
        triggerToast?.(authErrorMessages.systemError, 'error')
      } else {
        setShowSaveConfirm(false)
        const errMsg = error?.message || ''
        const errCode = getErrorCode(error)
        if (errCode === 'wrong_password') {
          setCurrentPasswordError(authErrorMessages.currentPasswordIncorrect)
        } else if (errCode === 'old_password_can_not_be_the_same_with_new_password') {
          setNewPasswordError(authErrorMessages.newPasswordDuplicatesCurrent)
        } else {
          setCurrentPasswordError(getAppErrorMessage(error, errMsg || authErrorMessages.currentPasswordIncorrect))
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let hasError = false

    if (!currentPassword.trim()) {
      setCurrentPasswordError(authErrorMessages.currentPasswordRequired)
      hasError = true
    } else {
      setCurrentPasswordError('')
    }

    if (!newPassword) {
      setNewPasswordError(authErrorMessages.newPasswordRequired)
      hasError = true
    } else if (newPassword === currentPassword) {
      setNewPasswordError(authErrorMessages.newPasswordDuplicatesCurrent)
      hasError = true
    } else if (!isPasswordLengthValid(newPassword)) {
      setNewPasswordError(authErrorMessages.passwordLength)
      hasError = true
    } else if (missingRequirements.length > 0) {
      setNewPasswordError(authErrorMessages.passwordComplexity)
      hasError = true
    } else {
      setNewPasswordError('')
    }

    if (!confirmPassword) {
      setConfirmPasswordError(authErrorMessages.confirmNewPasswordRequired)
      hasError = true
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError(authErrorMessages.passwordsDoNotMatch)
      hasError = true
    } else {
      setConfirmPasswordError('')
    }

    if (hasError) {
      setSaveMessage('')
      return
    }

    setSaveMessage('')
    setShowSaveConfirm(true)
  }


  return {
    closeBackConfirm,
    closeCancelConfirm,
    closeSaveConfirm,
    confirmBackHome,
    confirmCancelChanges,
    confirmPassword,
    confirmPasswordError,
    confirmSavePassword,
    currentPassword,
    currentPasswordError,
    handleSubmit,
    isSaving,
    missingRequirements,
    newPassword,
    newPasswordError,
    openBackConfirm,
    openCancelConfirm,
    saveMessage,
    setConfirmPassword,
    setConfirmPasswordError,
    setCurrentPassword,
    setCurrentPasswordError,
    setNewPassword,
    setNewPasswordError,
    setSaveMessage,
    setShowConfirmPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    showBackConfirm,
    showCancelConfirm,
    showConfirmPassword,
    showCurrentPassword,
    showNewPassword,
    showSaveConfirm,
    strength,
    visibleStrengthClass,
    visibleStrengthLabel,
  }
}
