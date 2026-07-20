import { authErrorMessages } from '../errors'

export function validateEmail(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return authErrorMessages.emailRequired
  }

  // Sign-up emails must use plain ASCII characters. This explicitly rejects
  // Vietnamese diacritics and other Unicode characters that can resemble ASCII.
  if (
    normalizedValue !== value ||
    normalizedValue.length > 254 ||
    !/^[\p{ASCII}]+$/u.test(normalizedValue)
  ) {
    return authErrorMessages.invalidEmail
  }

  const parts = normalizedValue.split('@')
  if (parts.length !== 2) return authErrorMessages.invalidEmail

  const [localPart, domain] = parts
  if (
    !localPart ||
    localPart.length > 64 ||
    !/^[A-Za-z0-9._%+-]+$/.test(localPart) ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..')
  ) {
    return authErrorMessages.invalidEmail
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
    return authErrorMessages.invalidEmail
  }

  return ''
}

export function validateGmail(value: string) {
  const emailError = validateEmail(value)
  if (emailError) return value.trim() ? authErrorMessages.invalidGmail : emailError

  return value.trim().toLowerCase().endsWith('@gmail.com') ? '' : authErrorMessages.invalidGmail
}

export function validateRequired(value: string, message: string) {
  return value.trim() ? '' : message
}

export function validateFullName(value: string) {
  if (!value.trim()) {
    return authErrorMessages.fullNameRequired
  }

  if (/[^A-Za-z\s]/.test(value.trim())) {
    return authErrorMessages.fullNameSpecialCharacters
  }

  return ''
}

export function validatePhone(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return authErrorMessages.phoneRequired
  }

  if (!/^0\d{9}$/.test(normalizedValue)) {
    return authErrorMessages.invalidPhone
  }

  return ''
}

export function validatePassword(value: string) {
  if (!value) {
    return authErrorMessages.passwordRequired
  }

  if (value.length < 8 || value.length > 20) {
    return authErrorMessages.passwordLength
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value) || !/[^\p{L}\p{N}\s]/u.test(value)) {
    return authErrorMessages.passwordComplexity
  }

  return ''
}

export function validateConfirmPassword(value: string, password: string) {
  if (!value) {
    return authErrorMessages.confirmPasswordRequired
  }

  if (value !== password) {
    return authErrorMessages.passwordsDoNotMatch
  }

  return ''
}
