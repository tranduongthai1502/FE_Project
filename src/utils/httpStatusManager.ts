import { getAppErrorMessage, hasBackendErrorMessage, isInputError } from './errorManager'

export type HttpStatusToastOptions = {
  enabled?: boolean
  fallbackMessage?: string
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

  if (!hasBackendErrorMessage(error)) return true
  if (isInputError(error)) return false

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
