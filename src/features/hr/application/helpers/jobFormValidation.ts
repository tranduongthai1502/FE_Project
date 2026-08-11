import type { JobPostingPayload } from '../../domain/hrApi.types'
import { isValidSalaryRange } from '../../domain/jobPostingRules'
import { z } from 'zod'

export type JobFormFieldErrors = Partial<Record<keyof JobPostingPayload, string>>

export function validateJobPostingForm(payload: Partial<JobPostingPayload>): { isValid: boolean; errors: JobFormFieldErrors } {
  const errors: JobFormFieldErrors = {}
  const result = z
    .object({
      title: z.string().optional(),
      department: z.string().optional(),
      employmentType: z.string().optional(),
      salaryMin: z.number().optional(),
      salaryMax: z.number().optional(),
    })
    .superRefine((job, context) => {
      if (!job.title?.trim()) context.addIssue({ code: 'custom', path: ['title'], message: 'Job title is required.' })
      if (!job.department?.trim()) context.addIssue({ code: 'custom', path: ['department'], message: 'Department is required.' })
      if (!job.employmentType?.trim()) context.addIssue({ code: 'custom', path: ['employmentType'], message: 'Employment type is required.' })
      if (!isValidSalaryRange(job.salaryMin, job.salaryMax)) {
        context.addIssue({ code: 'custom', path: ['salaryMax'], message: 'Maximum salary must be greater than or equal to minimum salary.' })
      }
    })
    .safeParse(payload)

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof JobPostingPayload | undefined
      if (field && !errors[field]) {
        errors[field] = issue.message
      }
    })
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
