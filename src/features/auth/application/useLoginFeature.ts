import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { getMissingPasswordRequirementLabels, getPasswordStrength } from '@/core/utils/passwordStrength'
import { validateEmail, validateRequired } from './validation'
import { authApi } from '@/features/auth/infrastructure/authApi'
import { getAppErrorMessage, getErrorCode } from '@/core/utils/errorManager'
import { authErrorMessages } from './authErrorMessages'
import { saveAuthRole, saveLoginSession, saveRememberedEmail, saveRequirePasswordChange, getRememberedEmail } from '../infrastructure/authStorageRepository'
import { getPageForUserRole } from './authRole'
import { validateOptionalEmail, validationErrorMessages } from '@/core/api/axiosErrorHandler'

const emptyOtp = ['', '', '', '', '', '']
const accountNotFoundMessage = authErrorMessages.accountNotFound
const forgotAccountNotFoundMessage = authErrorMessages.forgotAccountNotFound
const systemErrorMessage = authErrorMessages.systemError
const incorrectPasswordMessage = authErrorMessages.incorrectPassword
const accountDeactivatedMessage = authErrorMessages.accountDeactivated
const workspaceSuspendedMessage = authErrorMessages.workspaceSuspended
const expiredOtpMessage = authErrorMessages.expiredOtp
const invalidOtpMessage = authErrorMessages.invalidOtp
const resendOtpCountdownSeconds = 59
const maxAuthFailedAttempts = 5
const authLockoutSeconds = 60
const passwordChangePathByLoginRole = {
  candidate: '/candidate/change-password',
  tenantAdmin: '/tenant-admin/settings',
  superAdmin: '/super-admin/settings',
  hr: '/hr/settings',
  interviewer: '/interviewer/settings',
}
type ForgotStep = 'email' | 'otp' | 'reset'

function getAuthResponsePayload(response: any) {
  const payload = response?.data && typeof response.data === 'object' ? response.data : response
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload
}

function getAuthUser(payload: any) {
  return payload?.user || payload?.user_info || payload?.userInfo || null
}

function getStoredUserPayload(user: any, payload: any) {
  return user && typeof user === 'object' ? { ...payload, ...user } : payload
}

function normalizeRoleValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeRoleValue(item))
  }

  if (value && typeof value === 'object') {
    const roleObject = value as Record<string, unknown>
    return normalizeRoleValue(
      roleObject.role ||
        roleObject.name ||
        roleObject.roleName ||
        roleObject.role_name ||
        roleObject.authority ||
        roleObject.authorities ||
        roleObject.userRole ||
        roleObject.user_role,
    )
  }

  return String(value || '')
    .split(/[,;/|]+/)
    .map((role) => role.trim())
    .filter(Boolean)
}

function getAuthUserRole(user: any, payload: any) {
  const primaryRoleValues = [
    user?.role,
    user?.userRole,
    user?.user_role,
    user?.type,
    payload?.role,
    payload?.userRole,
    payload?.user_role,
    payload?.type,
  ].flatMap((value) => normalizeRoleValue(value))

  if (primaryRoleValues.length > 0) {
    return primaryRoleValues.join(',')
  }

  const multiRoleValues = [
    user?.roles,
    user?.userRoles,
    user?.authorities,
    payload?.roles,
    payload?.userRoles,
    payload?.authorities,
  ].flatMap((value) => normalizeRoleValue(value))

  return multiRoleValues.join(',')
}

function isLoginSuccessResponse(response: any) {
  const payload = getAuthResponsePayload(response)
  const success = response?.success ?? payload?.success
  const status = String(response?.status ?? payload?.status ?? '').toLowerCase()
  const message = String(response?.message ?? payload?.message ?? '').toLowerCase()
  const code = response?.httpStatus ?? payload?.httpStatus ?? response?.code ?? payload?.code ?? response?.statusCode ?? payload?.statusCode
  const token = getAuthToken(payload)

  const hasFailureMessage =
    message.includes('invalid credentials') ||
    message.includes('bad credentials') ||
    message.includes('incorrect password') ||
    message.includes('wrong password') ||
    message.includes('password is incorrect') ||
    message.includes('authentication failed') ||
    message.includes('login failed') ||
    message.includes('unauthorized')

  if (success === false || status === 'error' || status === 'failed' || status === 'failure' || hasFailureMessage) {
    return false
  }

  return Boolean(
    success === true ||
    status === 'success' ||
    status === 'ok' ||
    (code >= 200 && code < 300) ||
    message.includes('login successful') ||
    message.includes('logged in') ||
    message.includes('success') ||
    token
  )
}

function getAuthToken(payload: any) {
  return payload?.token || payload?.access_token || payload?.accessToken || payload?.jwt || ''
}

function getRefreshToken(payload: any) {
  return payload?.refresh_token || payload?.refreshToken || ''
}

function isAccountNotFoundError(message = '') {
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes('account not found') ||
    normalizedMessage.includes('user not found') ||
    normalizedMessage.includes('email not found') ||
    normalizedMessage.includes('email not registered') ||
    normalizedMessage.includes('email_not_registered') ||
    normalizedMessage.includes('account_not_found') ||
    normalizedMessage.includes('user_not_found') ||
    normalizedMessage.includes('email_not_found') ||
    normalizedMessage.includes('không tìm thấy') ||
    normalizedMessage.includes('khong tim thay') ||
    normalizedMessage.includes('chưa được đăng ký') ||
    normalizedMessage.includes('chua duoc dang ky') ||
    normalizedMessage.includes('not registered') ||
    normalizedMessage.includes('does not exist')
  )
}

function isExpiredOtpError(message = '') {
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes('otp expired') ||
    normalizedMessage.includes('expired otp') ||
    normalizedMessage.includes('code expired') ||
    normalizedMessage.includes('old otp') ||
    normalizedMessage.includes('old code') ||
    normalizedMessage.includes('previous otp') ||
    normalizedMessage.includes('previous code') ||
    normalizedMessage.includes('invalidated') ||
    normalizedMessage.includes('not latest') ||
    normalizedMessage.includes('new otp') ||
    normalizedMessage.includes('new code') ||
    normalizedMessage.includes('otp đã hết hạn') ||
    normalizedMessage.includes('otp da het han') ||
    normalizedMessage.includes('mã otp đã hết hạn') ||
    normalizedMessage.includes('ma otp da het han') ||
    normalizedMessage.includes('expired') ||
    normalizedMessage.includes('expire')
  )
}

function getOtpErrorMessage(message = '', isKnownExpiredOtp = false) {
  return isKnownExpiredOtp || isExpiredOtpError(message) ? expiredOtpMessage : invalidOtpMessage
}

function isIncorrectPasswordError(message = '', code = '') {
  const normalizedMessage = message.toLowerCase()
  const normalizedCode = code.toLowerCase()

  return (
    normalizedCode === 'wrong_password' ||
    normalizedMessage.includes('wrong_password') ||
    normalizedMessage.includes('wrong password') ||
    normalizedMessage.includes('password is incorrect') ||
    normalizedMessage.includes('incorrect password')
  )
}

function isPasswordAttemptFailure(message = '', code = '') {
  const normalizedMessage = message.toLowerCase()

  return (
    isIncorrectPasswordError(message, code) ||
    normalizedMessage.includes('invalid credentials') ||
    normalizedMessage.includes('bad credentials') ||
    normalizedMessage.includes('authentication failed') ||
    normalizedMessage.includes('login failed')
  )
}

function isAccountDeactivatedError(message = '', code = '') {
  const normalizedMessage = message.toLowerCase()
  const normalizedCode = code.toLowerCase()

  return (
    normalizedCode === 'user_account_is_not_active' ||
    normalizedCode === 'inactive_user' ||
    normalizedCode === 'tenant_is_inactive' ||
    normalizedCode === 'account_deactivated' ||
    normalizedCode === 'user_deactivated' ||
    normalizedMessage.includes('user_account_is_not_active') ||
    normalizedMessage.includes('tenant_is_inactive') ||
    normalizedMessage.includes('account has been deactivated') ||
    normalizedMessage.includes('user account is not active')
  )
}

function isWorkspaceSuspendedError(message = '', code = '') {
  const normalizedMessage = message.toLowerCase()
  const normalizedCode = code.toLowerCase()

  return (
    normalizedCode === 'tenant_deactivated' ||
    normalizedCode === 'tenant_suspended' ||
    normalizedCode === 'workspace_suspended' ||
    normalizedMessage.includes('tenant_deactivated') ||
    normalizedMessage.includes('tenant_suspended') ||
    normalizedMessage.includes('workspace_suspended') ||
    normalizedMessage.includes('workspace is currently suspended') ||
    normalizedMessage.includes('tenant has been deactivated')
  )
}

function getLoginFailureMessage(error: unknown, fallbackMessage = incorrectPasswordMessage) {
  const message = getAppErrorMessage(error, fallbackMessage)
  const code = getErrorCode(error)

  if (isAccountNotFoundError(message)) return accountNotFoundMessage
  if (isWorkspaceSuspendedError(message, code)) return workspaceSuspendedMessage
  if (isAccountDeactivatedError(message, code)) return accountDeactivatedMessage
  if (isIncorrectPasswordError(message, code)) return incorrectPasswordMessage

  return message || fallbackMessage
}

function getLockoutMessage(label: string, seconds: number) {
  return `Too many incorrect ${label} attempts. Please wait ${seconds}s before trying again.`
}

function isSystemApiError(error: any) {
  const status = Number(error?.status ?? 0)
  return status === 0 || status >= 500
}

export type UseLoginFeatureOptions = {
  onGoToSignup: () => void
  onSignInSuccess: (
    email: string,
    keepLoggedIn: boolean,
    userRole: string,
    options?: { requirePasswordChange?: boolean },
  ) => boolean
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

export function useLoginFeature({ onSignInSuccess, triggerToast }: UseLoginFeatureOptions) {
  const rememberedEmail = getRememberedEmail()
  const [email, setEmail] = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState(emptyOtp)
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([])
  const attemptedOtpCodesRef = useRef<Set<string>>(new Set())
  const expiredOtpCodesRef = useRef<Set<string>>(new Set())
  const failedPasswordAttemptsRef = useRef(0)
  const failedOtpAttemptsRef = useRef(0)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(Boolean(rememberedEmail))
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isResendingCode, setIsResendingCode] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [forgotEmailError, setForgotEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [passwordLockCountdown, setPasswordLockCountdown] = useState(0)
  const [otpLockCountdown, setOtpLockCountdown] = useState(0)
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const strength = getPasswordStrength(newPassword)
  const isPasswordLocked = passwordLockCountdown > 0
  const isOtpLocked = otpLockCountdown > 0
  const visiblePasswordError = isPasswordLocked ? getLockoutMessage('password', passwordLockCountdown) : passwordError
  const visibleOtpError = isOtpLocked ? getLockoutMessage('OTP', otpLockCountdown) : otpError

  useEffect(() => {
    if (!showForgotPassword || forgotStep !== 'otp' || countdown <= 0) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setCountdown((value) => Math.max(value - 1, 0))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [countdown, forgotStep, showForgotPassword])

  useEffect(() => {
    if (passwordLockCountdown <= 0) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setPasswordLockCountdown((value) => {
        const nextValue = Math.max(value - 1, 0)
        if (nextValue === 0) {
          failedPasswordAttemptsRef.current = 0
          setPasswordError('')
        }
        return nextValue
      })
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [passwordLockCountdown])

  useEffect(() => {
    if (otpLockCountdown <= 0) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setOtpLockCountdown((value) => {
        const nextValue = Math.max(value - 1, 0)
        if (nextValue === 0) {
          failedOtpAttemptsRef.current = 0
          setOtpError('')
        }
        return nextValue
      })
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [otpLockCountdown])

  const registerPasswordFailure = (message: string = incorrectPasswordMessage) => {
    failedPasswordAttemptsRef.current += 1

    if (failedPasswordAttemptsRef.current >= maxAuthFailedAttempts) {
      setPasswordLockCountdown(authLockoutSeconds)
      setPasswordError('')
      return
    }

    setPasswordError(message)
  }

  const registerOtpFailure = (message: string = invalidOtpMessage) => {
    failedOtpAttemptsRef.current += 1

    if (failedOtpAttemptsRef.current >= maxAuthFailedAttempts) {
      setOtpLockCountdown(authLockoutSeconds)
      setOtpError('')
      return
    }

    setOtpError(message)
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value
    setEmail(nextEmail)
    if (emailError) {
      setEmailError(validateEmail(nextEmail))
    }
  }

  const updatePassword = (nextPassword: string) => {
    setPassword(nextPassword)
    if (passwordError && !isPasswordLocked) {
      setPasswordError(validateRequired(nextPassword, validationErrorMessages.passwordRequired))
    }
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    updatePassword(event.target.value)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (isPasswordLocked) {
      return
    }

    const nextEmailError = validateEmail(email)
    const nextPasswordError = validateRequired(password, validationErrorMessages.passwordRequired)

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)

    if (nextEmailError || nextPasswordError) {
      return
    }

    setIsLoading(true)
    try {
      const response: any = await authApi.login({ email, password })
      const payload = getAuthResponsePayload(response)
      const responseMessage = response?.message || payload?.message || ''
      if (isAccountNotFoundError(responseMessage)) {
        setEmailError('')
        setPasswordError(accountNotFoundMessage)
      } else if (isWorkspaceSuspendedError(responseMessage, getErrorCode(response))) {
        setEmailError('')
        setPasswordError(workspaceSuspendedMessage)
      } else if (isAccountDeactivatedError(responseMessage, getErrorCode(response))) {
        setEmailError('')
        setPasswordError(accountDeactivatedMessage)
      } else if (isPasswordAttemptFailure(responseMessage, getErrorCode(response))) {
        setEmailError('')
        registerPasswordFailure()
      } else if (isLoginSuccessResponse(response)) {
        failedPasswordAttemptsRef.current = 0
        setPasswordLockCountdown(0)
        setPasswordError('')
        const token = getAuthToken(payload)
        const refreshToken = getRefreshToken(payload)
        const user = getAuthUser(payload)
        const userRole = getAuthUserRole(user, payload)
        const storedUserPayload = getStoredUserPayload(user, payload)
        const responseRequirePasswordChange = payload?.user?.requirePasswordChange ?? user?.requirePasswordChange
        const requirePasswordChange = responseRequirePasswordChange === true ||
          String(responseRequirePasswordChange).trim().toLowerCase() === 'true'
        const storedUser = {
          ...storedUserPayload,
          requirePasswordChange,
        }

        saveLoginSession({ keepLoggedIn, refreshToken, token, user: storedUser })
        saveRequirePasswordChange(requirePasswordChange, keepLoggedIn)
        saveRememberedEmail(email, keepLoggedIn)

        if (requirePasswordChange) {
          const targetPage = getPageForUserRole(userRole)
          const targetPath = targetPage ? passwordChangePathByLoginRole[targetPage] : ''

          if (targetPage && targetPath) {
            saveAuthRole(targetPage, keepLoggedIn)
            window.location.replace(targetPath)
            return
          }
        }

        if (!onSignInSuccess(email, keepLoggedIn, userRole, { requirePasswordChange })) {
          return
        }
      } else {
        setEmailError('')
        const failureMessage = getLoginFailureMessage(response)
        if (isPasswordAttemptFailure(response?.message || payload?.message || failureMessage, getErrorCode(response))) {
          registerPasswordFailure(failureMessage)
        } else {
          setPasswordError(failureMessage)
        }
      }
    } catch (error: any) {
      const backendMessage = String(error?.backendMessage || error?.message || '').trim()
      if (isSystemApiError(error)) {
        triggerToast?.(backendMessage || systemErrorMessage, 'error')
      } else if (isAccountNotFoundError(error.message)) {
        setEmailError('')
        setPasswordError(accountNotFoundMessage)
      } else {
        setEmailError('')
        const failureMessage = getLoginFailureMessage(error)
        if (isPasswordAttemptFailure(error?.message || failureMessage, getErrorCode(error))) {
          registerPasswordFailure(failureMessage)
        } else {
          setPasswordError(backendMessage || failureMessage)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextEmailError = forgotEmail.trim()
      ? validateEmail(forgotEmail)
      : validateOptionalEmail(forgotEmail)
    setForgotEmailError(nextEmailError)

    if (nextEmailError) {
      return
    }

    setIsSendingCode(true)
    try {
      const response: any = await authApi.sendResetCode(forgotEmail)
      if (response && response.success) {
        setForgotStep('otp')
        setCountdown(resendOtpCountdownSeconds)
        attemptedOtpCodesRef.current.clear()
        expiredOtpCodesRef.current.clear()
      } else if (isAccountNotFoundError(response?.message)) {
        setForgotEmailError(forgotAccountNotFoundMessage)
      } else {
        setForgotEmailError(getAppErrorMessage(response, forgotAccountNotFoundMessage))
      }
    } catch (error: any) {
      if (isAccountNotFoundError(error.message)) {
        setForgotEmailError(forgotAccountNotFoundMessage)
      } else if (isSystemApiError(error)) {
        triggerToast?.(systemErrorMessage, 'error')
      } else {
        setForgotEmailError(getAppErrorMessage(error, forgotAccountNotFoundMessage))
      }
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleCloseForgotPassword = () => {
    if (isSendingCode || isResendingCode) {
      return
    }

    setShowForgotPassword(false)
    setForgotStep('email')
    setForgotEmailError('')
    setOtpError('')
    failedOtpAttemptsRef.current = 0
    setOtpLockCountdown(0)
    setNewPasswordError('')
    setConfirmPasswordError('')
    setOtp(emptyOtp)
    attemptedOtpCodesRef.current.clear()
    expiredOtpCodesRef.current.clear()
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isOtpLocked) return

    const value = element.value
    if (Number.isNaN(Number(value))) return

    const nextOtp = [...otp]
    nextOtp[index] = value.slice(-1)
    setOtp(nextOtp)
    setOtpError('')

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (isOtpLocked) return

    if (event.key !== 'Backspace') return

    const nextOtp = [...otp]
    if (!otp[index] && index > 0) {
      nextOtp[index - 1] = ''
      otpInputsRef.current[index - 1]?.focus()
    } else {
      nextOtp[index] = ''
    }
    setOtp(nextOtp)
    setOtpError('')
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (isOtpLocked) return

    const pastedDigits = event.clipboardData.getData('text').trim().slice(0, 6)
    if (!/^\d+$/.test(pastedDigits)) return

    const nextOtp = [...emptyOtp]
    pastedDigits.split('').forEach((digit, index) => {
      nextOtp[index] = digit
    })
    setOtp(nextOtp)
    setOtpError('')
    otpInputsRef.current[Math.min(pastedDigits.length, 5)]?.focus()
  }

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isOtpLocked) {
      return
    }

    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      setOtpError(authErrorMessages.otpRequired)
      return
    }

    if (expiredOtpCodesRef.current.has(otpCode)) {
      registerOtpFailure(expiredOtpMessage)
      return
    }

    attemptedOtpCodesRef.current.add(otpCode)
    setIsSendingCode(true)
    try {
      const response: any = await authApi.verifyOtp(forgotEmail, otpCode)
      if (response && response.success) {
        failedOtpAttemptsRef.current = 0
        setOtpLockCountdown(0)
        setOtpError('')
        setForgotStep('reset')
      } else {
        registerOtpFailure(getOtpErrorMessage(response?.message, expiredOtpCodesRef.current.has(otpCode)))
      }
    } catch (error: any) {
      if (isSystemApiError(error)) {
        triggerToast?.(systemErrorMessage, 'error')
      } else {
        registerOtpFailure(getOtpErrorMessage(error.message, expiredOtpCodesRef.current.has(otpCode)))
      }
    } finally {
      setIsSendingCode(false)
    }
  }

  const startTimer = () => {
    setCountdown(resendOtpCountdownSeconds)
  }

  const handleResendCode = async () => {
    if (countdown > 0 || isResendingCode) {
      return
    }

    setIsResendingCode(true)
    try {
      const response: any = await authApi.sendResetCode(forgotEmail)
      if (response && response.success) {
        const currentOtpCode = otp.join('')
        if (currentOtpCode.length === 6) {
          expiredOtpCodesRef.current.add(currentOtpCode)
        }
        attemptedOtpCodesRef.current.forEach((code) => expiredOtpCodesRef.current.add(code))
        attemptedOtpCodesRef.current.clear()
        failedOtpAttemptsRef.current = 0
        setOtpLockCountdown(0)
        setOtp(emptyOtp)
        setOtpError('')
        startTimer()
        otpInputsRef.current[0]?.focus()
      } else if (isAccountNotFoundError(response?.message)) {
        setOtpError(forgotAccountNotFoundMessage)
      } else {
        setOtpError(getOtpErrorMessage(response?.message))
      }
    } catch (error: any) {
      if (isAccountNotFoundError(error.message)) {
        setOtpError(forgotAccountNotFoundMessage)
      } else if (isSystemApiError(error)) {
        triggerToast?.(systemErrorMessage, 'error')
      } else {
        setOtpError(getOtpErrorMessage(error.message))
      }
    } finally {
      setIsResendingCode(false)
    }
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let hasError = false

    if (!newPassword) {
      setNewPasswordError(authErrorMessages.newPasswordRequired)
      hasError = true
    } else if (getMissingPasswordRequirementLabels(newPassword).length > 0) {
      setNewPasswordError(authErrorMessages.passwordComplexity)
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmPasswordError(authErrorMessages.resetConfirmPasswordRequired)
      hasError = true
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError(authErrorMessages.passwordsDoNotMatch)
      hasError = true
    }

    if (hasError) return

    setIsSendingCode(true)
    try {
      const response: any = await authApi.resetPassword(forgotEmail, otp.join(''), newPassword)
      if (response && response.success) {
        handleCloseForgotPassword()
        triggerToast?.(authErrorMessages.passwordResetSuccess, 'success')
      } else {
        triggerToast?.(systemErrorMessage, 'error')
      }
    } catch (error: any) {
      if (isSystemApiError(error)) {
        triggerToast?.(systemErrorMessage, 'error')
      } else {
        setConfirmPasswordError(getAppErrorMessage(error, authErrorMessages.systemError))
      }
    } finally {
      setIsSendingCode(false)
    }
  }

  return {
    confirmPassword,
    confirmPasswordError,
    countdown,
    email,
    emailError,
    forgotEmail,
    forgotEmailError,
    forgotStep,
    handleCloseForgotPassword,
    handleEmailChange,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handlePasswordChange,
    handleResendCode,
    handleResetPassword,
    handleSendCode,
    handleSubmit,
    handleVerifyOtp,
    isLoading,
    isResendingCode,
    isSendingCode,
    keepLoggedIn,
    newPassword,
    newPasswordError,
    otp,
    otpError,
    otpInputsRef,
    password,
    passwordError,
    visiblePasswordError,
    visibleOtpError,
    isPasswordLocked,
    isOtpLocked,
    passwordLockCountdown,
    otpLockCountdown,
    setConfirmPassword,
    setConfirmPasswordError,
    setForgotEmail,
    setForgotEmailError,
    setKeepLoggedIn,
    setNewPassword,
    setNewPasswordError,
    setShowConfirmPassword,
    setShowForgotPassword,
    setShowNewPassword,
    showConfirmPassword,
    showForgotPassword,
    showNewPassword,
    showPassword,
    setShowPassword,
    strength,
  }
}
