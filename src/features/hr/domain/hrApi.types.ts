export type JobPosting = {
  id: string
  title: string
  department: string
  level?: string
  employmentType: string
  locationType?: string
  location?: string
  applicationDeadline?: string
  description?: string
  requirements?: string
  benefits?: string
  salaryMin?: number
  salaryMax?: number
  status: string
  applicantCount: number
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  openedAt?: string
  revisionHistory?: JobRevisionHistory[]
}

export type JobRevisionHistory = {
  id?: string
  action: string
  actorName?: string
  createdAt?: string
}

export type JobRevisionHistoryItem = JobRevisionHistory


export type JobPostingPayload = {
  title: string
  department: string
  level: string
  employmentType: string
  locationType: string
  location: string
  applicationDeadline: string
  description: string
  requirements: string
  benefits: string
  salaryMin: number
  salaryMax: number
  status: string
  allowDuplicateTitle?: boolean
}

export type JobCriteriaPayload = {
  id?: string
  jobId?: string
  category?: string
  name?: string
  criterionName?: string
  weight?: number
  description?: string
  sortOrder?: number
}

export type JobCriteriaResponse = {
  id: string
  jobId: string
  category?: string
  criterionName?: string
  name: string
  weight?: number
  description?: string
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

export type DashboardStatsJobPostingResponse = {
  totalActivePostings?: number
  totalApplicants?: number
  postingsExpiringSoon?: number
  activeJobPostingUsed?: number
  activeJobPostingLimit?: number
  activeJobPostingUnlimited?: boolean
}

export type JobListFilters = {
  search?: string
  title?: string
  department?: string
  level?: string
  employmentType?: string
  locationType?: string
  status?: string
}

export type JobListRequest = import('@/core/api/api.types').ListRequest<JobListFilters | null>
