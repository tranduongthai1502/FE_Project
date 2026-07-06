export function validateEmail(value: string) {
  const normalizedValue = value.trim()
  const invalidEmailMessage = 'Invalid email address. Please retry.'

  if (!normalizedValue) {
    return 'Please enter your email.'
  }

  // Sign-up emails must use plain ASCII characters. This explicitly rejects
  // Vietnamese diacritics and other Unicode characters that can resemble ASCII.
  if (
    normalizedValue !== value ||
    normalizedValue.length > 254 ||
    !/^[\p{ASCII}]+$/u.test(normalizedValue)
  ) {
    return invalidEmailMessage
  }

  const parts = normalizedValue.split('@')
  if (parts.length !== 2) return invalidEmailMessage

  const [localPart, domain] = parts
  if (
    !localPart ||
    localPart.length > 64 ||
    !/^[A-Za-z0-9._%+-]+$/.test(localPart) ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..')
  ) {
    return invalidEmailMessage
  }

  const domainLabels = domain.split('.')
  const topLevelDomain = domainLabels.at(-1) ?? ''
  const hasInvalidDomainLabel = domainLabels.some(
    (label) =>
      !label ||
      label.length > 63 ||
      !/^[A-Za-z0-9-]+$/.test(label) ||
      label.startsWith('-') ||
      label.endsWith('-'),
  )

  if (domainLabels.length < 2 || hasInvalidDomainLabel || !/^[A-Za-z]{2,}$/.test(topLevelDomain)) {
    return invalidEmailMessage
  }

  return ''
}

export function validateRequired(value: string, message: string) {
  return value.trim() ? '' : message
}

export function validateFullName(value: string) {
  if (!value.trim()) {
    return 'Please enter your full name.'
  }

  if (value.trim().length < 2) {
    return 'Full name must be at least 2 characters.'
  }

  return ''
}

export function validatePhone(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return 'Please enter your phone number.'
  }

  if (!/^0\d{9}$/.test(normalizedValue)) {
    return 'Phone number must start with 0 and contain exactly 10 digits.'
  }

  return ''
}

export function validatePassword(value: string) {
  if (!value) {
    return 'Please enter your password.'
  }

  if (value.length < 8) {
    return 'Password must be at least 8 characters.'
  }

  return ''
}

export function validateConfirmPassword(value: string, password: string) {
  if (!value) {
    return 'Please confirm your password.'
  }

  if (value !== password) {
    return 'Passwords do not match.'
  }

  return ''
}
