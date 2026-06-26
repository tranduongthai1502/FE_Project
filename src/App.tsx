import { useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import './App.css'

type AuthPage = 'login' | 'signup'

export default function App() {
  const [page, setPage] = useState<AuthPage>('login')

  if (page === 'signup') {
    return <SignupPage onGoToSignin={() => setPage('login')} />
  }

  return <LoginPage onGoToSignup={() => setPage('signup')} />
}
