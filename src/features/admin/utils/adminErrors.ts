import { getAppErrorMessage, getErrorCode, getErrorRawMessage } from '../../../utils/errorManager'

export const inactiveUserActionMessage = 'You do not have permission to perform this action.'

export function isInactiveUserActionError(error: unknown) {
  const code = getErrorCode(error).trim().toLowerCase()
  const message = getErrorRawMessage(error).trim().toLowerCase()
  const backendMessage = String((error as { backendMessage?: unknown } | null)?.backendMessage || '').trim().toLowerCase()

  return (
    code === 'user_is_not_active' ||
    code === 'user_account_is_not_active' ||
    code === 'inactive_user' ||
    backendMessage === 'user_is_not_active' ||
    backendMessage === 'user_account_is_not_active' ||
    backendMessage === 'inactive_user' ||
    message.includes('user is not active') ||
    message.includes('user account is not active') ||
    backendMessage.includes('user is not active') ||
    backendMessage.includes('user account is not active')
  )
}

export function getAdminErrorMessage(error: unknown, fallbackMessage: string) {
  if (isInactiveUserActionError(error)) return inactiveUserActionMessage

  return getAppErrorMessage(error, fallbackMessage)
}
