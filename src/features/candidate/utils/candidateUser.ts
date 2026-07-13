import type { StoredCandidateUser } from '../types/candidate.types'

export function getStoredUser(): StoredCandidateUser | null {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export function getUserDisplayName(user: StoredCandidateUser | null) {
  return user?.full_name || user?.fullName || user?.name || user?.email || 'Candidate'
}

export function getUserInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'C'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

export function getUserSubtitle(user: StoredCandidateUser | null) {
  return user?.job_title || user?.jobTitle || user?.headline || user?.role || user?.userRole || user?.user_role || user?.type || 'Candidate'
}
