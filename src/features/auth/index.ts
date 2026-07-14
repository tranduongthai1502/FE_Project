export { CandidateChangePasswordView } from './components/ChangePasswordView'
export { LoginFeature } from './components/LoginFeature'
export { SignupFeature } from './components/SignupFeature'
export { ForgotPasswordForm } from './components/ForgotPasswordForm'
export { OtpForm } from './components/OtpForm'
export { ResetPasswordForm } from './components/ResetPasswordForm'

export { authApi } from './services/authApi'

export { useAuthSession } from './hooks/useAuthSession'

export { getPasswordStrength } from './utils/passwordStrength'
export {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
  validateRequired,
} from './utils/validation'

export type { ChangePasswordPayload, LoginPayload, RegisterPayload } from './types/auth.types'
export type { AppRole } from './utils/authRole'
export { getPageForUserRole, unsupportedRoleMessage } from './utils/authRole'
export {
  AUTH_EXPIRED_EVENT_NAME,
  AUTH_PAGE_STORAGE_KEY,
  clearAuthStorage,
  getStoredAuthRole,
  saveAuthRole,
} from './utils/authStorage'
