import type { JobCriteriaResponse, JobPosting, JobPostingPayload } from '@/services/api/api.types'
import { FIELD_LENGTH_LIMITS, validationErrorMessages } from '@/services/api/axiosErrorHandler'
import { getErrorMessage as getAdminErrorMessage } from '@/services/error/errorMessages'
import { stripCurrencyGrouping } from '@/utils/currencyFormat'
import { getRichTextPlainText } from './hrRichTextUtils'

export type JobFieldErrors = Partial<Record<keyof JobPostingPayload, string>>
export type JobConfirmAction = 'close' | 'open' | 'deleteDraft' | null
export type JobDetailTab = 'overview' | 'criteria'
export type EditableCriterion = {
  clientId: string
  id?: string
  name: string
  description: string
  category: string
  weight: string
  sortOrder?: number
  updatedAt?: string
}
export type CriteriaFieldErrors = Partial<Record<'name' | 'category' | 'weight' | 'description', string>>

export const requiredJobFieldMessage = validationErrorMessages.requiredField
export const departmentRequiredMessage = validationErrorMessages.departmentRequired
export const employmentTypeRequiredMessage = validationErrorMessages.employmentTypeRequired
export const duplicateJobTitleConfirmMessage = 'A job posting with this title already exists. Are you sure you want to create another one?'
export const salaryPairMessage = validationErrorMessages.salaryPairRequired
export const salaryOrderMessage = validationErrorMessages.salaryOrderInvalid
export const salaryPositiveMessage = 'Salary must be a positive number.'
export const deadlineFutureMessage = 'Application deadline must be today or a future date.'
export const jobTitleMaxLength = 100
export const jobTitleLengthMessage = `Job title must be ${jobTitleMaxLength} characters or less.`
export const criteriaCategories = ['Technical Skills', 'Experience', 'Education', 'Soft Skills', 'Culture Fit']
export const criteriaNameLimit = 100
export const criteriaDescriptionLimit = 500
export const maxCriteriaCount = 20

const jobApiFieldMap: Record<string, keyof JobPostingPayload> = {
  title: 'title',
  jobTitle: 'title',
  job_title: 'title',
  department: 'department',
  employmentType: 'employmentType',
  employment_type: 'employmentType',
  type: 'employmentType',
  locationType: 'locationType',
  location_type: 'locationType',
  location: 'location',
  applicationDeadline: 'applicationDeadline',
  application_deadline: 'applicationDeadline',
  deadline: 'applicationDeadline',
  description: 'description',
  requirements: 'requirements',
  benefits: 'benefits',
  salaryMin: 'salaryMin',
  salary_min: 'salaryMin',
  minSalary: 'salaryMin',
  min_salary: 'salaryMin',
  salaryMax: 'salaryMax',
  salary_max: 'salaryMax',
  maxSalary: 'salaryMax',
  max_salary: 'salaryMax',
  status: 'status',
}

export const emptyJobForm: JobPostingPayload = {
  title: '',
  department: '',
  level: '',
  employmentType: '',
  locationType: 'OFFICE',
  location: '',
  applicationDeadline: '',
  description: '',
  requirements: '',
  benefits: '',
  salaryMin: 0,
  salaryMax: 0,
  status: 'OPEN',
}

export const createCriterionClientId = () => `criterion-${Date.now()}-${Math.random().toString(16).slice(2)}`

export function getNormalizedJobStatus(status?: string) {
  return String(status || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
}

export function isOpenJobStatus(status?: string) {
  const normalized = getNormalizedJobStatus(status)
  return normalized === 'OPEN' || normalized === 'ACTIVE'
}

export function isClosedJobStatus(status?: string) {
  const normalized = getNormalizedJobStatus(status)
  return normalized === 'CLOSED' || normalized === 'CLOSE'
}

export function isDraftJobStatus(status?: string) {
  return getNormalizedJobStatus(status) === 'DRAFT'
}

export function buildJobPayloadFromPosting(job: JobPosting, status = job.status): JobPostingPayload {
  return {
    title: job.title,
    department: job.department,
    level: job.level || '',
    employmentType: job.employmentType || 'FULL_TIME',
    locationType: job.locationType || 'OFFICE',
    location: job.location || '',
    applicationDeadline: job.applicationDeadline || '',
    description: job.description || '',
    requirements: job.requirements || '',
    benefits: job.benefits || '',
    salaryMin: job.salaryMin || 0,
    salaryMax: job.salaryMax || 0,
    status,
  }
}

export function getJobActionConfirmMessage(action: Exclude<JobConfirmAction, null>, job: JobPosting) {
  if (action === 'close') {
    return 'Are you sure you want to close this job posting? No new applications will be accepted.'
  }

  if (action === 'deleteDraft') {
    return 'Are you sure you want to permanently delete this job posting? This action cannot be undone.'
  }

  return isDraftJobStatus(job.status)
    ? 'Are you sure you want to open this job posting? It will become visible to candidates immediately.'
    : 'Are you sure you want to reopen this job posting? Candidates will be able to apply again.'
}

export function mapCriteriaResponseToRow(item: JobCriteriaResponse): EditableCriterion {
  return {
    clientId: item.id || createCriterionClientId(),
    id: item.id,
    name: item.name || '',
    description: item.description || '',
    category: criteriaCategories.includes(item.category || '') ? String(item.category) : criteriaCategories[0],
    weight: item.weight === undefined || item.weight === null ? '' : String(item.weight),
    sortOrder: item.sortOrder,
    updatedAt: item.updatedAt,
  }
}

export function createEmptyCriterionRow(): EditableCriterion {
  return {
    clientId: createCriterionClientId(),
    name: '',
    description: '',
    category: criteriaCategories[0],
    weight: '',
  }
}

export function normalizeWeightInput(value: string) {
  const withoutPercent = value.replace(/%/g, '').replace(',', '.')
  const numericOnly = withoutPercent.replace(/[^\d.]/g, '')
  const [whole = '', ...decimalParts] = numericOnly.split('.')
  const decimal = decimalParts.join('').slice(0, 1)

  return decimalParts.length > 0 ? `${whole}.${decimal}` : whole
}

export function getCriteriaSaveError(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status

  if (status === 409) {
    return 'Criteria changed in another session. Please reload the latest data before saving.'
  }

  return getAdminErrorMessage(error, 'Failed to save criteria. Please try again.')
}

export function getCriteriaSnapshot(rows: EditableCriterion[]) {
  return rows.map((row, index) => ({
    id: row.id || '',
    name: row.name.trim(),
    description: row.description.trim(),
    category: row.category.trim() || criteriaCategories[0],
    weight: normalizeWeightInput(row.weight),
    sortOrder: index + 1,
  }))
}

export function formatJobDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function formatJobStatus(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, ' ')
  return normalized ? normalized.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Draft'
}

export function formatEmploymentType(value: string) {
  return value.trim().replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function getDaysOpen(value?: string) {
  if (!value) return 0
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 0

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000))
}

export function getDaysUntilDeadline(value?: string) {
  if (!value) return null
  const deadline = new Date(value)
  if (Number.isNaN(deadline.getTime())) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86400000))
}

export function hasDuplicateJobTitle(payload: JobPostingPayload, jobs: JobPosting[], selectedJobId?: string) {
  const title = payload.title.trim()
  if (!title) return false

  return jobs.some((job) => (
    job.id !== selectedJobId &&
    job.title.trim().toLowerCase() === title.toLowerCase() &&
    ['open', 'draft'].includes(job.status.trim().toLowerCase())
  ))
}

export function getJobValidationErrors(payload: JobPostingPayload, salaryInputValues: { salaryMin: string; salaryMax: string }) {
  const nextErrors: JobFieldErrors = {}
  const title = payload.title.trim()
  const requiresSalaryPair = ['FULL_TIME', 'PART_TIME'].includes(payload.employmentType)
  const minSalaryValue = stripCurrencyGrouping(salaryInputValues.salaryMin)
  const maxSalaryValue = stripCurrencyGrouping(salaryInputValues.salaryMax)
  const minSalaryEntered = minSalaryValue !== ''
  const maxSalaryEntered = maxSalaryValue !== ''
  const salaryNumberPattern = /^\d+(\.\d+)?$/
  const minSalaryInvalid = minSalaryEntered && !salaryNumberPattern.test(minSalaryValue)
  const maxSalaryInvalid = maxSalaryEntered && !salaryNumberPattern.test(maxSalaryValue)

  if (!title) nextErrors.title = requiredJobFieldMessage
  if (title.length > jobTitleMaxLength) nextErrors.title = jobTitleLengthMessage
  if (!payload.department.trim()) nextErrors.department = departmentRequiredMessage
  if (!payload.employmentType.trim()) nextErrors.employmentType = employmentTypeRequiredMessage
  if (!payload.locationType.trim()) nextErrors.locationType = requiredJobFieldMessage
  if (!payload.location.trim()) nextErrors.location = requiredJobFieldMessage
  if (!getRichTextPlainText(payload.description)) nextErrors.description = requiredJobFieldMessage
  if (!getRichTextPlainText(payload.requirements)) nextErrors.requirements = requiredJobFieldMessage
  if (getRichTextPlainText(payload.description).length > FIELD_LENGTH_LIMITS.jobDescription) nextErrors.description = `Description must be ${FIELD_LENGTH_LIMITS.jobDescription} characters or less.`
  if (getRichTextPlainText(payload.requirements).length > FIELD_LENGTH_LIMITS.jobDescription) nextErrors.requirements = `Requirements must be ${FIELD_LENGTH_LIMITS.jobDescription} characters or less.`
  const benefitsText = getRichTextPlainText(payload.benefits)
  if (benefitsText && benefitsText.length > FIELD_LENGTH_LIMITS.jobDescription) nextErrors.benefits = `Benefits must be ${FIELD_LENGTH_LIMITS.jobDescription} characters or less.`

  if (minSalaryInvalid || payload.salaryMin < 0) nextErrors.salaryMin = salaryPositiveMessage
  if (maxSalaryInvalid || payload.salaryMax < 0) nextErrors.salaryMax = salaryPositiveMessage
  if (!minSalaryInvalid && !maxSalaryInvalid && requiresSalaryPair && ((minSalaryEntered && !maxSalaryEntered) || (!minSalaryEntered && maxSalaryEntered))) {
    nextErrors.salaryMax = salaryPairMessage
  }
  if (!minSalaryInvalid && !maxSalaryInvalid && minSalaryEntered && maxSalaryEntered && payload.salaryMin > payload.salaryMax) {
    nextErrors.salaryMax = salaryOrderMessage
  }

  if (payload.applicationDeadline) {
    const deadline = new Date(payload.applicationDeadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (Number.isNaN(deadline.getTime()) || deadline < today) {
      nextErrors.applicationDeadline = deadlineFutureMessage
    }
  }

  return nextErrors
}

export function getAiJobValidationErrors(payload: JobPostingPayload, salaryInputValues: { salaryMin: string; salaryMax: string }) {
  const nextErrors: JobFieldErrors = {}
  const minSalaryValue = stripCurrencyGrouping(salaryInputValues.salaryMin)
  const maxSalaryValue = stripCurrencyGrouping(salaryInputValues.salaryMax)
  const minSalaryEntered = minSalaryValue !== ''
  const maxSalaryEntered = maxSalaryValue !== ''
  const salaryNumberPattern = /^\d+(\.\d+)?$/
  const minSalaryInvalid = minSalaryEntered && !salaryNumberPattern.test(minSalaryValue)
  const maxSalaryInvalid = maxSalaryEntered && !salaryNumberPattern.test(maxSalaryValue)

  if (!payload.title.trim()) nextErrors.title = requiredJobFieldMessage
  if (!payload.department.trim()) nextErrors.department = departmentRequiredMessage
  if (!payload.locationType.trim()) nextErrors.locationType = requiredJobFieldMessage
  if (!payload.location.trim()) nextErrors.location = requiredJobFieldMessage
  if (!getRichTextPlainText(payload.requirements)) nextErrors.requirements = requiredJobFieldMessage
  if (getRichTextPlainText(payload.requirements).length > FIELD_LENGTH_LIMITS.jobDescription) nextErrors.requirements = `Key skills must be ${FIELD_LENGTH_LIMITS.jobDescription} characters or less.`

  if (minSalaryInvalid || payload.salaryMin < 0) nextErrors.salaryMin = salaryPositiveMessage
  if (maxSalaryInvalid || payload.salaryMax < 0) nextErrors.salaryMax = salaryPositiveMessage
  if (!minSalaryInvalid && !maxSalaryInvalid && ((minSalaryEntered && !maxSalaryEntered) || (!minSalaryEntered && maxSalaryEntered))) {
    nextErrors.salaryMax = salaryPairMessage
  }
  if (!minSalaryInvalid && !maxSalaryInvalid && minSalaryEntered && maxSalaryEntered && payload.salaryMin > payload.salaryMax) {
    nextErrors.salaryMax = salaryOrderMessage
  }

  if (payload.applicationDeadline) {
    const deadline = new Date(payload.applicationDeadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (Number.isNaN(deadline.getTime()) || deadline < today) {
      nextErrors.applicationDeadline = deadlineFutureMessage
    }
  }

  return nextErrors
}

export function getJobFieldErrorsFromApiError(error: unknown) {
  const payload = getApiErrorPayload(error)
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  const errors: JobFieldErrors = {}

  collectJobApiFieldErrors(data?.errors, errors)
  collectJobApiFieldErrors(data?.fieldErrors, errors)
  collectJobApiFieldErrors(data?.validationErrors, errors)
  collectJobApiFieldErrors(data?.violations, errors)
  collectJobApiFieldErrors(data?.data?.errors, errors)
  collectJobApiFieldErrors(data?.data?.fieldErrors, errors)

  return errors
}

export function isJobTitleAlreadyExistsError(error: unknown) {
  const payload = getApiErrorPayload(error)
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  const candidates = [
    data?.code,
    data?.error,
    data?.message,
    data?.backendMessage,
    data?.data?.code,
    data?.data?.error,
    data?.data?.message,
    (error as { backendMessage?: unknown } | null)?.backendMessage,
    (error as { code?: unknown } | null)?.code,
    (error as { message?: unknown } | null)?.message,
  ]

  return candidates.some((value) => String(value || '').trim().toLowerCase() === 'job_title_already_exists')
}

function getApiErrorPayload(error: unknown): any {
  if (!error || typeof error !== 'object') return null
  const errorObject = error as {
    errorData?: unknown
    response?: {
      data?: unknown
    }
  }

  return errorObject.errorData || errorObject.response?.data || null
}

function normalizeApiFieldName(field: string) {
  return field
    .replace(/\[(\w+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .pop() || field
}

function getApiFieldMessage(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean).join(' ')
  if (value && typeof value === 'object') {
    const objectValue = value as { message?: unknown; defaultMessage?: unknown; error?: unknown }
    return String(objectValue.message || objectValue.defaultMessage || objectValue.error || '').trim()
  }
  return String(value || '').trim()
}

function assignJobApiFieldError(errors: JobFieldErrors, field: unknown, message: unknown) {
  const fieldName = normalizeApiFieldName(String(field || ''))
  const jobField = jobApiFieldMap[fieldName] || jobApiFieldMap[fieldName.trim()]
  const errorMessage = getApiFieldMessage(message)

  if (jobField && errorMessage) {
    errors[jobField] = errorMessage
  }
}

function collectJobApiFieldErrors(candidate: any, errors: JobFieldErrors) {
  if (!candidate) return

  if (Array.isArray(candidate)) {
    candidate.forEach((item) => {
      if (item && typeof item === 'object') {
        assignJobApiFieldError(errors, item.field || item.name || item.property || item.path, item.message || item.defaultMessage || item.error)
      }
    })
    return
  }

  if (typeof candidate === 'object') {
    Object.entries(candidate).forEach(([field, message]) => {
      assignJobApiFieldError(errors, field, message)
    })
  }
}
