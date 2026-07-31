import { getMissingPasswordRequirementLabels } from '@/core/utils/passwordStrength'

export const FIELD_LENGTH_LIMITS = {
  defaultText: 100,
  phone: 10,
  otpDigit: 1,
  passwordMin: 8,
  passwordMax: 20,
  emailMax: 254,
  emailLocalPartMax: 64,
  emailDomainLabelMax: 63,
  longText: 1000,
  jobDescription: 2000,
} as const

export const validationErrorMessages = {
  fullNameRequired: 'Please enter your full name.',
  fullNameSpecialCharacters: 'Full name must not contain special characters.',
  emailRequired: 'Please enter your email.',
  forgotEmailRequired: 'Please enter your email address.',
  invalidEmail: 'Invalid email address. Please retry.',
  invalidGmail: 'Please enter a valid Gmail address.',
  emailAlreadyRegistered: 'This email is already registered.',
  phoneRequired: 'Please enter your phone number.',
  invalidPhone: 'Invalid phone number.',
  passwordRequired: 'Please enter your password.',
  newPasswordRequired: 'Please enter your new password.',
  confirmPasswordRequired: 'Please confirm your password.',
  confirmNewPasswordRequired: 'Please confirm your new password.',
  resetConfirmPasswordRequired: 'Please enter your confirm password.',
  passwordLength: `Password must be between ${FIELD_LENGTH_LIMITS.passwordMin} and ${FIELD_LENGTH_LIMITS.passwordMax} characters.`,
  passwordComplexity: 'Password must contain at least one letter, one number, and one special character.',
  passwordsDoNotMatch: 'Passwords do not match.',
  incorrectPassword: 'The password is incorrect. Please retry.',
  accountNotFound: 'Account not found. Please check your email.',
  forgotAccountNotFound: 'This email address is not registered in our system.',
  accountDeactivated: 'Your account has been deactivated. Please contact your Tenant Admin for assistance.',
  workspaceSuspended: "Your organization's workspace is currently suspended. Please contact your platform administrator.",
  otpRequired: 'Please enter the OTP code.',
  invalidOtp: 'Invalid OTP. Please retry.',
  expiredOtp: 'OTP has expired. Please request a new one.',
  currentPasswordRequired: 'Please enter your current password.',
  currentPasswordIncorrect: 'Current password is incorrect.',
  newPasswordDuplicatesCurrent: 'New password duplicates current password.',
  requiredField: 'Please fill in all required fields.',
  planNameRequired: 'Please fill in plan name.',
  shortDescriptionRequired: 'Please fill in short description.',
  validPriceRequired: 'Please enter a valid price.',
  positiveNumberOrUnlimitedRequired: 'Please enter a number greater than 0 or select Unlimited.',
  duplicatePlanName: 'A plan with this name already exists. Please choose a different name.',
  duplicateCompanyName: 'This company name is already registered.',
  validEmailAddressRequired: 'Please enter a valid email address.',
  staffFullNameRequired: "Please enter the staff member's full name.",
  duplicateStaffFullName: 'This staff name is already registered.',
  roleRequired: 'Please assign at least one role.',
  accountRoleRequired: 'Please assign at least one role to this account.',
  departmentRequired: 'Please select department type.',
  employmentTypeRequired: 'Please select employment type.',
  duplicateJobTitle: 'A job posting with this title already exists.',
  salaryPairRequired: 'Please enter both minimum and maximum salary or leave both empty.',
  salaryOrderInvalid: 'Maximum salary must be greater than or equal to minimum salary.',
  logoutFailed: 'Unable to log out. Please try again.',
  systemError: 'System error. Please try again.',
} as const

const inputErrorCodes = new Set([
  'email_already_exists',
  'duplicate_email',
  'domain_already_exists',
  'tenant_already_exists',
  'name_already_exists',
  'duplicate_name',
  'wrong_email',
  'wrong_password',
  'password_mismatch',
  'confirm_password_mismatch',
  'must_fill_number_or_choose_unlimited',
  'old_password_can_not_be_the_same_with_new_password',
  'otp_has_expired_please_request_a_new_one',
  'plan_already_exists',
  'max_staff_limit_reached',
  'staff_already_active_or_disabled',
  'invalid_request',
  'invalid_format',
  'invalid_email',
  'invalid_gmail',
  'invalid_phone',
  'invalid_password',
  'field_required',
  'required_field',
  'required',
])

const inputErrorMessagePatterns = [
  /\balready exists?\b/i,
  /\balready registered\b/i,
  /\bduplicate\b/i,
  /\binvalid\b.*\b(format|email|gmail|phone|password|request|data|number|otp)\b/i,
  /\b(format|email|gmail|phone|password|request|data|number|otp)\b.*\binvalid\b/i,
  /\bincorrect\b.*\bpassword\b/i,
  /\bwrong\b.*\bpassword\b/i,
  /\bpasswords?\b.*\b(do not match|does not match|mismatch)\b/i,
  /\bconfirm\b.*\bpassword\b.*\b(required|do not match|does not match|mismatch)\b/i,
  /\b(required|cannot be empty|can not be empty|must not be empty)\b/i,
  /\bplease (enter|fill in|choose|select|assign|confirm)\b/i,
]

export function normalizeInputErrorKey(value: string) {
  return value.trim().toLowerCase()
}

export function isInputErrorCode(value: string) {
  return inputErrorCodes.has(normalizeInputErrorKey(value))
}

export function isInputErrorMessage(value: string) {
  const normalizedValue = value.trim()
  return Boolean(normalizedValue && inputErrorMessagePatterns.some((pattern) => pattern.test(normalizedValue)))
}

export function isPasswordLengthValid(value: string) {
  return value.length >= FIELD_LENGTH_LIMITS.passwordMin && value.length <= FIELD_LENGTH_LIMITS.passwordMax
}

export function validateEmail(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return validationErrorMessages.emailRequired
  }

  if (
    normalizedValue !== value ||
    normalizedValue.length > FIELD_LENGTH_LIMITS.emailMax ||
    !/^[\p{ASCII}]+$/u.test(normalizedValue)
  ) {
    return validationErrorMessages.invalidEmail
  }

  const parts = normalizedValue.split('@')
  if (parts.length !== 2) return validationErrorMessages.invalidEmail

  const [localPart, domain] = parts
  if (
    !localPart ||
    localPart.length > FIELD_LENGTH_LIMITS.emailLocalPartMax ||
    !/^[A-Za-z0-9._%+-]+$/.test(localPart) ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..')
  ) {
    return validationErrorMessages.invalidEmail
  }

  const domainLabels = domain.split('.')
  const topLevelDomain = domainLabels.at(-1) ?? ''
  const hasInvalidDomainLabel = domainLabels.some(
    (label) =>
      !label ||
      label.length > FIELD_LENGTH_LIMITS.emailDomainLabelMax ||
      !/^[A-Za-z0-9-]+$/.test(label) ||
      label.startsWith('-') ||
      label.endsWith('-'),
  )

  if (domainLabels.length < 2 || hasInvalidDomainLabel || !/^[A-Za-z]{2,}$/.test(topLevelDomain)) {
    return validationErrorMessages.invalidEmail
  }

  return ''
}

export function validateGmail(value: string) {
  const emailError = validateEmail(value)
  if (emailError) return value.trim() ? validationErrorMessages.invalidGmail : emailError

  return value.trim().toLowerCase().endsWith('@gmail.com') ? '' : validationErrorMessages.invalidGmail
}

export function validateRequired(value: string, message: string = validationErrorMessages.requiredField) {
  return value.trim() ? '' : message
}

export function validateFullName(value: string) {
  if (!value.trim()) {
    return validationErrorMessages.fullNameRequired
  }

  if (/[^A-Za-z\s]/.test(value.trim())) {
    return validationErrorMessages.fullNameSpecialCharacters
  }

  return ''
}

export function validatePhone(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return validationErrorMessages.phoneRequired
  }

  if (!/^0\d{9}$/.test(normalizedValue)) {
    return validationErrorMessages.invalidPhone
  }

  return ''
}

export function validatePassword(value: string) {
  if (!value) {
    return validationErrorMessages.passwordRequired
  }

  if (!isPasswordLengthValid(value)) {
    return validationErrorMessages.passwordLength
  }

  if (getMissingPasswordRequirementLabels(value).length > 0) {
    return validationErrorMessages.passwordComplexity
  }

  return ''
}

export function validateConfirmPassword(value: string, password: string) {
  if (!value) {
    return validationErrorMessages.confirmPasswordRequired
  }

  if (value !== password) {
    return validationErrorMessages.passwordsDoNotMatch
  }

  return ''
}

export function validateOptionalEmail(value: string, emptyMessage = validationErrorMessages.forgotEmailRequired) {
  return value.trim() ? validateEmail(value) : emptyMessage
}

export function validateStaffEmail(value: string, existingEmails: string[], isEdit = false) {
  const trimmedEmail = value.trim()
  const emailError = validateEmail(value)
  if (emailError) return trimmedEmail ? validationErrorMessages.validEmailAddressRequired : validationErrorMessages.forgotEmailRequired

  const isEmailRegistered = existingEmails.some((email) => email.trim().toLowerCase() === trimmedEmail.toLowerCase())
  if (!isEdit && isEmailRegistered) {
    return validationErrorMessages.emailAlreadyRegistered
  }

  return ''
}

export function isValidPriceInput(value: string) {
  const trimmedValue = value.replace(/,/g, '').trim()
  return /^\d+(\.\d{1,2})?$/.test(trimmedValue) && Number(trimmedValue) >= 0
}

export function isValidPositiveIntegerInput(value: string) {
  const trimmedValue = value.trim()
  return /^\d+$/.test(trimmedValue) && Number(trimmedValue) > 0
}

export function validateRequiredPlanName(value: string, isDuplicate = false) {
  if (!value.trim()) return validationErrorMessages.planNameRequired
  if (isDuplicate) return validationErrorMessages.duplicatePlanName
  return ''
}

export function validateRequiredShortDescription(value: string) {
  return value.trim() ? '' : validationErrorMessages.shortDescriptionRequired
}

export function validateRequiredPrice(value: string) {
  return isValidPriceInput(value) ? '' : validationErrorMessages.validPriceRequired
}

export function validatePositiveNumberOrUnlimited(value: string, isUnlimited: boolean) {
  return isUnlimited || isValidPositiveIntegerInput(value)
    ? ''
    : validationErrorMessages.positiveNumberOrUnlimitedRequired
}
