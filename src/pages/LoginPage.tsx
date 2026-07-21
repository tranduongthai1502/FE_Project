import { LoginFeature } from '@/features/auth'

type LoginPageProps = {
  onGoToSignup: () => void
  onSignInSuccess: (
    email: string,
    keepLoggedIn: boolean,
    userRole: string,
    options?: { requirePasswordChange?: boolean },
  ) => boolean
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

export function LoginPage({ onGoToSignup, onSignInSuccess, triggerToast }: LoginPageProps) {
  return (
    <LoginFeature
      onGoToSignup={onGoToSignup}
      onSignInSuccess={onSignInSuccess}
      triggerToast={triggerToast}
    />
  )
}
