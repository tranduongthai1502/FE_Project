import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { getPasswordStrength } from '../utils/passwordStrength'
import { validateEmail } from '../utils/validation'

const emptyOtp = ['', '', '', '', '', '']

type AuthStep = 'login' | 'forgot' | 'register' | 'otp' | 'reset' | 'admin'

type UseAuthFlowOptions = {
  triggerToast?: (message?: string) => void
  onSignInSuccess: () => void
}

export function useAuthFlow({ triggerToast, onSignInSuccess }: UseAuthFlowOptions) {
  const [step, setStep] = useState<AuthStep>('login')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const [otp, setOtp] = useState<string[]>(emptyOtp)
  const [otpError, setOtpError] = useState('')
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([])

  const [countdown, setCountdown] = useState(59)
  const timerRef = useRef<number | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const strength = getPasswordStrength(newPassword)

  const startTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    setCountdown(59)
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (step === 'otp') {
      startTimer()
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [step])

  const handleSendCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const error = validateEmail(email)
    if (error) {
      setEmailError(error)
      return
    }

    setEmailError('')
    setIsAuthLoading(true)

    setTimeout(() => {
      setIsAuthLoading(false)
      setStep('otp')
    }, 1500)
  }

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value
    if (isNaN(Number(value))) return

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)
    setOtpError('')

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace') {
      const newOtp = [...otp]

      if (!otp[index] && index > 0) {
        newOtp[index - 1] = ''
        setOtp(newOtp)
        otpInputsRef.current[index - 1]?.focus()
      } else {
        newOtp[index] = ''
        setOtp(newOtp)
      }
      setOtpError('')
    }
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const pastedData = event.clipboardData.getData('text').trim()
    if (!/^\d+$/.test(pastedData)) return

    const pastedDigits = pastedData.slice(0, 6).split('')
    const newOtp = [...otp]

    pastedDigits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit
      }
    })

    setOtp(newOtp)
    setOtpError('')

    const focusIndex = Math.min(pastedDigits.length, 5)
    if (otpInputsRef.current[focusIndex]) {
      otpInputsRef.current[focusIndex]?.focus()
    }
  }

  const handleVerifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const otpCode = otp.join('')

    if (otpCode.length < 6) {
      setOtpError('Please enter the OTP code.')
      return
    }

    setOtpError('')
    setIsAuthLoading(true)

    setTimeout(() => {
      setIsAuthLoading(false)
      setStep('reset')
    }, 1500)
  }

  const handleResetPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let hasError = false

    if (strength.score < 4) {
      setNewPasswordError('Password does not meet requirements.')
      hasError = true
    } else {
      setNewPasswordError('')
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password.')
      hasError = true
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
      hasError = true
    } else {
      setConfirmPasswordError('')
    }

    if (hasError) return

    setIsAuthLoading(true)

    setTimeout(() => {
      setIsAuthLoading(false)
      setStep('login')
      setNewPassword('')
      setConfirmPassword('')
      setEmail('')
      setOtp(emptyOtp)
      triggerToast?.()
    }, 1500)
  }

  const handleBackToLogin = () => {
    setStep('login')
    setEmail('')
    setEmailError('')
    setNewPassword('')
    setConfirmPassword('')
    setNewPasswordError('')
    setConfirmPasswordError('')
  }

  const handleSignInSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsAuthLoading(true)

    setTimeout(() => {
      setIsAuthLoading(false)
      setStep('admin')
      onSignInSuccess()
      triggerToast?.('Logged in successfully.')
    }, 1000)
  }

  return {
    step,
    setStep,
    email,
    setEmail,
    emailError,
    setEmailError,
    isAuthLoading,
    otp,
    setOtp,
    otpError,
    setOtpError,
    otpInputsRef,
    countdown,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    newPasswordError,
    setNewPasswordError,
    confirmPasswordError,
    setConfirmPasswordError,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    strength,
    startTimer,
    validateEmail,
    handleSendCode,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerifyOtp,
    handleResetPassword,
    handleBackToLogin,
    handleSignInSubmit,
  }
}
