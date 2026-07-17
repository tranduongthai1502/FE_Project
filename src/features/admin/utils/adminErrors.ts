const adminErrorMessages: Record<string, string> = {
  email_already_exists: 'Email already exists. Please use another email address.',
  domain_already_exists: 'Domain already exists. Please use another domain.',
  tenant_already_exists: 'Tenant already exists.',
  plan_already_exists: 'Subscription plan already exists.',
  name_already_exists: 'Name already exists. Please use another name.',
  invalid_request: 'Invalid request. Please check your information and try again.',
  forbidden: 'You do not have permission to perform this action.',
  unauthorized: 'Your session has expired. Please sign in again.',
}

function humanizeErrorCode(message: string) {
  return message
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^./, (value) => value.toUpperCase())
}

export function getAdminErrorMessage(error: unknown, fallbackMessage: string) {
  const rawMessage = error instanceof Error ? error.message : ''
  const normalized = rawMessage.trim()

  if (!normalized) return fallbackMessage

  const messageKey = normalized.toLowerCase()
  if (adminErrorMessages[messageKey]) {
    return adminErrorMessages[messageKey]
  }

  if (/^[a-z][a-z0-9_-]+$/i.test(normalized)) {
    return `${humanizeErrorCode(normalized)}.`
  }

  return normalized
}
