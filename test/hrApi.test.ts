import { describe, expect, it } from 'vitest'
import { hrApi } from '../src/features/hr/services/hrApi'

describe('hrApi payload normalization and calls', () => {
  it('should be defined with all job posting methods', () => {
    expect(hrApi.getJobPostings).toBeDefined()
    expect(hrApi.getJobPostingById).toBeDefined()
    expect(hrApi.createJobPosting).toBeDefined()
    expect(hrApi.updateJobPosting).toBeDefined()
    expect(hrApi.deleteJobPosting).toBeDefined()
    expect(hrApi.checkTitleUniqueness).toBeDefined()
    expect(hrApi.getJobPostingStats).toBeDefined()
  })
})
