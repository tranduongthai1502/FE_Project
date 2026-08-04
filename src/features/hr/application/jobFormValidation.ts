import type { JobPostingPayload } from '../domain/hrApi.types'
import { isValidSalaryRange } from '../domain/jobPostingRules'

export type JobFormFieldErrors = Partial<Record<keyof JobPostingPayload, string>>

export function validateJobPostingForm(payload: Partial<JobPostingPayload>): { isValid: boolean; errors: JobFormFieldErrors } {
  const errors: JobFormFieldErrors = {}

  if (!payload.title || !payload.title.trim()) {
    errors.title = 'Job title is required.'
  }

  if (!payload.department || !payload.department.trim()) {
    errors.department = 'Department is required.'
  }

  if (!payload.employmentType || !payload.employmentType.trim()) {
    errors.employmentType = 'Employment type is required.'
  }

  if (!isValidSalaryRange(payload.salaryMin, payload.salaryMax)) {
    errors.salaryMax = 'Maximum salary must be greater than or equal to minimum salary.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
