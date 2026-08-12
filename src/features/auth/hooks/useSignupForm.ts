import { useState, type ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { authApi } from '@/features/auth/api/authApi'
import { getAppErrorMessage } from '@/core/utils/errorManager'
import { shouldToastHttpError } from '@/core/utils/httpStatusManager'
import { getPasswordStrength } from '@/core/utils/passwordStrength'
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

type SignupFormValues = {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const signupSchema = z
  .object({
    fullName: z.string().superRefine((value, context) => {
      const message = validateFullName(value)
      if (message) context.addIssue({ code: 'custom', message })
    }),
    email: z.string().superRefine((value, context) => {
      const message = validateEmail(value)
      if (message) context.addIssue({ code: 'custom', message })
    }),
    phone: z.string().superRefine((value, context) => {
      const message = validatePhone(value)
      if (message) context.addIssue({ code: 'custom', message })
    }),
    password: z.string().superRefine((value, context) => {
      const message = validatePassword(value)
      if (message) context.addIssue({ code: 'custom', message })
    }),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const message = validateConfirmPassword(values.confirmPassword, values.password)
    if (message) {
      context.addIssue({ code: 'custom', path: ['confirmPassword'], message })
    }
  })

export function useSignupForm({ onGoToSignin, triggerToast }: UseSignupFormOptions) {
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const fullName = signupForm.watch('fullName')
  const email = signupForm.watch('email')
  const phone = signupForm.watch('phone')
  const password = signupForm.watch('password')
  const confirmPassword = signupForm.watch('confirmPassword')
  const fullNameError = signupForm.formState.errors.fullName?.message || ''
  const emailError = signupForm.formState.errors.email?.message || ''
  const phoneError = signupForm.formState.errors.phone?.message || ''
  const passwordError = signupForm.formState.errors.password?.message || ''
  const confirmPasswordError = signupForm.formState.errors.confirmPassword?.message || ''
  const passwordStrength = getPasswordStrength(password)
  const visibleStrengthScore = password ? passwordStrength.score : 0

  const handleInput =
    (field: keyof SignupFormValues, clearDependentErrors?: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value
      signupForm.setValue(field, nextValue, { shouldDirty: true })
      signupForm.clearErrors(field)
      clearDependentErrors?.(nextValue)
    }

  const updateFullName = handleInput('fullName')
  const updateEmail = handleInput('email')
  const updatePhone = handleInput('phone')

  const updatePassword = handleInput('password', () => {
    if (confirmPasswordError) {
      signupForm.clearErrors('confirmPassword')
    }
  })

  const updateConfirmPassword = handleInput('confirmPassword')

  const handleSubmit = signupForm.handleSubmit(async (values) => {
    try {
      const response: any = await authApi.register({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      })
      if (response && response.success) {
        triggerToast?.(authErrorMessages.registerSuccess, 'success')
        onGoToSignin()
      } else {
        const message = getAppErrorMessage(response, authErrorMessages.systemError)
        if (shouldToastHttpError(response)) {
          triggerToast?.(message, 'error')
        } else {
          signupForm.setError('email', { type: 'server', message })
        }
      }
    } catch (error: any) {
      const message = getAppErrorMessage(error, authErrorMessages.systemError)
      if (shouldToastHttpError(error)) {
        triggerToast?.(message, 'error')
      } else {
        signupForm.setError('email', { type: 'server', message })
      }
    }
  })

  return {
    confirmPassword,
    confirmPasswordError,
    email,
    emailError,
    fullName,
    fullNameError,
    handleSubmit,
    isLoading: signupForm.formState.isSubmitting,
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
