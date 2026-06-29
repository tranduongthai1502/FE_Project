export function validateEmail(value) {
  if (!value) {
    return 'Please enter your email address.'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return 'Invalid email address. Please retry.'
  }

  return ''
}
