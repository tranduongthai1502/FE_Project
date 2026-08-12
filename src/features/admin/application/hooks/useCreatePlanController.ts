import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePlan } from '../queryHooks/useAdminQueries'
import type { CreatePlanPayload } from '../../domain/adminApi.types'
import {
  hasFeatureChanges,
  getSubscriptionPlanFieldErrors,
  type CreatePlanFieldErrors,
} from '../../infrastructure/subscriptionPlansService'
import { planFeatureDefaults } from '../../domain/subscriptionPlanFeatures'
import { getErrorMessage as getAdminErrorMessage } from '@/core/utils/errors/errorMessages'
import { parseCurrencyInput } from '@/core/utils/currencyFormat'
import {
  getBackendErrorMessage,
  getErrorCode,
  validatePositiveNumberOrUnlimited,
  validateRequiredPlanName,
  validateRequiredPrice,
  validateRequiredShortDescription,
} from '@/core/api/axiosErrorHandler'
import { buildMaxLengthMessage } from '@/core/utils/errors/fieldErrorUtils'

export const planNumberFieldMaxLength = 50
export const planDescriptionMaxLength = 500
export const billingCycleOptions = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'SIX_MONTHLY', label: '6 Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
]

export function getPlanMaxLengthMessage(label: string, maxLength: number) {
  return buildMaxLengthMessage(label, maxLength)
}

type BooleanStateAction = boolean | ((current: boolean) => boolean)

function isMaxPlanReachedError(error: unknown) {
  return [getErrorCode(error), getBackendErrorMessage(error)]
    .some((value) => String(value || '').trim().toLowerCase() === 'max_plan_reached')
}

export function useCreatePlanController({
  onBack,
  onHome,
  onCreated,
  triggerToast,
}: {
  onBack: () => void
  onHome: () => void
  onCreated: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const createPlanMutation = useCreatePlan()
  const createPlanForm = useForm({
    resolver: zodResolver(z.object({
      planName: z.string().superRefine((value, context) => {
        const message = validateRequiredPlanName(value)
        if (message) context.addIssue({ code: 'custom', message })
      }),
      description: z.string().superRefine((value, context) => {
        const message = validateRequiredShortDescription(value)
        if (message) context.addIssue({ code: 'custom', message })
      }),
      monthlyPrice: z.string().superRefine((value, context) => {
        const message = validateRequiredPrice(value)
        if (message) context.addIssue({ code: 'custom', message })
      }),
      maxStaffAccount: z.string(),
      maxActiveJobPosting: z.string(),
      isStaffUnlimited: z.boolean(),
      isJobsUnlimited: z.boolean(),
    }).superRefine((values, context) => {
      const staffLimitError = validatePositiveNumberOrUnlimited(values.maxStaffAccount, values.isStaffUnlimited)
      if (staffLimitError) context.addIssue({ code: 'custom', path: ['maxStaffAccount'], message: staffLimitError })
      const jobLimitError = validatePositiveNumberOrUnlimited(values.maxActiveJobPosting, values.isJobsUnlimited)
      if (jobLimitError) context.addIssue({ code: 'custom', path: ['maxActiveJobPosting'], message: jobLimitError })
    })),
    defaultValues: {
      planName: '',
      description: '',
      monthlyPrice: '',
      maxStaffAccount: '',
      maxActiveJobPosting: '',
      isStaffUnlimited: false,
      isJobsUnlimited: false,
    },
    mode: 'onBlur',
  })

  const [planName, setPlanName] = useState('')
  const [description, setDescription] = useState('')
  const [billingCycle, setBillingCycle] = useState('MONTHLY')
  const [monthlyPrice, setMonthlyPrice] = useState('')
  const [maxStaffAccount, setMaxStaffAccount] = useState('')
  const [maxActiveJobPosting, setMaxActiveJobPosting] = useState('')
  const [features, setFeatures] = useState(planFeatureDefaults)
  const [isStaffUnlimited, setIsStaffUnlimited] = useState(false)
  const [isJobsUnlimited, setIsJobsUnlimited] = useState(false)
  const [planError, setPlanError] = useState('')
  const [apiFieldErrors, setApiFieldErrors] = useState<CreatePlanFieldErrors>({})
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const fieldErrors: CreatePlanFieldErrors = {
    planName: createPlanForm.formState.errors.planName?.message,
    description: createPlanForm.formState.errors.description?.message,
    monthlyPrice: createPlanForm.formState.errors.monthlyPrice?.message,
    maxStaffAccount: createPlanForm.formState.errors.maxStaffAccount?.message,
    maxActiveJobPosting: createPlanForm.formState.errors.maxActiveJobPosting?.message,
    ...apiFieldErrors,
  }

  const syncPlanFormField = (field: 'planName' | 'description' | 'monthlyPrice' | 'maxStaffAccount' | 'maxActiveJobPosting', value: string) => {
    createPlanForm.setValue(field, value, { shouldDirty: true })
    createPlanForm.clearErrors(field)
    setApiFieldErrors((current) => current[field] ? { ...current, [field]: '' } : current)
  }

  const validatePlanField = (field: 'planName' | 'description' | 'monthlyPrice' | 'maxStaffAccount' | 'maxActiveJobPosting') => {
    void createPlanForm.trigger(field)
  }

  const updatePlanName = (value: string) => {
    setPlanName(value)
    syncPlanFormField('planName', value)
  }

  const updateDescription = (value: string) => {
    setDescription(value)
    syncPlanFormField('description', value)
  }

  const updateMonthlyPrice = (value: string) => {
    setMonthlyPrice(value)
    syncPlanFormField('monthlyPrice', value)
  }

  const updateMaxStaffAccount = (value: string) => {
    setMaxStaffAccount(value)
    syncPlanFormField('maxStaffAccount', value)
  }

  const updateMaxActiveJobPosting = (value: string) => {
    setMaxActiveJobPosting(value)
    syncPlanFormField('maxActiveJobPosting', value)
  }

  const updateStaffUnlimited = (value: BooleanStateAction) => {
    const nextValue = typeof value === 'function' ? value(isStaffUnlimited) : value
    setIsStaffUnlimited(nextValue)
    createPlanForm.setValue('isStaffUnlimited', nextValue, { shouldDirty: true })
    createPlanForm.clearErrors('maxStaffAccount')
    setApiFieldErrors((current) => current.maxStaffAccount ? { ...current, maxStaffAccount: '' } : current)
  }

  const updateJobsUnlimited = (value: BooleanStateAction) => {
    const nextValue = typeof value === 'function' ? value(isJobsUnlimited) : value
    setIsJobsUnlimited(nextValue)
    createPlanForm.setValue('isJobsUnlimited', nextValue, { shouldDirty: true })
    createPlanForm.clearErrors('maxActiveJobPosting')
    setApiFieldErrors((current) => current.maxActiveJobPosting ? { ...current, maxActiveJobPosting: '' } : current)
  }

  const updateLimitedPlanField = (
    field: keyof CreatePlanFieldErrors,
    value: string,
    maxLength: number,
    label: string,
    setter: (nextValue: string) => void,
    formatter?: (nextValue: string) => string,
  ) => {
    const isOverMaxLength = value.length > maxLength
    const nextValue = isOverMaxLength ? value.slice(0, maxLength) : value
    setter(formatter ? formatter(nextValue) : nextValue)
    syncPlanFormField(field, formatter ? formatter(nextValue) : nextValue)
    if (isOverMaxLength) {
      createPlanForm.setError(field, {
        type: 'maxLength',
        message: getPlanMaxLengthMessage(label, maxLength),
      })
    }
  }

  const toggleFeature = (key: string) => {
    setFeatures((current) => current.map((feature) => (
      feature.key === key ? { ...feature, enabled: !feature.enabled } : feature
    )))
    if (planError === 'Please enable at least one feature for this plan.') {
      setPlanError('')
    }
  }

  const handleCreatePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlanError('')
    setApiFieldErrors({})

    const isValid = await createPlanForm.trigger()
    if (!isValid) {
      return
    }

    await confirmCreatePlan()
  }

  const confirmCreatePlan = async () => {
    const payload: CreatePlanPayload = {
      "name": planName,
      "description": description,
      "billingCycle": billingCycle,
      "price": parseCurrencyInput(monthlyPrice),
      "maxStaffAccount": isStaffUnlimited ? null : Number(maxStaffAccount || 0),
      "staffAccountUnlimited": isStaffUnlimited,
      "maxActiveJobPosting": isJobsUnlimited ? null : Number(maxActiveJobPosting || 0),
      "activeJobPostingUnlimited": isJobsUnlimited,
      "status": 'ACTIVE',
      "features": features.map((feature) => ({
        "key": feature.code,
        "status": feature.enabled ? 'ACTIVE' : 'INACTIVE',
      })),
    }

    setIsSavingPlan(true)
    try {
      await createPlanMutation.mutateAsync(payload)
      triggerToast?.('Subscription plan created successfully', 'success')
      onCreated()
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Failed to create subscription plan.')
      const nextFieldErrors = getSubscriptionPlanFieldErrors(error, message)
      setApiFieldErrors(nextFieldErrors)
      setPlanError(Object.keys(nextFieldErrors).length > 0 ? '' : message)
      if (isMaxPlanReachedError(error)) {
        triggerToast?.(message, 'error')
      }
    } finally {
      setIsSavingPlan(false)
    }
  }

  const hasDraftChanges = Boolean(
    planName.trim() ||
    description.trim() ||
    billingCycle !== 'MONTHLY' ||
    monthlyPrice.trim() ||
    maxStaffAccount.trim() ||
    maxActiveJobPosting.trim() ||
    isStaffUnlimited ||
    isJobsUnlimited ||
    hasFeatureChanges(features),
  )

  const handleCancelCreatePlan = () => {
    if (isSavingPlan) return
    if (hasDraftChanges) {
      setIsCancelConfirmOpen(true)
      return
    }

    onBack()
  }

  return {
    onBack,
    onHome,
    planName,
    setPlanName: updatePlanName,
    description,
    setDescription: updateDescription,
    billingCycle,
    setBillingCycle,
    monthlyPrice,
    setMonthlyPrice: updateMonthlyPrice,
    maxStaffAccount,
    setMaxStaffAccount: updateMaxStaffAccount,
    maxActiveJobPosting,
    setMaxActiveJobPosting: updateMaxActiveJobPosting,
    features,
    isStaffUnlimited,
    setIsStaffUnlimited: updateStaffUnlimited,
    isJobsUnlimited,
    setIsJobsUnlimited: updateJobsUnlimited,
    planError,
    fieldErrors,
    setFieldErrors: setApiFieldErrors,
    isSavingPlan,
    isCancelConfirmOpen,
    setIsCancelConfirmOpen,
    updateLimitedPlanField,
    validatePlanField,
    toggleFeature,
    handleCreatePlan,
    handleCancelCreatePlan,
  }
}

export type CreatePlanController = ReturnType<typeof useCreatePlanController>
