export { ChangePasswordView, CandidateChangePasswordView } from '@/core/components/ChangePasswordView'
export { LoginFeature } from './presentation/components/LoginFeature'
export { SignupFeature } from './presentation/components/SignupFeature'
export { ForgotPasswordForm } from './presentation/components/ForgotPasswordForm'
export { OtpForm } from './presentation/components/OtpForm'
export { ResetPasswordForm } from './presentation/components/ResetPasswordForm'
export { ProtectedRoute } from './presentation/components/ProtectedRoute'
export { RoleGuard } from './presentation/components/RoleGuard'

export { authApi } from '@/core/api/authApi'

export { useAuthSession } from './application/useAuthSession'

export { getPasswordStrength } from '@/core/utils/passwordStrength'
export {
  authErrorMessages,
  backendAuthErrorMessages,
  getLoginFailureMessage,
  getOtpErrorMessage,
  isAccountDeactivatedError,
  isAccountNotFoundError,
  isExpiredOtpError,
  isIncorrectPasswordError,
  isSystemApiError,
  isWorkspaceSuspendedError,
} from './application'
export {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validateGmail,
  validatePassword,
  validatePhone,
  validateRequired,
} from './application/validation'

export type { ChangePasswordPayload, LoginPayload, RegisterPayload } from '@/core/api/api.types'
export type { AppRole } from './domain/role.types'
export type { AuthUser } from './domain/user.types'
export { getPageForUserRole, unsupportedRoleMessage } from './application/authRole'
export {
  AUTH_EXPIRED_EVENT_NAME,
  AUTH_PAGE_STORAGE_KEY,
  clearAuthStorage,
  getStoredAuthRole,
  saveAuthRole,
} from '@/core/api/authStorage'
