import { getAppErrorMessage, getErrorCode } from '@/utils/errorManager'
import { authErrorMessages } from './authErrorMessages'

export function isAccountNotFoundError(message = '') {
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
    normalizedMessage.includes('not registered') ||
    normalizedMessage.includes('does not exist')
  )
}

export function isExpiredOtpError(message = '') {
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
    normalizedMessage.includes('expired') ||
    normalizedMessage.includes('expire')
  )
}

export function getOtpErrorMessage(message = '', isKnownExpiredOtp = false) {
  return isKnownExpiredOtp || isExpiredOtpError(message)
    ? authErrorMessages.expiredOtp
    : authErrorMessages.invalidOtp
}

export function isIncorrectPasswordError(message = '', code = '') {
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

export function isAccountDeactivatedError(message = '', code = '') {
  const normalizedMessage = message.toLowerCase()
  const normalizedCode = code.toLowerCase()

  return (
    normalizedCode === 'user_account_is_not_active' ||
    normalizedCode === 'inactive_user' ||
    normalizedCode === 'account_deactivated' ||
    normalizedCode === 'user_deactivated' ||
    normalizedMessage.includes('user_account_is_not_active') ||
    normalizedMessage.includes('account has been deactivated') ||
    normalizedMessage.includes('user account is not active')
  )
}

export function isWorkspaceSuspendedError(message = '', code = '') {
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

export function getLoginFailureMessage(error: unknown, fallbackMessage = authErrorMessages.incorrectPassword) {
  const message = getAppErrorMessage(error, fallbackMessage)
  const code = getErrorCode(error)

  if (isAccountNotFoundError(message)) return authErrorMessages.accountNotFound
  if (isWorkspaceSuspendedError(message, code)) return authErrorMessages.workspaceSuspended
  if (isAccountDeactivatedError(message, code)) return authErrorMessages.accountDeactivated
  if (isIncorrectPasswordError(message, code)) return authErrorMessages.incorrectPassword

  return message || fallbackMessage
}

export function isSystemApiError(error: { status?: unknown }) {
  const status = Number(error?.status ?? 0)
  return status === 0 || status >= 500
}
