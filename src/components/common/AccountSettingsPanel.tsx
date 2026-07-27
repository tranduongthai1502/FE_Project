import { ChangePasswordView } from './ChangePasswordView'

export function AccountSettingsPanel({
  isPasswordChangeRequired = false,
  onBack,
  triggerToast,
}: {
  isPasswordChangeRequired?: boolean
  onBack: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  return (
    <ChangePasswordView
      isPasswordChangeRequired={isPasswordChangeRequired}
      onBack={onBack}
      triggerToast={triggerToast}
    />
  )
}
