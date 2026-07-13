import { CandidateChangePasswordView } from '@/features/auth'

export function AccountSettingsView({ onBack, triggerToast }: { onBack: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  return <CandidateChangePasswordView onBack={onBack} triggerToast={triggerToast} />
}
