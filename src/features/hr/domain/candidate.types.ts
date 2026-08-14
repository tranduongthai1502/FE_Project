export type CandidateStage = 'Final Interview' | 'Technical Test' | 'Pass' | 'Hired' | 'Screening'

export type Candidate = {
  id: string
  candidateId?: string
  jobId?: string
  name: string
  targetJob: string
  matchScore: number
  recruitmentStage: CandidateStage | string
  dateApplied: string
  reviewed: boolean
}

export type CandidateComponentScore = {
  category: string
  score: number
  weight: number
  analysis: string
}

export type ExtractedExperienceItem = {
  title: string
  company: string
  duration: string
  description?: string
  bullets?: string[]
}

export type ExtractedEducationItem = {
  degree: string
  institution: string
  year: string
  description?: string
}

export type ExtractedCertificationItem = {
  title: string
  exp: string
}

export type ExtractedCvData = {
  summary: string
  experience: ExtractedExperienceItem[]
  education: ExtractedEducationItem[]
  certifications?: ExtractedCertificationItem[]
  skills: string[]
  cvFileName?: string
  cvMimeType?: string
  cvDownloadUrl?: string
}

export type CandidateDetail = Candidate & {
  email: string
  phone: string
  location: string
  avatarUrl?: string
  scoringStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
  extractedCv: ExtractedCvData
  componentAnalysis: CandidateComponentScore[]
  aiJustification: string[]
  keySkillGaps: string[]
}

export type CandidateFilterValues = {
  search?: string
  jobFilter?: string
  statusFilter?: string
  matchScoreFilter?: string
  appliedDateFilter?: string
}

export type CandidateDashboardStats = {
  totalCandidates: number
  aiMatches?: number
  newThisWeek: number
  avgMatchScore: number
  pendingReview: number
}
