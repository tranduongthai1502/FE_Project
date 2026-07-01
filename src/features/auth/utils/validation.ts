export function validateEmail(value: string) {
  if (!value) {
    return 'Please enter your email address.'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address'
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
