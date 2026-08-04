import { describe, expect, it } from 'vitest'
import { buildStaffListFilters } from '@/features/tenant/application/tenantStaffFilters'
import { hasDuplicateStaffFullName } from '@/features/tenant/application/tenantStaffFormValidation'
import { buildStaffQuotaState } from '@/features/tenant/application/tenantStaffQuota'

describe('tenantStaffFilters', () => {
  it('should trim and include non-empty filter values', () => {
    const filters = buildStaffListFilters({
      search: '  John  ',
      fullName: '  ',
      userRole: 'ADMIN',
      status: 'ACTIVE',
    })

    expect(filters).toEqual({
      search: 'John',
      userRole: 'ADMIN',
      status: 'ACTIVE',
    })
  })

  it('should return empty object when no valid filters passed', () => {
    expect(buildStaffListFilters({})).toEqual({})
  })
})

describe('tenantStaffFormValidation', () => {
  const sampleStaffList = [
    { id: '1', fullName: 'Alice Smith', email: 'alice@example.com', role: 'HR', status: 'ACTIVE' as const, avatarUrl: '', joinedAt: '' },
    { id: '2', fullName: 'Bob Jones', email: 'bob@example.com', role: 'INTERVIEWER', status: 'ACTIVE' as const, avatarUrl: '', joinedAt: '' },
  ]

  it('should detect duplicate full names case-insensitively', () => {
    expect(hasDuplicateStaffFullName(sampleStaffList, 'alice smith')).toBe(true)
    expect(hasDuplicateStaffFullName(sampleStaffList, '  ALICE SMITH  ')).toBe(true)
  })

  it('should ignore self when updating existing staff member', () => {
    expect(hasDuplicateStaffFullName(sampleStaffList, 'Alice Smith', '1')).toBe(false)
  })

  it('should return false for unique names', () => {
    expect(hasDuplicateStaffFullName(sampleStaffList, 'Charlie Brown')).toBe(false)
  })
})

describe('tenantStaffQuota', () => {
  it('should calculate limited quota state correctly', () => {
    const quotaState = buildStaffQuotaState({
      staffAccountLimit: { limit: 10, used: 4, unlimited: false },
      staffAccountListLength: 4,
      tenantDetail: null,
      tenantPlan: null,
    })

    expect(quotaState.isStaffQuotaUnlimited).toBe(false)
    expect(quotaState.maxStaffQuota).toBe(10)
    expect(quotaState.staffAccountCount).toBe(4)
    expect(quotaState.staffQuotaPercent).toBe(40)
    expect(quotaState.staffQuotaRingLabel).toBe('4/10')
    expect(quotaState.staffQuotaSummary).toBe('4 / 10 Seats')
    expect(quotaState.staffQuotaDescription).toContain('6 seats available')
  })

  it('should calculate unlimited quota state correctly', () => {
    const quotaState = buildStaffQuotaState({
      staffAccountLimit: { limit: 0, used: 5, unlimited: true },
      staffAccountListLength: 5,
      tenantDetail: null,
      tenantPlan: null,
    })

    expect(quotaState.isStaffQuotaUnlimited).toBe(true)
    expect(quotaState.staffQuotaSummary).toBe('Unlimited Seats')
    expect(quotaState.staffQuotaPercent).toBe(100)
    expect(quotaState.staffQuotaDescription).toContain('unlimited staff seats')
  })
})
