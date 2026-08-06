import { useState, type FormEvent } from 'react'
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
    const nextFieldErrors: CreatePlanFieldErrors = {}
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

    const planNameError = validateRequiredPlanName(planName, hasDuplicatePlanName(existingPlans, planName))
    if (planNameError) nextFieldErrors.planName = planNameError

    const descriptionError = validateRequiredShortDescription(description)
    if (descriptionError) nextFieldErrors.description = descriptionError

    const monthlyPriceError = validateRequiredPrice(monthlyPrice)
    if (monthlyPriceError) nextFieldErrors.monthlyPrice = monthlyPriceError

    const staffLimitError = validatePositiveNumberOrUnlimited(maxStaffAccount, isStaffUnlimited)
    if (staffLimitError) nextFieldErrors.maxStaffAccount = staffLimitError

    const jobLimitError = validatePositiveNumberOrUnlimited(maxActiveJobPosting, isJobsUnlimited)
    if (jobLimitError) nextFieldErrors.maxActiveJobPosting = jobLimitError

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
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
    setPlanName,
    description,
    setDescription,
    billingCycle,
    setBillingCycle,
    monthlyPrice,
    setMonthlyPrice,
    maxStaffAccount,
    setMaxStaffAccount,
    maxActiveJobPosting,
    setMaxActiveJobPosting,
    features,
    isStaffUnlimited,
    setIsStaffUnlimited,
    isJobsUnlimited,
    setIsJobsUnlimited,
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
