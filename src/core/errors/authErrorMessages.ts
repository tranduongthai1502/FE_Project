import { validationErrorMessages } from '@/core/api/axiosErrorHandler'

export const authErrorMessages = {
  ...validationErrorMessages,
  registerSuccess: 'Register succeeded. Please log in.',
  passwordResetSuccess: 'Password reset successful.',
} as const

export const backendAuthErrorMessages: Record<string, string> = {
  email_already_exists: authErrorMessages.emailAlreadyRegistered,
  wrong_password: authErrorMessages.incorrectPassword,
  user_not_found: authErrorMessages.accountNotFound,
  account_deleted: authErrorMessages.accountNotFound,
  account_deactivated: authErrorMessages.accountDeactivated,
  user_deactivated: authErrorMessages.accountDeactivated,
  user_account_is_not_active: authErrorMessages.accountDeactivated,
  inactive_user: authErrorMessages.accountDeactivated,
  tenant_is_inactive: authErrorMessages.accountDeactivated,
  tenant_deactivated: authErrorMessages.workspaceSuspended,
  tenant_suspended: authErrorMessages.workspaceSuspended,
  workspace_suspended: authErrorMessages.workspaceSuspended,
  otp_has_expired_please_request_a_new_one: authErrorMessages.expiredOtp,
  old_password_can_not_be_the_same_with_new_password: authErrorMessages.newPasswordDuplicatesCurrent,
}
