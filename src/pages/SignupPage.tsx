import { SignupFeature } from '@/features/auth'

type SignupPageProps = {
  onGoToSignin: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

export function SignupPage({ onGoToSignin, triggerToast }: SignupPageProps) {
  return (
    <SignupFeature
      onGoToSignin={onGoToSignin}
      triggerToast={triggerToast}
    />
  )
}
