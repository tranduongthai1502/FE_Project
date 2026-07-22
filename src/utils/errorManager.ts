import { backendAuthErrorMessages } from '@/features/auth/errors/authErrorMessages'

export const errorMessages: Record<string, string> = {
  ...backendAuthErrorMessages,
  email_already_exists: backendAuthErrorMessages.email_already_exists,
  domain_already_exists: 'Domain already exists. Please use another domain.',
  tenant_already_exists: 'Tenant already exists.',
  name_already_exists: 'Name already exists. Please use another name.',
  user_not_found: backendAuthErrorMessages.user_not_found,
  invalid_token: 'Invalid token. Please sign in again.',
  wrong_email: 'Email address is incorrect.',
  wrong_password: backendAuthErrorMessages.wrong_password,
  access_denied: 'You do not have permission to perform this action.',
  user_account_is_not_active: backendAuthErrorMessages.user_account_is_not_active,
  inactive_user: backendAuthErrorMessages.inactive_user,
  tenant_is_inactive: backendAuthErrorMessages.tenant_is_inactive,
  account_deactivated: backendAuthErrorMessages.account_deactivated,
  user_deactivated: backendAuthErrorMessages.user_deactivated,
  account_deleted: backendAuthErrorMessages.account_deleted,
  tenant_deactivated: backendAuthErrorMessages.tenant_deactivated,
  tenant_suspended: backendAuthErrorMessages.tenant_suspended,
  workspace_suspended: backendAuthErrorMessages.workspace_suspended,
  must_fill_number_or_choose_unlimited: 'Please enter a valid number or choose Unlimited.',
  an_unexpected_error_occured_please_try_again_later: 'An unexpected error occurred. Please try again later.',
  old_password_can_not_be_the_same_with_new_password: backendAuthErrorMessages.old_password_can_not_be_the_same_with_new_password,
  otp_has_expired_please_request_a_new_one: backendAuthErrorMessages.otp_has_expired_please_request_a_new_one,
  plan_not_found: 'Subscription plan not found.',
  role_not_found: 'Role not found.',
  tenant_not_found: 'Tenant not found.',
  plan_already_exists: 'Subscription plan already exists.',
  max_staff_limit_reached: 'Maximum staff limit reached.',
  staff_already_active_or_disabled: 'Staff account is already active or disabled.',
  invalid_request: 'Invalid request. Please check your information and try again.',
  forbidden: 'You do not have permission to perform this action.',
  unauthorized: 'Your session has expired. Please sign in again.',
}

const inputErrorCodes = new Set([
  'email_already_exists',
  'domain_already_exists',
  'tenant_already_exists',
  'name_already_exists',
  'wrong_email',
  'wrong_password',
  'must_fill_number_or_choose_unlimited',
  'old_password_can_not_be_the_same_with_new_password',
  'otp_has_expired_please_request_a_new_one',
  'plan_already_exists',
  'max_staff_limit_reached',
  'staff_already_active_or_disabled',
  'invalid_request',
])

function normalizeErrorKey(value: string) {
  return value.trim().toLowerCase()
}

function humanizeErrorCode(code: string) {
  return code
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^./, (value) => value.toUpperCase())
}

export function getErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return ''

  const errorObject = error as {
    code?: unknown
    errorCode?: unknown
    response?: {
      data?: {
        code?: unknown
        errorCode?: unknown
        error?: unknown
        data?: {
          code?: unknown
          errorCode?: unknown
          error?: unknown
        }
      }
    }
  }

  return String(
    errorObject.code ||
    errorObject.errorCode ||
    errorObject.response?.data?.code ||
    errorObject.response?.data?.errorCode ||
    errorObject.response?.data?.data?.code ||
    errorObject.response?.data?.data?.errorCode ||
    errorObject.response?.data?.error ||
    errorObject.response?.data?.data?.error ||
    '',
  )
}

export function getBackendErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return ''

  const errorObject = error as {
    isAppErrorMessage?: unknown
    hasBackendMessage?: unknown
    message?: unknown
    response?: {
      data?: {
        message?: unknown
        data?: {
          message?: unknown
        }
      }
    }
  }

  return String(
    errorObject.response?.data?.message ||
    errorObject.response?.data?.data?.message ||
    (!(error instanceof Error) ? errorObject.message : '') ||
    (errorObject.isAppErrorMessage && errorObject.hasBackendMessage ? errorObject.message : '') ||
    '',
  )
}

export function hasBackendErrorMessage(error: unknown) {
  return Boolean(getBackendErrorMessage(error).trim())
}

export function getErrorRawMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== 'object') return ''

  const errorObject = error as {
    message?: unknown
    response?: {
      data?: {
        message?: unknown
        error?: unknown
        code?: unknown
        data?: {
          message?: unknown
          error?: unknown
          code?: unknown
        }
      }
    }
  }

  return String(
    errorObject.response?.data?.message ||
    errorObject.response?.data?.error ||
    errorObject.response?.data?.code ||
    errorObject.response?.data?.data?.message ||
    errorObject.response?.data?.data?.error ||
    errorObject.response?.data?.data?.code ||
    errorObject.message ||
    '',
  )
}

export function translateErrorCode(value: string) {
  const key = normalizeErrorKey(value)
  return errorMessages[key] || ''
}

export function isInputErrorCode(value: string) {
  return inputErrorCodes.has(normalizeErrorKey(value))
}

export function isInputError(error: unknown) {
  if (!hasBackendErrorMessage(error)) return false

  const code = getErrorCode(error)
  const rawMessage = getErrorRawMessage(error)

  return Boolean(
    (code && isInputErrorCode(code)) ||
    (rawMessage && isInputErrorCode(rawMessage)),
  )
}

export function getAppErrorMessage(error: unknown, fallbackMessage: string) {
  const code = getErrorCode(error)
  const backendMessage = getBackendErrorMessage(error).trim()

  if (backendMessage) {
    const translatedBackendMessage = translateErrorCode(backendMessage)
    return translatedBackendMessage || backendMessage
  }

  if (fallbackMessage) return fallbackMessage

  const rawMessage = getErrorRawMessage(error)
  const normalizedMessage = rawMessage.trim()
  const translatedCode = code ? translateErrorCode(code) : ''
  if (translatedCode) return translatedCode

  const translatedMessage = translateErrorCode(normalizedMessage)
  if (translatedMessage) return translatedMessage

  if (!normalizedMessage) return 'An error occurred. Please try again.'

  if (/^[a-z][a-z0-9_-]+$/i.test(normalizedMessage)) {
    return `${humanizeErrorCode(normalizedMessage)}.`
  }

  return normalizedMessage
}
