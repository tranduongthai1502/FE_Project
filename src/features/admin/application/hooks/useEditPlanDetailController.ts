import { useState, type FormEvent } from 'react'
import { useUpdatePlan } from '../queryHooks/useAdminQueries'
import type { SubscriptionPlan, UpdatePlanPayload } from '../../domain/adminApi.types'
import {
  getPlanFeatureState,
  getSubscriptionPlanFieldErrors,
  hasDuplicatePlanName,
  type CreatePlanFieldErrors,
} from '../../infrastructure/subscriptionPlansService'
import { getErrorMessage as getAdminErrorMessage } from '@/core/utils/errors/errorMessages'
import { formatCurrencyInput, parseCurrencyInput } from '@/core/utils/currencyFormat'
import {
  validatePositiveNumberOrUnlimited,
  validateRequiredPlanName,
  validateRequiredPrice,
  validateRequiredShortDescription,
  validationErrorMessages,
} from '@/core/api/axiosErrorHandler'
import { getPlanMaxLengthMessage, planDescriptionMaxLength, planNumberFieldMaxLength } from './useCreatePlanController'

function isPlanMaxLengthError(message?: string) {
  return Boolean(message?.includes('characters or less.'))
}

export function useEditPlanDetailController({
  plan,
  onBack,
  onHome,
  onPlans,
  onSaved,
  existingPlans,
  assignedTenantCount,
  activeAssignedTenantCount,
  triggerToast,
}: {
  plan: SubscriptionPlan
  onBack: () => void
  onHome: () => void
  onPlans: () => void
  onSaved: () => void
  existingPlans: SubscriptionPlan[]
  assignedTenantCount: number
  activeAssignedTenantCount: number
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const updatePlanMutation = useUpdatePlan()

  const [planName, setPlanName] = useState(plan.name)
  const [description, setDescription] = useState(plan.description)
  const [billingCycle, setBillingCycle] = useState(plan.billingCycle || 'MONTHLY')
  const [monthlyPrice, setMonthlyPrice] = useState(formatCurrencyInput(plan.monthlyPrice.toFixed(2)))
  const [maxStaffAccount, setMaxStaffAccount] = useState(plan.maxStaffAccount == null ? '' : String(plan.maxStaffAccount))
  const [maxActiveJobPosting, setMaxActiveJobPosting] = useState(plan.maxActiveJobPosting == null ? '' : String(plan.maxActiveJobPosting))
  const [features, setFeatures] = useState(() => getPlanFeatureState(plan))
  const [isStaffUnlimited, setIsStaffUnlimited] = useState(plan.staffAccountUnlimited)
  const [isJobsUnlimited, setIsJobsUnlimited] = useState(plan.activeJobPostingUnlimited)
  const [isActive, setIsActive] = useState(plan.status.toLowerCase() === 'active')
  const [planError, setPlanError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<CreatePlanFieldErrors>({})
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)
  const [isRetireConfirmOpen, setIsRetireConfirmOpen] = useState(false)

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

  const handleSavePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlanError('')
    const nextFieldErrors: CreatePlanFieldErrors = {}
    const generalConfigurationIsEmpty = !planName.trim() &&
      !description.trim() &&
      !monthlyPrice.trim()

    if (generalConfigurationIsEmpty) {
      setFieldErrors({
        planName: validationErrorMessages.planNameRequired,
        description: validationErrorMessages.shortDescriptionRequired,
      })
      return
    }

    const planNameError = validateRequiredPlanName(planName, hasDuplicatePlanName(existingPlans, planName, plan.id))
    if (planNameError) nextFieldErrors.planName = planNameError
    else if (isPlanMaxLengthError(fieldErrors.planName)) nextFieldErrors.planName = fieldErrors.planName

    const descriptionError = validateRequiredShortDescription(description)
    if (descriptionError) nextFieldErrors.description = descriptionError
    else if (isPlanMaxLengthError(fieldErrors.description)) nextFieldErrors.description = fieldErrors.description

    const monthlyPriceError = validateRequiredPrice(monthlyPrice)
    if (monthlyPriceError) nextFieldErrors.monthlyPrice = monthlyPriceError
    else if (isPlanMaxLengthError(fieldErrors.monthlyPrice)) nextFieldErrors.monthlyPrice = fieldErrors.monthlyPrice

    const staffLimitError = validatePositiveNumberOrUnlimited(maxStaffAccount, isStaffUnlimited)
    if (staffLimitError) nextFieldErrors.maxStaffAccount = staffLimitError
    else if (isPlanMaxLengthError(fieldErrors.maxStaffAccount)) nextFieldErrors.maxStaffAccount = fieldErrors.maxStaffAccount

    const jobLimitError = validatePositiveNumberOrUnlimited(maxActiveJobPosting, isJobsUnlimited)
    if (jobLimitError) nextFieldErrors.maxActiveJobPosting = jobLimitError
    else if (isPlanMaxLengthError(fieldErrors.maxActiveJobPosting)) nextFieldErrors.maxActiveJobPosting = fieldErrors.maxActiveJobPosting

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    if (!features.some((feature) => feature.enabled)) {
      const message = 'Please enable at least one feature for this plan.'
      setPlanError(message)
      return
    }

    if (isActive && assignedTenantCount > 0) {
      setIsSaveConfirmOpen(true)
      return
    }

    await confirmSavePlan()
  }

  const confirmSavePlan = async () => {
    const payload: UpdatePlanPayload = {
      "name": planName,
      "description": description,
      "billingCycle": billingCycle,
      "price": parseCurrencyInput(monthlyPrice),
      "maxStaffAccount": isStaffUnlimited ? null : Number(maxStaffAccount || 0),
      "staffAccountUnlimited": isStaffUnlimited,
      "maxActiveJobPosting": isJobsUnlimited ? null : Number(maxActiveJobPosting || 0),
      "activeJobPostingUnlimited": isJobsUnlimited,
      "status": isActive ? 'ACTIVE' : 'INACTIVE',
      "features": features.map((feature) => ({
        "key": feature.code,
        "status": feature.enabled ? 'ACTIVE' : 'INACTIVE',
      })),
    }

    setIsSavingPlan(true)
    try {
      await updatePlanMutation.mutateAsync({ id: plan.id, payload })
      setIsSaveConfirmOpen(false)
      triggerToast?.('Subscription plan updated successfully.', 'success')
      onSaved()
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Failed to update subscription plan.')
      const nextFieldErrors = getSubscriptionPlanFieldErrors(error, message)
      setIsSaveConfirmOpen(false)
      setFieldErrors(nextFieldErrors)
      setPlanError(Object.keys(nextFieldErrors).length > 0 ? '' : message)
    } finally {
      setIsSavingPlan(false)
    }
  }

  const initialFeatures = getPlanFeatureState(plan)
  const hasDraftChanges = Boolean(
    planName !== plan.name ||
    description !== plan.description ||
    billingCycle !== (plan.billingCycle || 'MONTHLY') ||
    parseCurrencyInput(monthlyPrice) !== plan.monthlyPrice ||
    maxStaffAccount !== (plan.maxStaffAccount == null ? '' : String(plan.maxStaffAccount)) ||
    maxActiveJobPosting !== (plan.maxActiveJobPosting == null ? '' : String(plan.maxActiveJobPosting)) ||
    isStaffUnlimited !== plan.staffAccountUnlimited ||
    isJobsUnlimited !== plan.activeJobPostingUnlimited ||
    isActive !== (plan.status.toLowerCase() === 'active') ||
    features.some((feature, index) => feature.enabled !== initialFeatures[index]?.enabled),
  )

  const handleCancelEditPlan = () => {
    if (isSavingPlan) return
    if (hasDraftChanges) {
      setIsCancelConfirmOpen(true)
      return
    }

    onBack()
  }

  const handleActiveStatusToggle = () => {
    if (!isActive) {
      setIsActive(true)
      return
    }

    if (activeAssignedTenantCount > 0) {
      setIsRetireConfirmOpen(true)
      return
    }

    setIsActive(false)
  }

  const activeTenantLabel = `${activeAssignedTenantCount} active tenant${activeAssignedTenantCount === 1 ? '' : 's'}`

  return {
    plan,
    onBack,
    onHome,
    onPlans,
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
    isActive,
    setIsActive,
    planError,
    fieldErrors,
    isSavingPlan,
    isCancelConfirmOpen,
    setIsCancelConfirmOpen,
    isSaveConfirmOpen,
    setIsSaveConfirmOpen,
    isRetireConfirmOpen,
    setIsRetireConfirmOpen,
    activeTenantLabel,
    updateLimitedPlanField,
    toggleFeature,
    handleSavePlan,
    confirmSavePlan,
    handleCancelEditPlan,
    handleActiveStatusToggle,
  }
}

export type EditPlanDetailController = ReturnType<typeof useEditPlanDetailController>
