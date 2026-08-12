import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
  const editPlanForm = useForm({
    resolver: zodResolver(z.object({
      planName: z.string().superRefine((value, context) => {
        const message = validateRequiredPlanName(value, hasDuplicatePlanName(existingPlans, value, plan.id))
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
      planName: plan.name,
      description: plan.description,
      monthlyPrice: formatCurrencyInput(plan.monthlyPrice.toFixed(2)),
      maxStaffAccount: plan.maxStaffAccount == null ? '' : String(plan.maxStaffAccount),
      maxActiveJobPosting: plan.maxActiveJobPosting == null ? '' : String(plan.maxActiveJobPosting),
      isStaffUnlimited: plan.staffAccountUnlimited,
      isJobsUnlimited: plan.activeJobPostingUnlimited,
    },
    mode: 'onSubmit',
  })

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

  const syncPlanFormField = (field: 'planName' | 'description' | 'monthlyPrice' | 'maxStaffAccount' | 'maxActiveJobPosting', value: string) => {
    editPlanForm.setValue(field, value, { shouldDirty: true })
    editPlanForm.clearErrors(field)
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
    editPlanForm.setValue('isStaffUnlimited', value, { shouldDirty: true })
    editPlanForm.clearErrors('maxStaffAccount')
    setFieldErrors((current) => current.maxStaffAccount ? { ...current, maxStaffAccount: '' } : current)
  }

  const updateJobsUnlimited = (value: boolean) => {
    setIsJobsUnlimited(value)
    editPlanForm.setValue('isJobsUnlimited', value, { shouldDirty: true })
    editPlanForm.clearErrors('maxActiveJobPosting')
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

  const handleSavePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlanError('')
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

    const isValid = await editPlanForm.trigger(['planName', 'description', 'monthlyPrice'])
    const nextFieldErrors: CreatePlanFieldErrors = {
      planName: editPlanForm.getFieldState('planName').error?.message,
      description: editPlanForm.getFieldState('description').error?.message,
      monthlyPrice: editPlanForm.getFieldState('monthlyPrice').error?.message,
      maxStaffAccount: validatePositiveNumberOrUnlimited(maxStaffAccount, isStaffUnlimited) || undefined,
      maxActiveJobPosting: validatePositiveNumberOrUnlimited(maxActiveJobPosting, isJobsUnlimited) || undefined,
    }
    if (!nextFieldErrors.planName && isPlanMaxLengthError(fieldErrors.planName)) nextFieldErrors.planName = fieldErrors.planName
    if (!nextFieldErrors.description && isPlanMaxLengthError(fieldErrors.description)) nextFieldErrors.description = fieldErrors.description
    if (!nextFieldErrors.monthlyPrice && isPlanMaxLengthError(fieldErrors.monthlyPrice)) nextFieldErrors.monthlyPrice = fieldErrors.monthlyPrice
    if (!nextFieldErrors.maxStaffAccount && isPlanMaxLengthError(fieldErrors.maxStaffAccount)) nextFieldErrors.maxStaffAccount = fieldErrors.maxStaffAccount
    if (!nextFieldErrors.maxActiveJobPosting && isPlanMaxLengthError(fieldErrors.maxActiveJobPosting)) nextFieldErrors.maxActiveJobPosting = fieldErrors.maxActiveJobPosting

    setFieldErrors(nextFieldErrors)
    if (!isValid || Object.values(nextFieldErrors).some(Boolean)) {
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
