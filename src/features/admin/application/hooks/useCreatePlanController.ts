import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePlan } from '../queryHooks/useAdminQueries'
import type { CreatePlanPayload, SubscriptionPlan } from '../../domain/adminApi.types'
import {
  hasDuplicatePlanName,
  hasFeatureChanges,
  getSubscriptionPlanFieldErrors,
  type CreatePlanFieldErrors,
} from '../../infrastructure/subscriptionPlansService'
import { planFeatureDefaults } from '../../domain/subscriptionPlanFeatures'
import { getErrorMessage as getAdminErrorMessage } from '@/core/utils/errors/errorMessages'
import { formatCurrencyInput, parseCurrencyInput } from '@/core/utils/currencyFormat'
import {
  FIELD_LENGTH_LIMITS,
  validatePositiveNumberOrUnlimited,
  validateRequiredPlanName,
  validateRequiredPrice,
  validateRequiredShortDescription,
  validationErrorMessages,
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

export function useCreatePlanController({
  onBack,
  onHome,
  onCreated,
  existingPlans,
  triggerToast,
}: {
  onBack: () => void
  onHome: () => void
  onCreated: () => void
  existingPlans: SubscriptionPlan[]
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const createPlanMutation = useCreatePlan()
  const createPlanForm = useForm({
    resolver: zodResolver(z.object({
      planName: z.string().superRefine((value, context) => {
        const message = validateRequiredPlanName(value, hasDuplicatePlanName(existingPlans, value))
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
    mode: 'onSubmit',
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
  const [fieldErrors, setFieldErrors] = useState<CreatePlanFieldErrors>({})
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  const syncPlanFormField = (field: 'planName' | 'description' | 'monthlyPrice' | 'maxStaffAccount' | 'maxActiveJobPosting', value: string) => {
    createPlanForm.setValue(field, value, { shouldDirty: true })
    createPlanForm.clearErrors(field)
    setFieldErrors((current) => current[field] ? { ...current, [field]: '' } : current)
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

  const updateStaffUnlimited = (value: boolean) => {
    setIsStaffUnlimited(value)
    createPlanForm.setValue('isStaffUnlimited', value, { shouldDirty: true })
    createPlanForm.clearErrors('maxStaffAccount')
    setFieldErrors((current) => current.maxStaffAccount ? { ...current, maxStaffAccount: '' } : current)
  }

  const updateJobsUnlimited = (value: boolean) => {
    setIsJobsUnlimited(value)
    createPlanForm.setValue('isJobsUnlimited', value, { shouldDirty: true })
    createPlanForm.clearErrors('maxActiveJobPosting')
    setFieldErrors((current) => current.maxActiveJobPosting ? { ...current, maxActiveJobPosting: '' } : current)
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
    setFieldErrors((current) => {
      if (isOverMaxLength) {
        return {
          ...current,
          [field]: getPlanMaxLengthMessage(label, maxLength),
        }
      }
      if (!current[field]) return current
      return { ...current, [field]: '' }
    })
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
    const planDetailsAreEmpty = !planName.trim() &&
      !description.trim() &&
      !monthlyPrice.trim() &&
      !maxStaffAccount.trim() &&
      !maxActiveJobPosting.trim() &&
      !isStaffUnlimited &&
      !isJobsUnlimited

    if (planDetailsAreEmpty) {
      setFieldErrors({
        planName: validationErrorMessages.planNameRequired,
        description: validationErrorMessages.shortDescriptionRequired,
        monthlyPrice: validationErrorMessages.validPriceRequired,
        maxStaffAccount: validationErrorMessages.positiveNumberOrUnlimitedRequired,
        maxActiveJobPosting: validationErrorMessages.positiveNumberOrUnlimitedRequired,
      })
      return
    }

    const isValid = await createPlanForm.trigger()
    const resolverErrors: CreatePlanFieldErrors = {
      planName: createPlanForm.getFieldState('planName').error?.message,
      description: createPlanForm.getFieldState('description').error?.message,
      monthlyPrice: createPlanForm.getFieldState('monthlyPrice').error?.message,
      maxStaffAccount: createPlanForm.getFieldState('maxStaffAccount').error?.message,
      maxActiveJobPosting: createPlanForm.getFieldState('maxActiveJobPosting').error?.message,
    }
    setFieldErrors(resolverErrors)
    if (!isValid) {
      return
    }

    if (!features.some((feature) => feature.enabled)) {
      const message = 'Please enable at least one feature for this plan.'
      setPlanError(message)
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
      setFieldErrors(nextFieldErrors)
      setPlanError(Object.keys(nextFieldErrors).length > 0 ? '' : message)
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
    setFieldErrors,
    isSavingPlan,
    isCancelConfirmOpen,
    setIsCancelConfirmOpen,
    updateLimitedPlanField,
    toggleFeature,
    handleCreatePlan,
    handleCancelCreatePlan,
  }
}

export type CreatePlanController = ReturnType<typeof useCreatePlanController>
