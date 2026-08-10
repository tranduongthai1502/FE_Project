import { useState, type ChangeEvent, type FormEvent } from 'react'
import { authApi } from '@/features/auth/infrastructure/authApi'
import { getAppErrorMessage } from '@/core/utils/errorManager'
import { shouldToastHttpError } from '@/core/utils/httpStatusManager'
import { getMissingPasswordRequirementLabels, getPasswordStrength } from '@/core/utils/passwordStrength'
import { authErrorMessages } from './authErrorMessages'
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from './validation'

type UseSignupFormOptions = {
  onGoToSignin: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

export function useSignupForm({ onGoToSignin, triggerToast }: UseSignupFormOptions) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fullNameError, setFullNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const passwordStrength = getPasswordStrength(password)
  const visibleStrengthScore = password ? passwordStrength.score : 0

  const handleInput =
    (setter: (value: string) => void, clearError?: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value
      setter(nextValue)
      clearError?.(nextValue)
    }

  const updateFullName = handleInput(setFullName, (value) => {
    if (fullNameError) setFullNameError(validateFullName(value))
  })

  const updateEmail = handleInput(setEmail, (value) => {
    if (emailError) setEmailError(validateEmail(value))
  })

  const updatePhone = handleInput(setPhone, (value) => {
    if (phoneError) setPhoneError(validatePhone(value))
  })

  const updatePassword = handleInput(setPassword, (value) => {
    if (passwordError) {
      setPasswordError(getMissingPasswordRequirementLabels(value).length > 0
        ? validatePassword(value)
        : '')
    }
    if (confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, value))
    }
  })

  const updateConfirmPassword = handleInput(setConfirmPassword, (value) => {
    if (confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(value, password))
    }
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const nextFullNameError = validateFullName(fullName)
    const nextEmailError = validateEmail(email)
    const nextPhoneError = validatePhone(phone)
    const nextPasswordError = validatePassword(password)
    const nextConfirmPasswordError = validateConfirmPassword(confirmPassword, password)

    setFullNameError(nextFullNameError)
    setEmailError(nextEmailError)
    setPhoneError(nextPhoneError)
    setPasswordError(nextPasswordError)
    setConfirmPasswordError(nextConfirmPasswordError)

    if (
      nextFullNameError ||
      nextEmailError ||
      nextPhoneError ||
      nextPasswordError ||
      nextConfirmPasswordError
    ) {
      return
    }

    setIsLoading(true)
    try {
      const response: any = await authApi.register({ fullName, email, phone, password })
      if (response && response.success) {
        triggerToast?.(authErrorMessages.registerSuccess, 'success')
        onGoToSignin()
      } else {
        const message = getAppErrorMessage(response, authErrorMessages.systemError)
        if (shouldToastHttpError(response)) {
          triggerToast?.(message, 'error')
        } else {
          setEmailError(message)
        }
      }
    } catch (error: any) {
      const message = getAppErrorMessage(error, authErrorMessages.systemError)
      if (shouldToastHttpError(error)) {
        triggerToast?.(message, 'error')
      } else {
        setEmailError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    confirmPassword,
    confirmPasswordError,
    email,
    emailError,
    fullName,
    fullNameError,
    handleSubmit,
    isLoading,
    password,
    passwordError,
    passwordStrength,
    phone,
    phoneError,
    showConfirmPassword,
    showPassword,
    toggleConfirmPasswordVisibility: () => setShowConfirmPassword((value) => !value),
    togglePasswordVisibility: () => setShowPassword((value) => !value),
    updateConfirmPassword,
    updateEmail,
    updateFullName,
    updatePassword,
    updatePhone,
    visibleStrengthScore,
  }
}
