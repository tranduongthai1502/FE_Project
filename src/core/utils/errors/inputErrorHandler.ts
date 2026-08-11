import { getMissingPasswordRequirementLabels } from '@/core/utils/passwordStrength'
import { z } from 'zod'

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

function getZodErrorMessage(result: z.ZodSafeParseResult<unknown>) {
  return result.success ? '' : result.error.issues[0]?.message || validationErrorMessages.systemError
}

const asciiEmailSchema = z
  .string()
  .trim()
  .min(1, validationErrorMessages.emailRequired)
  .max(FIELD_LENGTH_LIMITS.emailMax, validationErrorMessages.invalidEmail)
  .regex(/^[\p{ASCII}]+$/u, validationErrorMessages.invalidEmail)
  .superRefine((value, context) => {
    const parts = value.split('@')
    if (parts.length !== 2) {
      context.addIssue({ code: 'custom', message: validationErrorMessages.invalidEmail })
      return
    }

    const [localPart, domain] = parts
    if (
      !localPart ||
      localPart.length > FIELD_LENGTH_LIMITS.emailLocalPartMax ||
      !/^[A-Za-z0-9._%+-]+$/.test(localPart) ||
      localPart.startsWith('.') ||
      localPart.endsWith('.') ||
      localPart.includes('..')
    ) {
      context.addIssue({ code: 'custom', message: validationErrorMessages.invalidEmail })
      return
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
      context.addIssue({ code: 'custom', message: validationErrorMessages.invalidEmail })
    }
  })

export function validateEmail(value: string) {
  if (value.trim() !== value) return validationErrorMessages.invalidEmail
  return getZodErrorMessage(asciiEmailSchema.safeParse(value))
}

export function validateGmail(value: string) {
  const emailError = validateEmail(value)
  if (emailError) return value.trim() ? validationErrorMessages.invalidGmail : emailError

  return getZodErrorMessage(
    z.string().refine((email) => email.trim().toLowerCase().endsWith('@gmail.com'), validationErrorMessages.invalidGmail).safeParse(value),
  )
}

export function validateRequired(value: string, message: string = validationErrorMessages.requiredField) {
  return getZodErrorMessage(z.string().trim().min(1, message).safeParse(value))
}

export function validateFullName(value: string) {
  return getZodErrorMessage(
    z
      .string()
      .trim()
      .min(1, validationErrorMessages.fullNameRequired)
      .regex(/^[A-Za-z\s]+$/, validationErrorMessages.fullNameSpecialCharacters)
      .safeParse(value),
  )
}

export function validatePhone(value: string) {
  return getZodErrorMessage(
    z.string().trim().min(1, validationErrorMessages.phoneRequired).regex(/^0\d{9}$/, validationErrorMessages.invalidPhone).safeParse(value),
  )
}

export function validatePassword(value: string) {
  return getZodErrorMessage(
    z
      .string()
      .min(1, validationErrorMessages.passwordRequired)
      .min(FIELD_LENGTH_LIMITS.passwordMin, validationErrorMessages.passwordLength)
      .max(FIELD_LENGTH_LIMITS.passwordMax, validationErrorMessages.passwordLength)
      .refine((password) => getMissingPasswordRequirementLabels(password).length === 0, validationErrorMessages.passwordComplexity)
      .safeParse(value),
  )
}

export function validateConfirmPassword(value: string, password: string) {
  return getZodErrorMessage(
    z
      .string()
      .min(1, validationErrorMessages.confirmPasswordRequired)
      .refine((confirmPassword) => confirmPassword === password, validationErrorMessages.passwordsDoNotMatch)
      .safeParse(value),
  )
}

export function validateOptionalEmail(value: string, emptyMessage = validationErrorMessages.forgotEmailRequired) {
  return value.trim() ? validateEmail(value) : emptyMessage
}

export function validateStaffEmail(value: string, existingEmails: string[], isEdit = false) {
  const trimmedEmail = value.trim()
  const emailError = validateEmail(value)
  if (emailError) return trimmedEmail ? validationErrorMessages.validEmailAddressRequired : validationErrorMessages.forgotEmailRequired

  return getZodErrorMessage(
    z
      .string()
      .refine(
        () => isEdit || !existingEmails.some((email) => email.trim().toLowerCase() === trimmedEmail.toLowerCase()),
        validationErrorMessages.emailAlreadyRegistered,
      )
      .safeParse(trimmedEmail),
  )
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
