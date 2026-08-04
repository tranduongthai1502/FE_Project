import { describe, expect, it } from 'vitest'
import {
  buildJobPayloadFromPosting,
  getJobActionConfirmMessage,
  getNormalizedJobStatus,
  isClosedJobStatus,
  isOpenJobStatus,
  mapCriteriaResponseToRow,
  normalizeWeightInput,
} from '@/features/hr/infrastructure/hrJobLogic'
import { isValidApplicationDeadline, isValidSalaryRange } from '@/features/hr/domain/jobPostingRules'
import { calculateTotalCriteriaWeight, isCriteriaWeight100Percent, isValidCriteriaCount } from '@/features/hr/domain/jobCriteriaRules'
import { validateJobPostingForm } from '@/features/hr/application/jobFormValidation'
import { validateCriteriaList } from '@/features/hr/application/criteriaFormValidation'
import type { JobPosting } from '@/features/hr/domain/hrApi.types'

describe('hrJobLogic', () => {
  it('should normalize job status correctly', () => {
    expect(getNormalizedJobStatus('open')).toBe('OPEN')
    expect(getNormalizedJobStatus('in_progress')).toBe('IN_PROGRESS')
    expect(getNormalizedJobStatus('  closed  ')).toBe('CLOSED')
  })

  it('should identify open and closed status correctly', () => {
    expect(isOpenJobStatus('OPEN')).toBe(true)
    expect(isOpenJobStatus('ACTIVE')).toBe(true)
    expect(isOpenJobStatus('CLOSED')).toBe(false)

    expect(isClosedJobStatus('CLOSED')).toBe(true)
    expect(isClosedJobStatus('CLOSE')).toBe(true)
    expect(isClosedJobStatus('OPEN')).toBe(false)
  })

  it('should build payload from job posting', () => {
    const mockPosting: JobPosting = {
      id: 'job-1',
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      level: 'Senior',
      employmentType: 'FULL_TIME',
      locationType: 'OFFICE',
      location: 'Hanoi',
      applicationDeadline: '2026-12-31',
      description: 'Job desc',
      requirements: 'Reqs',
      benefits: 'Benefits',
      salaryMin: 2000,
      salaryMax: 3000,
      status: 'OPEN',
      criteriaCount: 5,
      createdAt: '2026-01-01',
    }

    const payload = buildJobPayloadFromPosting(mockPosting, 'CLOSED')
    expect(payload.title).toBe('Senior Frontend Developer')
    expect(payload.status).toBe('CLOSED')
    expect(payload.salaryMin).toBe(2000)
  })

  it('should normalize weight input correctly', () => {
    expect(normalizeWeightInput('25%')).toBe('25')
    expect(normalizeWeightInput('12,5%')).toBe('12.5')
    expect(normalizeWeightInput('100')).toBe('100')
  })

  it('should map criteria response to row', () => {
    const row = mapCriteriaResponseToRow({
      id: 'crit-1',
      name: 'React JS',
      description: 'Expertise in React',
      category: 'Technical Skills',
      weight: 20,
      sortOrder: 1,
    })

    expect(row.id).toBe('crit-1')
    expect(row.name).toBe('React JS')
    expect(row.weight).toBe('20')
  })

  it('should provide appropriate confirm messages for actions', () => {
    const mockJob = { id: '1', title: 'Dev', status: 'DRAFT' } as JobPosting

    expect(getJobActionConfirmMessage('close', mockJob)).toContain('close this job posting')
    expect(getJobActionConfirmMessage('delete', mockJob)).toContain('permanently delete')
    expect(getJobActionConfirmMessage('open', mockJob)).toContain('open this job posting')
  })
})

describe('jobPostingRules', () => {
  const fixedNow = Date.parse('2026-08-04T08:00:00Z')

  it('should validate application deadline correctly', () => {
    expect(isValidApplicationDeadline('2026-12-31', fixedNow)).toBe(true)
    expect(isValidApplicationDeadline('2025-01-01', fixedNow)).toBe(false)
    expect(isValidApplicationDeadline('', fixedNow)).toBe(false)
  })

  it('should validate salary range correctly', () => {
    expect(isValidSalaryRange(1000, 2000)).toBe(true)
    expect(isValidSalaryRange(3000, 2000)).toBe(false)
    expect(isValidSalaryRange(-10, 2000)).toBe(false)
  })
})

describe('jobCriteriaRules', () => {
  it('should validate criteria count and weights', () => {
    expect(isValidCriteriaCount(10)).toBe(true)
    expect(isValidCriteriaCount(25)).toBe(false)
    expect(calculateTotalCriteriaWeight(['20', '30', '50'])).toBe(100)
    expect(isCriteriaWeight100Percent(['20', '30', '50'])).toBe(true)
    expect(isCriteriaWeight100Percent(['20', '30', '40'])).toBe(false)
  })
})

describe('hrFormValidations', () => {
  it('should validate job posting form accurately', () => {
    const invalidRes = validateJobPostingForm({ title: '', department: 'Eng', salaryMin: 3000, salaryMax: 1000 })
    expect(invalidRes.isValid).toBe(false)
    expect(invalidRes.errors.title).toBeDefined()
    expect(invalidRes.errors.salaryMax).toBeDefined()

    const validRes = validateJobPostingForm({ title: 'React Dev', department: 'Eng', employmentType: 'FULL_TIME', salaryMin: 1000, salaryMax: 2000 })
    expect(validRes.isValid).toBe(true)
  })

  it('should validate criteria list accurately', () => {
    const invalidRes = validateCriteriaList([
      { name: '', weight: 150 },
    ])
    expect(invalidRes.isValid).toBe(false)
    expect(invalidRes.errors[0]?.name).toBeDefined()
    expect(invalidRes.errors[0]?.weight).toBeDefined()

    const validRes = validateCriteriaList([
      { name: 'React', weight: 50 },
      { name: 'TypeScript', weight: 50 },
    ])
    expect(validRes.isValid).toBe(true)
  })
})
