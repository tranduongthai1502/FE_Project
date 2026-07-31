export type CandidatePanel = 'dashboard' | 'changePassword'

export type CandidatePortalPageProps = {
  onLogout: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

export type StoredCandidateUser = {
  full_name?: string | null
  fullName?: string | null
  name?: string | null
  email?: string | null
  avatar?: string | null
  role?: string | null
  userRole?: string | null
  job_title?: string | null
  jobTitle?: string | null
  headline?: string | null
  user_role?: string | null
  type?: string | null
}
