import {
  isInputErrorCode,
  isInputErrorMessage,
  validationErrorMessages,
} from '../error/inputErrorHandler'

export {
  FIELD_LENGTH_LIMITS,
  isValidPositiveIntegerInput,
  isValidPriceInput,
  isInputErrorCode,
  isInputErrorMessage,
  isPasswordLengthValid,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validateGmail,
  validateOptionalEmail,
  validatePassword,
  validatePhone,
  validatePositiveNumberOrUnlimited,
  validateRequired,
  validateRequiredPlanName,
  validateRequiredPrice,
  validateRequiredShortDescription,
  validateStaffEmail,
  validationErrorMessages,
} from '../error/inputErrorHandler'

export type HttpStatusToastOptions = {
  enabled?: boolean
  fallbackMessage?: string
}

type AppErrorInfo = {
  message: string
  status: number
  code: string
  backendMessage: string
  errorData: any
  hasBackendMessage: boolean
}

export const errorMessages: Record<string, string> = {
  email_already_exists: validationErrorMessages.emailAlreadyRegistered,
  domain_already_exists: 'Domain already exists. Please use another domain.',
  tenant_already_exists: 'Tenant already exists.',
  name_already_exists: 'Name already exists. Please use another name.',
  user_not_found: validationErrorMessages.accountNotFound,
  invalid_token: 'Invalid token. Please sign in again.',
  wrong_email: 'Email address is incorrect.',
  wrong_password: validationErrorMessages.incorrectPassword,
  password_mismatch: validationErrorMessages.passwordsDoNotMatch,
  confirm_password_mismatch: validationErrorMessages.passwordsDoNotMatch,
  duplicate_name: 'Name already exists. Please use another name.',
  duplicate_email: validationErrorMessages.emailAlreadyRegistered,
  field_required: validationErrorMessages.requiredField,
  required_field: validationErrorMessages.requiredField,
  invalid_format: 'Invalid format. Please check your information and try again.',
  invalid_email: validationErrorMessages.invalidEmail,
  invalid_gmail: validationErrorMessages.invalidGmail,
  invalid_phone: validationErrorMessages.invalidPhone,
  invalid_password: 'Password format is invalid.',
  access_denied: 'You do not have permission to perform this action.',
  user_account_is_not_active: 'Your account has been deactivated. Please contact your Tenant Admin for assistance.',
  inactive_user: 'Your account has been deactivated. Please contact your Tenant Admin for assistance.',
  tenant_is_inactive: 'Your account has been deactivated. Please contact your Tenant Admin for assistance.',
  account_deactivated: 'Your account has been deactivated. Please contact your Tenant Admin for assistance.',
  user_deactivated: 'Your account has been deactivated. Please contact your Tenant Admin for assistance.',
  account_deleted: 'Account not found. Please check your email.',
  tenant_deactivated: "Your organization's workspace is currently suspended. Please contact your platform administrator.",
  tenant_suspended: "Your organization's workspace is currently suspended. Please contact your platform administrator.",
  workspace_suspended: "Your organization's workspace is currently suspended. Please contact your platform administrator.",
  must_fill_number_or_choose_unlimited: 'Please enter a valid number or choose Unlimited.',
  an_unexpected_error_occured_please_try_again_later: 'An unexpected error occurred. Please try again later.',
  old_password_can_not_be_the_same_with_new_password: validationErrorMessages.newPasswordDuplicatesCurrent,
  otp_has_expired_please_request_a_new_one: validationErrorMessages.expiredOtp,
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

export const httpStatusMessages: Record<number, string> = {
  0: 'Cannot connect to the server. Please check your connection and try again.',
  400: 'Invalid request. Please check your information and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'Requested data was not found.',
  409: 'The data already exists or conflicts with another record.',
  422: 'Invalid data. Please check your information and try again.',
  429: 'Too many requests. Please try again later.',
  500: 'The system is currently unavailable. Please try again later.',
  502: 'The server returned an invalid response. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The server took too long to respond. Please try again later.',
}

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

function getBackendMessage(errorData: any) {
  return String(errorData?.message || errorData?.data?.message || '')
}

function getBackendCode(errorData: any, backendMessage: string) {
  return getErrorCode(errorData) || (/^[a-z][a-z0-9_-]+$/i.test(backendMessage) ? backendMessage : '')
}

export function getErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return ''

  const errorObject = error as {
    code?: unknown
    errorCode?: unknown
    error?: unknown
    data?: {
      code?: unknown
      errorCode?: unknown
      error?: unknown
    }
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
    errorObject.data?.code ||
    errorObject.data?.errorCode ||
    errorObject.data?.error ||
    errorObject.response?.data?.code ||
    errorObject.response?.data?.errorCode ||
    errorObject.response?.data?.data?.code ||
    errorObject.response?.data?.data?.errorCode ||
    errorObject.error ||
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
    data?: {
      message?: unknown
    }
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
    errorObject.data?.message ||
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
    data?: {
      message?: unknown
      error?: unknown
      code?: unknown
    }
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
    errorObject.data?.message ||
    errorObject.data?.error ||
    errorObject.data?.code ||
    errorObject.message ||
    '',
  )
}

export function translateErrorCode(value: string) {
  const key = normalizeErrorKey(value)
  return errorMessages[key] || ''
}

export function isInputError(error: unknown) {
  const code = getErrorCode(error)
  const backendMessage = getBackendErrorMessage(error)
  const rawMessage = getErrorRawMessage(error)
  const appMessage = error instanceof Error ? error.message : ''

  return Boolean(
    (code && isInputErrorCode(code)) ||
    (backendMessage && (isInputErrorCode(backendMessage) || isInputErrorMessage(backendMessage))) ||
    (rawMessage && (isInputErrorCode(rawMessage) || isInputErrorMessage(rawMessage))) ||
    (appMessage && isInputErrorMessage(appMessage)),
  )
}

export function getAppErrorMessage(error: unknown, fallbackMessage: string) {
  const code = getErrorCode(error)
  const backendMessage = getBackendErrorMessage(error).trim()

  if (backendMessage) {
    const translatedBackendMessage = translateErrorCode(backendMessage)
    if (translatedBackendMessage) return translatedBackendMessage

    if (/^[a-z][a-z0-9_-]+$/i.test(backendMessage)) {
      return `${humanizeErrorCode(backendMessage)}.`
    }
  }

  const rawMessage = getErrorRawMessage(error)
  const normalizedMessage = rawMessage.trim()
  const translatedCode = code ? translateErrorCode(code) : ''
  if (translatedCode) return translatedCode

  const translatedMessage = translateErrorCode(normalizedMessage)
  if (translatedMessage) return translatedMessage

  if (fallbackMessage) return fallbackMessage

  if (/^[a-z][a-z0-9_-]+$/i.test(normalizedMessage)) {
    return `${humanizeErrorCode(normalizedMessage)}.`
  }

  return 'An error occurred. Please try again.'
}

export function getHttpStatus(error: unknown) {
  if (!error || typeof error !== 'object') return 0

  const errorObject = error as {
    status?: unknown
    httpStatus?: unknown
    response?: {
      status?: unknown
      data?: {
        httpStatus?: unknown
        statusCode?: unknown
      }
    }
  }

  return Number(
    errorObject.status ||
    errorObject.httpStatus ||
    errorObject.response?.status ||
    errorObject.response?.data?.httpStatus ||
    errorObject.response?.data?.statusCode ||
    0,
  )
}

export function getHttpStatusMessage(status: number) {
  return httpStatusMessages[status] || ''
}

export function shouldToastHttpStatus(status: number, options?: HttpStatusToastOptions) {
  if (options?.enabled === false) return false
  if (options?.enabled === true) return true

  return (status >= 200 && status < 300) || (status >= 500 && status < 600)
}

export function shouldToastHttpError(error: unknown, options?: HttpStatusToastOptions) {
  if (options?.enabled === false) return false
  if (options?.enabled === true) return true

  if (isInputError(error)) return false
  if (!hasBackendErrorMessage(error)) return true

  return shouldToastHttpStatus(getHttpStatus(error))
}

export function getHttpErrorToastMessage(error: unknown, options?: HttpStatusToastOptions) {
  const status = getHttpStatus(error)
  const fallbackMessage =
    options?.fallbackMessage ||
    getHttpStatusMessage(status) ||
    'An error occurred. Please try again.'

  return getAppErrorMessage(error, fallbackMessage)
}

export function createAppError(errorInfo: AppErrorInfo) {
  return Object.assign(new Error(errorInfo.message), {
    status: errorInfo.status,
    code: errorInfo.code,
    backendMessage: errorInfo.backendMessage,
    errorData: errorInfo.errorData,
    hasBackendMessage: errorInfo.hasBackendMessage,
    isAppErrorMessage: true,
  })
}

export function buildSuccessFalseErrorInfo(responseData: any, status: number): AppErrorInfo {
  const backendMessage = getBackendMessage(responseData)

  return {
    message: getAppErrorMessage(responseData, getHttpStatusMessage(status)),
    status,
    code: getBackendCode(responseData, backendMessage),
    backendMessage,
    errorData: responseData,
    hasBackendMessage: Boolean(responseData.message || responseData.data?.message),
  }
}

export function buildAxiosErrorInfo(error: any): AppErrorInfo {
  const errorData = error.response?.data
  const backendMessage = getBackendMessage(errorData)
  const status = getHttpStatus(error)

  return {
    message: getAppErrorMessage(error, getHttpStatusMessage(status)),
    status,
    code: getBackendCode(errorData, backendMessage),
    backendMessage,
    errorData,
    hasBackendMessage: hasBackendErrorMessage(error),
  }
}

export function getHttpStatusFallbackMessage(status: number) {
  return getHttpStatusMessage(status)
}
