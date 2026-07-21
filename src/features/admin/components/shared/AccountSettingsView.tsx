import { CandidateChangePasswordView } from '@/features/auth'

export function AccountSettingsView({
  isPasswordChangeRequired = false,
  onBack,
  triggerToast,
}: {
  isPasswordChangeRequired?: boolean
  onBack: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  return (
    <CandidateChangePasswordView
      isPasswordChangeRequired={isPasswordChangeRequired}
      onBack={onBack}
      triggerToast={triggerToast}
    />
  )
}
