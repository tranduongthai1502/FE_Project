import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { hrApi } from '../../infrastructure/hrApi'
import type { GenerateJobPostingAiResponse, JobCriteriaResponse, JobPosting, JobPostingPayload } from '../../domain/hrApi.types'
import type {
  CriteriaFieldErrors,
  EditableCriterion,
  JobDetailTab,
  JobFieldErrors,
} from '../../infrastructure/hrJobLogic'
import {
  createEmptyCriterionRow,
  criteriaCategories,
  criteriaDescriptionLimit,
  criteriaLengthExceededMessage,
  criteriaNameLimit,
  emptyJobForm,
  getAiJobValidationErrors,
  getCriteriaSaveError,
  getJobFieldErrorsFromApiError,
  getJobValidationErrors,
  hasDuplicateJobTitle,
  isClosedJobStatus,
  isJobPostingLimitReachedError,
  isJobTitleAlreadyExistsError,
  jobPostingLimitReachedMessage,
  jobTitleMaxLength,
  mapCriteriaResponseToRow,
  maxCriteriaCount,
  normalizeWeightInput,
} from '../../infrastructure/hrJobLogic'
import { getErrorMessage as getAdminErrorMessage } from '@/core/utils/errors/errorMessages'
import { formatCurrencyInput, parseCurrencyInput } from '@/core/utils/currencyFormat'
import { FIELD_LENGTH_LIMITS, getBackendErrorMessage } from '@/core/api/axiosErrorHandler'
import {
  formatDeadlineDisplay,
  getCalendarMonth,
  getHrJobDetailTabFromSearch,
  getHrJobViewFromPath,
  getLocalDateKey,
  parseDeadlineInput,
  withDefaultApplicationDeadline,
} from '../helpers/hrDashboardHelpers'

export function useHrJobCriteriaController({
  selectedJob,
  jobView,
  jobDetailTab,
  jobs,
  isActionLocked,
  onReturnToList,
  triggerToast,
}: {
  selectedJob: JobPosting | null
  jobView: 'list' | 'detail' | 'create' | 'edit' | 'ai'
  jobDetailTab: JobDetailTab
  jobs: JobPosting[]
  isActionLocked: boolean
  onReturnToList: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  // --- Evaluation Criteria State ---
  const [jobCriteria, setJobCriteria] = useState<JobCriteriaResponse[]>([])
  const [isEditingCriteria, setIsEditingCriteria] = useState(false)
  const [criteriaForms, setCriteriaForms] = useState<EditableCriterion[]>([])
  const [criteriaFieldErrors, setCriteriaFieldErrors] = useState<Record<string, CriteriaFieldErrors>>({})
  const [deletedCriteriaIds, setDeletedCriteriaIds] = useState<string[]>([])
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false)
  const [isSavingCriteria, setIsSavingCriteria] = useState(false)
  const [pendingCriteriaCancelAction, setPendingCriteriaCancelAction] = useState<(() => void) | null>(null)

  // --- Job Form State ---
  const jobFormMethods = useForm<JobPostingPayload>({
    resolver: zodResolver(z.object({
      title: z.string(),
      department: z.string(),
      level: z.string(),
      employmentType: z.string(),
      locationType: z.string(),
      location: z.string(),
      applicationDeadline: z.string(),
      description: z.string(),
      requirements: z.string(),
      benefits: z.string(),
      salaryMin: z.number(),
      salaryMax: z.number(),
      status: z.string(),
      allowDuplicateTitle: z.boolean().optional(),
    })),
    defaultValues: emptyJobForm,
    mode: 'onSubmit',
  })
  const jobForm = jobFormMethods.watch()
  const setJobForm = (nextValue: JobPostingPayload | ((current: JobPostingPayload) => JobPostingPayload)) => {
    const nextForm = typeof nextValue === 'function'
      ? nextValue(jobFormMethods.getValues())
      : nextValue
    jobFormMethods.reset(nextForm)
  }
  const [salaryInputValues, setSalaryInputValues] = useState({ salaryMin: '', salaryMax: '' })
  const [jobFieldErrors, setJobFieldErrors] = useState<JobFieldErrors>({})
  const [isSavingJob, setIsSavingJob] = useState(false)
  const [isDeadlineCalendarOpen, setIsDeadlineCalendarOpen] = useState(false)
  const [deadlineCalendarMonth, setDeadlineCalendarMonth] = useState(() => getCalendarMonth(emptyJobForm.applicationDeadline))
  const [deadlineInputValue, setDeadlineInputValue] = useState('')
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [pendingDuplicateTitlePayload, setPendingDuplicateTitlePayload] = useState<JobPostingPayload | null>(null)
  const [aiGeneratedJob, setAiGeneratedJob] = useState<GenerateJobPostingAiResponse | null>(null)
  const [isGeneratingAiJob, setIsGeneratingAiJob] = useState(false)
  const [aiGenerateError, setAiGenerateError] = useState('')

  const isJobFormDirty = (
    jobForm.title.trim() !== '' ||
    jobForm.department.trim() !== '' ||
    jobForm.level.trim() !== '' ||
    jobForm.employmentType.trim() !== '' ||
    jobForm.locationType !== emptyJobForm.locationType ||
    jobForm.location.trim() !== '' ||
    jobForm.applicationDeadline.trim() !== '' ||
    jobForm.description.trim() !== '' ||
    jobForm.requirements.trim() !== '' ||
    jobForm.benefits.trim() !== '' ||
    salaryInputValues.salaryMin.trim() !== '' ||
    salaryInputValues.salaryMax.trim() !== ''
  )

  // Load criteria on detail view tab criteria
  useEffect(() => {
    if (jobView !== 'detail' || jobDetailTab !== 'criteria' || !selectedJob?.id) return

    let isActive = true
    setIsLoadingCriteria(true)

    hrApi.getJobCriteriaByJobId(selectedJob.id)
      .then((items) => {
        if (!isActive) return
        const nextCriteria = (Array.isArray(items) ? items : [])
          .slice()
          .sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0))
        setJobCriteria(nextCriteria)
        setIsEditingCriteria(false)
        setCriteriaForms([])
        setCriteriaFieldErrors({})
        setDeletedCriteriaIds([])
      })
      .catch(() => {
        if (!isActive) return
        setJobCriteria([])
        setIsEditingCriteria(false)
        setCriteriaForms([])
        setCriteriaFieldErrors({})
        setDeletedCriteriaIds([])
      })
      .finally(() => {
        if (isActive) setIsLoadingCriteria(false)
      })

    return () => {
      isActive = false
    }
  }, [jobDetailTab, jobView, selectedJob?.id])

  // Reset/populate form when editing
  useEffect(() => {
    if (!selectedJob || jobView !== 'edit') return

    setJobFieldErrors({})
    setPendingDuplicateTitlePayload(null)
    setIsCancelConfirmOpen(false)
    setSalaryInputValues({
      salaryMin: selectedJob.salaryMin ? formatCurrencyInput(String(selectedJob.salaryMin)) : '',
      salaryMax: selectedJob.salaryMax ? formatCurrencyInput(String(selectedJob.salaryMax)) : '',
    })
    setDeadlineInputValue(formatDeadlineDisplay(selectedJob.applicationDeadline || ''))
    setJobForm({
      title: selectedJob.title,
      department: selectedJob.department,
      level: selectedJob.level || '',
      employmentType: selectedJob.employmentType || 'FULL_TIME',
      locationType: selectedJob.locationType || 'OFFICE',
      location: selectedJob.location || '',
      applicationDeadline: selectedJob.applicationDeadline || '',
      description: selectedJob.description || '',
      requirements: selectedJob.requirements || '',
      benefits: selectedJob.benefits || '',
      salaryMin: selectedJob.salaryMin || 0,
      salaryMax: selectedJob.salaryMax || 0,
      status: selectedJob.status || 'DRAFT',
    })
  }, [selectedJob, jobView])

  const reloadJobCriteria = async (jobId: string) => {
    const nextCriteria = await hrApi.getJobCriteriaByJobId(jobId)
    setJobCriteria(nextCriteria.slice().sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0)))
  }

  const startEditCriteria = () => {
    if (isActionLocked || isClosedJobStatus(selectedJob?.status)) return

    setIsEditingCriteria(true)
    setCriteriaForms(jobCriteria.length > 0 ? jobCriteria.map(mapCriteriaResponseToRow) : [createEmptyCriterionRow()])
    setCriteriaFieldErrors({})
    setDeletedCriteriaIds([])
  }

  const addCriterionRow = () => {
    if (isActionLocked || isClosedJobStatus(selectedJob?.status) || criteriaForms.length >= maxCriteriaCount) return

    setCriteriaForms((currentForms) => [...currentForms, createEmptyCriterionRow()])
  }

  const updateCriterionForm = (clientId: string, field: keyof Pick<EditableCriterion, 'name' | 'description' | 'category' | 'weight'>, value: string) => {
    if (isActionLocked || isClosedJobStatus(selectedJob?.status)) return

    const limit = field === 'name' ? criteriaNameLimit : field === 'description' ? criteriaDescriptionLimit : null
    const nextValue = field === 'weight'
      ? normalizeWeightInput(value)
      : field === 'name'
        ? value.slice(0, criteriaNameLimit)
        : field === 'description'
          ? value.slice(0, criteriaDescriptionLimit)
          : value
    setCriteriaForms((currentForms) => currentForms.map((form) => (
      form.clientId === clientId ? { ...form, [field]: nextValue } : form
    )))
    setCriteriaFieldErrors((currentErrors) => {
      const formErrors = currentErrors[clientId]
      const shouldShowLengthError = limit !== null && value.length > limit
      if (shouldShowLengthError) {
        return {
          ...currentErrors,
          [clientId]: {
            ...(formErrors || {}),
            [field]: criteriaLengthExceededMessage,
          },
        }
      }
      if (!formErrors?.[field]) return currentErrors
      const { [field]: _removed, ...nextFormErrors } = formErrors
      return { ...currentErrors, [clientId]: nextFormErrors }
    })
  }

  const discardCriterionFormChanges = () => {
    setIsEditingCriteria(false)
    setCriteriaForms([])
    setCriteriaFieldErrors({})
    setDeletedCriteriaIds([])
  }

  const requestCriteriaCancel = (nextAction?: () => void) => {
    if (isSavingCriteria) return

    if (!isEditingCriteria) {
      nextAction?.()
      return
    }

    setPendingCriteriaCancelAction(() => nextAction || (() => undefined))
  }

  const cancelCriterionForm = () => {
    requestCriteriaCancel()
  }

  const confirmCriteriaCancel = () => {
    const nextAction = pendingCriteriaCancelAction
    discardCriterionFormChanges()
    setPendingCriteriaCancelAction(null)
    nextAction?.()
  }

  const removeDraftCriterion = (clientId: string) => {
    if (isSavingCriteria) return

    setCriteriaForms((currentForms) => {
      const removedForm = currentForms.find((form) => form.clientId === clientId)
      if (removedForm?.id) {
        setDeletedCriteriaIds((currentIds) => currentIds.includes(removedForm.id as string) ? currentIds : [...currentIds, removedForm.id as string])
      }
      return currentForms.filter((form) => form.clientId !== clientId)
    })
    setCriteriaFieldErrors((currentErrors) => {
      const { [clientId]: _removed, ...nextErrors } = currentErrors
      return nextErrors
    })
  }

  const getCriteriaTotalWithForm = () => {
    const savedTotal = jobCriteria.reduce((total, item) => total + (Number(item.weight) || 0), 0)
    if (isEditingCriteria && criteriaForms.length === 0) return 0
    if (criteriaForms.length === 0) return savedTotal

    const draftTotal = criteriaForms.reduce((total, form) => {
      const currentWeight = Number(normalizeWeightInput(form.weight))
      return total + (Number.isFinite(currentWeight) ? currentWeight : 0)
    }, 0)
    return draftTotal
  }

  const validateCriterionForms = () => {
    const nextErrors: Record<string, CriteriaFieldErrors> = {}
    const trimmedRows = criteriaForms.map((form) => ({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim() || criteriaCategories[0],
      weight: normalizeWeightInput(form.weight),
    }))
    const draftNameCounts = new Map<string, number>()

    trimmedRows.forEach((row) => {
      const normalizedName = row.name.toLowerCase()
      if (normalizedName) draftNameCounts.set(normalizedName, (draftNameCounts.get(normalizedName) || 0) + 1)
    })

    trimmedRows.forEach((row) => {
      const rowErrors: CriteriaFieldErrors = {}
      const numericWeight = Number(row.weight)
      const normalizedName = row.name.toLowerCase()

      if (!row.name) rowErrors.name = 'Criterion name is required.'
      if (row.name.length > criteriaNameLimit) rowErrors.name = criteriaLengthExceededMessage
      if (normalizedName && Number(draftNameCounts.get(normalizedName)) > 1) {
        rowErrors.name = 'Criterion name must be unique in this job.'
      }
      if (!criteriaCategories.includes(row.category)) rowErrors.category = 'Category is required.'
      if (!row.description) rowErrors.description = 'Description is required.'
      if (row.description.length > criteriaDescriptionLimit) rowErrors.description = criteriaLengthExceededMessage
      if (!/^\d+(\.\d)?$/.test(row.weight) || !Number.isFinite(numericWeight) || numericWeight < 1 || numericWeight > 100) {
        rowErrors.weight = 'Must be between 1 and 100.'
      }
      if (Object.keys(rowErrors).length > 0) nextErrors[row.clientId] = rowErrors
    })

    setCriteriaFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return null

    return trimmedRows
  }

  const saveCriteria = async () => {
    if (isActionLocked || isSavingCriteria || isClosedJobStatus(selectedJob?.status) || !selectedJob?.id || !isEditingCriteria) return
    const validRows = validateCriterionForms()
    if (!validRows) return
    if (validRows.length === 0) {
      triggerToast?.('Please add at least one criterion before saving.', 'error')
      return
    }

    if (Math.round(getCriteriaTotalWithForm() * 10) / 10 !== 100) {
      triggerToast?.('Total weight must equal 100% before saving.', 'error')
      return
    }

    setIsSavingCriteria(true)
    try {
      await Promise.all(deletedCriteriaIds.map((id) => hrApi.deleteJobCriteria(id)))

      await hrApi.createJobCriteria(validRows.map((row) => ({
        ...(row.id ? { id: row.id } : {}),
        jobId: selectedJob.id,
        criterionName: row.name,
        category: row.category,
        description: row.description,
        weight: Number(row.weight),
      })))
      await reloadJobCriteria(selectedJob.id)
      setIsEditingCriteria(false)
      setCriteriaForms([])
      setCriteriaFieldErrors({})
      setDeletedCriteriaIds([])
      triggerToast?.('Criteria saved successfully.', 'success')
    } catch (error) {
      triggerToast?.(getCriteriaSaveError(error), 'error')
    } finally {
      setIsSavingCriteria(false)
    }
  }

  const clearAllCriteria = async () => {
    if (isActionLocked || isSavingCriteria || isClosedJobStatus(selectedJob?.status) || !selectedJob?.id) return
    if (jobCriteria.length === 0 && criteriaForms.length === 0) return

    const idsToDelete = (isEditingCriteria ? criteriaForms : jobCriteria)
      .map((criterion) => criterion.id)
      .filter((id): id is string => Boolean(id))

    setIsEditingCriteria(true)
    setCriteriaForms([])
    setCriteriaFieldErrors({})
    setDeletedCriteriaIds((currentIds) => Array.from(new Set([...currentIds, ...idsToDelete])))
  }

  // --- Job Form Handlers ---
  const updateJobFormField = <Field extends keyof JobPostingPayload>(field: Field, value: JobPostingPayload[Field]) => {
    const nextValue = field === 'title' && typeof value === 'string'
      ? (value.slice(0, jobTitleMaxLength) as JobPostingPayload[Field])
      : value

    setJobFieldErrors((current) => {
      if (!current[field]) return current
      const { [field]: _removed, ...nextErrors } = current
      return nextErrors
    })
    jobFormMethods.setValue(field, nextValue, { shouldDirty: true })
    jobFormMethods.clearErrors(field)
  }

  const updateSalaryField = (field: 'salaryMin' | 'salaryMax', value: string) => {
    setJobFieldErrors((current) => {
      if (!current.salaryMin && !current.salaryMax) return current
      const { salaryMin: _removedMin, salaryMax: _removedMax, ...nextErrors } = current
      return nextErrors
    })
    const formattedValue = formatCurrencyInput(value)
    setSalaryInputValues((current) => ({ ...current, [field]: formattedValue }))
    jobFormMethods.setValue(field, formattedValue === '' ? 0 : parseCurrencyInput(formattedValue), { shouldDirty: true })
    jobFormMethods.clearErrors(field)
  }

  const getSalaryRangeText = (payload: JobPostingPayload) => {
    const minSalary = salaryInputValues.salaryMin.trim()
    const maxSalary = salaryInputValues.salaryMax.trim()
    if (minSalary && maxSalary) return `${minSalary} - ${maxSalary}`
    if (payload.salaryMin > 0 && payload.salaryMax > 0) return `${payload.salaryMin} - ${payload.salaryMax}`
    return ''
  }

  const getAiDraftJobPayload = (draft: GenerateJobPostingAiResponse): JobPostingPayload => ({
    ...jobForm,
    title: (draft.title || draft.jobTitle || jobForm.title).trim(),
    department: (draft.department || jobForm.department).trim(),
    employmentType: (draft.employmentType || jobForm.employmentType || 'FULL_TIME').trim(),
    locationType: (draft.locationType || jobForm.locationType || 'OFFICE').trim(),
    location: (draft.location || jobForm.location).trim(),
    applicationDeadline: (draft.applicationDeadline || jobForm.applicationDeadline).trim(),
    description: draft.description || draft.jobDescription || jobForm.description,
    requirements: draft.requirements || (Array.isArray(draft.keySkills) ? draft.keySkills.join('\n') : draft.keySkills) || draft.additionalRequirements || jobForm.requirements,
    benefits: draft.benefits || jobForm.benefits,
    salaryMin: Number(draft.salaryMin ?? jobForm.salaryMin) || 0,
    salaryMax: Number(draft.salaryMax ?? jobForm.salaryMax) || 0,
    status: draft.status || jobForm.status || 'OPEN',
  })

  const applyAiGeneratedJob = () => {
    if (!aiGeneratedJob) return
    const nextPayload = getAiDraftJobPayload(aiGeneratedJob)
    setJobForm(nextPayload)
    setSalaryInputValues({
      salaryMin: nextPayload.salaryMin ? formatCurrencyInput(String(nextPayload.salaryMin)) : '',
      salaryMax: nextPayload.salaryMax ? formatCurrencyInput(String(nextPayload.salaryMax)) : '',
    })
    setDeadlineInputValue(formatDeadlineDisplay(nextPayload.applicationDeadline))
    setJobFieldErrors({})
  }

  const discardAiGeneratedJob = () => {
    setAiGeneratedJob(null)
    setAiGenerateError('')
  }

  const copyAiGeneratedJob = async () => {
    if (!aiGeneratedJob) return
    const draft = getAiDraftJobPayload(aiGeneratedJob)
    const text = [
      draft.title,
      draft.description,
      draft.requirements,
      draft.benefits,
    ].map((item) => item?.trim()).filter(Boolean).join('\n\n')

    await navigator.clipboard?.writeText(text)
    triggerToast?.('AI content copied.', 'success')
  }

  const getJobToastErrorMessage = (error: unknown, fallbackMessage: string) => {
    const backendMessage = getBackendErrorMessage(error).trim()
    return backendMessage || getAdminErrorMessage(error, fallbackMessage)
  }

  const generateAiJobContent = async () => {
    if (isActionLocked || isGeneratingAiJob) return
    const payload = jobForm
    const nextErrors = getAiJobValidationErrors(payload, salaryInputValues)

    if (Object.keys(nextErrors).length > 0) {
      setJobFieldErrors(nextErrors)
      return
    }

    setJobFieldErrors({})

    setIsGeneratingAiJob(true)
    setAiGenerateError('')
    try {
      const generatedJob = await hrApi.generateJobPostingAi({
        jobTitle: payload.title.trim(),
        department: payload.department.trim(),
        location: payload.location.trim(),
        locationType: payload.locationType.trim(),
        salaryRange: getSalaryRangeText(payload),
        keySkills: payload.requirements.split(/\r?\n|,/).map((skill) => skill.trim()).filter(Boolean),
        additionalRequirements: payload.requirements.trim(),
      })
      setAiGeneratedJob(generatedJob)
      triggerToast?.('AI job description generated successfully.', 'success')
    } catch (error) {
      const message = getJobToastErrorMessage(error, 'Failed to generate job description. Please try again.')
      setAiGenerateError(message)
      triggerToast?.(message, 'error')
    } finally {
      setIsGeneratingAiJob(false)
    }
  }

  const toggleDeadlinePicker = () => {
    setDeadlineCalendarMonth(getCalendarMonth(jobForm.applicationDeadline))
    setIsDeadlineCalendarOpen((isOpen) => !isOpen)
  }

  const updateDeadlineInputValue = (value: string) => {
    const nextInputValue = value.slice(0, FIELD_LENGTH_LIMITS.defaultText)
    setDeadlineInputValue(nextInputValue)

    const nextDeadlineValue = parseDeadlineInput(nextInputValue)
    updateJobFormField('applicationDeadline', nextDeadlineValue)

    if (nextDeadlineValue) {
      setDeadlineCalendarMonth(getCalendarMonth(nextDeadlineValue))
    }
  }

  const selectDeadlineDate = (date: Date) => {
    const nextDeadlineValue = getLocalDateKey(date)
    setDeadlineInputValue(formatDeadlineDisplay(nextDeadlineValue))
    updateJobFormField('applicationDeadline', nextDeadlineValue)
    setDeadlineCalendarMonth(getCalendarMonth(nextDeadlineValue))
    setIsDeadlineCalendarOpen(false)
  }

  const clearDeadlineDate = () => {
    setDeadlineInputValue('')
    updateJobFormField('applicationDeadline', '')
    setIsDeadlineCalendarOpen(false)
  }

  const discardJobFormChanges = () => {
    window.sessionStorage.removeItem('jobfusion.hr.jobFormRefreshView')
    setIsCancelConfirmOpen(false)
    setJobFieldErrors({})
    setPendingDuplicateTitlePayload(null)
    setDeadlineInputValue('')
    setSalaryInputValues({ salaryMin: '', salaryMax: '' })
    setJobForm(emptyJobForm)
    onReturnToList()
  }

  const handleCancelJobForm = () => {
    if (isJobFormDirty) {
      setIsCancelConfirmOpen(true)
      return
    }

    discardJobFormChanges()
  }

  const saveJob = async (payload: JobPostingPayload = jobForm, options: { allowDuplicateTitle?: boolean } = {}) => {
    if (isActionLocked || isSavingJob) return
    const resolverIsValid = await jobFormMethods.trigger()
    if (!resolverIsValid) {
      const resolverErrors = Object.fromEntries(
        Object.entries(jobFormMethods.formState.errors).map(([field, error]) => [field, error?.message || '']),
      ) as JobFieldErrors
      setJobFieldErrors(resolverErrors)
      return
    }
    const payloadWithDeadline = withDefaultApplicationDeadline(payload)
    const nextErrors = getJobValidationErrors(payloadWithDeadline, salaryInputValues)

    if (Object.keys(nextErrors).length > 0) {
      setJobFieldErrors(nextErrors)
      Object.entries(nextErrors).forEach(([field, message]) => {
        if (message) jobFormMethods.setError(field as keyof JobPostingPayload, { type: 'validate', message })
      })
      return
    }

    if (!options.allowDuplicateTitle && hasDuplicateJobTitle(payloadWithDeadline, jobs, selectedJob?.id)) {
      setJobFieldErrors({})
      setPendingDuplicateTitlePayload(payloadWithDeadline)
      return
    }

    if (payloadWithDeadline.applicationDeadline !== payload.applicationDeadline) {
      setJobForm(payloadWithDeadline)
      setDeadlineInputValue(formatDeadlineDisplay(payloadWithDeadline.applicationDeadline))
    }
    setJobFieldErrors({})
    setPendingDuplicateTitlePayload(null)
    setIsSavingJob(true)
    const isEditingJob = jobView === 'edit' && selectedJob

    try {
      if (isEditingJob) {
        await hrApi.updateJobPosting(selectedJob.id, payloadWithDeadline)
      } else {
        await hrApi.createJobPosting(payloadWithDeadline)
      }
      discardJobFormChanges()
      triggerToast?.(isEditingJob ? 'Job posting updated successfully.' : 'Job posting created successfully.', 'success')
    } catch (error) {
      const apiFieldErrors = getJobFieldErrorsFromApiError(error)

      if (isJobTitleAlreadyExistsError(error)) {
        setPendingDuplicateTitlePayload(payload)
      } else if (!isEditingJob && isJobPostingLimitReachedError(error)) {
        triggerToast?.(jobPostingLimitReachedMessage, 'error')
      } else if (Object.keys(apiFieldErrors).length > 0) {
        setJobFieldErrors(apiFieldErrors)
        Object.entries(apiFieldErrors).forEach(([field, message]) => {
          if (message) jobFormMethods.setError(field as keyof JobPostingPayload, { type: 'server', message })
        })
        triggerToast?.(getJobToastErrorMessage(error, 'Please check the highlighted fields.'), 'error')
      } else {
        triggerToast?.(getJobToastErrorMessage(error, 'Error system. Please try again.'), 'error')
      }
    } finally {
      setIsSavingJob(false)
    }
  }

  return {
    // Criteria States & Handlers
    jobCriteria,
    isEditingCriteria,
    criteriaForms,
    criteriaFieldErrors,
    deletedCriteriaIds,
    isLoadingCriteria,
    isSavingCriteria,
    pendingCriteriaCancelAction,
    setPendingCriteriaCancelAction,
    reloadJobCriteria,
    startEditCriteria,
    addCriterionRow,
    updateCriterionForm,
    discardCriterionFormChanges,
    requestCriteriaCancel,
    cancelCriterionForm,
    confirmCriteriaCancel,
    removeDraftCriterion,
    getCriteriaTotalWithForm,
    validateCriterionForms,
    saveCriteria,
    clearAllCriteria,

    // Job Form States & Handlers
    jobForm,
    setJobForm,
    salaryInputValues,
    setSalaryInputValues,
    jobFieldErrors,
    setJobFieldErrors,
    isSavingJob,
    isDeadlineCalendarOpen,
    deadlineCalendarMonth,
    setDeadlineCalendarMonth,
    deadlineInputValue,
    setDeadlineInputValue,
    isCancelConfirmOpen,
    setIsCancelConfirmOpen,
    pendingDuplicateTitlePayload,
    setPendingDuplicateTitlePayload,
    aiGeneratedJob,
    isGeneratingAiJob,
    aiGenerateError,
    isJobFormDirty,
    updateJobFormField,
    updateSalaryField,
    generateAiJobContent,
    applyAiGeneratedJob,
    discardAiGeneratedJob,
    copyAiGeneratedJob,
    toggleDeadlinePicker,
    updateDeadlineInputValue,
    selectDeadlineDate,
    clearDeadlineDate,
    discardJobFormChanges,
    handleCancelJobForm,
    saveJob,
  }
}
