const resumeCandidateIdPrefix = 'candidate_resume_candidate_id_'
const resumeUploadedPrefix = 'candidate_resume_uploaded_'

export function getResumeCandidateIdKey(jobId: string) {
  return `${resumeCandidateIdPrefix}${jobId}`
}

export function readCandidateIdFromPayload(payload: any): string {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.result,
    payload?.resume,
    payload?.candidate,
  ].filter(Boolean)

  for (const candidate of candidates) {
    const value = candidate?.candidateId || candidate?.candidate_id || candidate?.id || candidate?.userId || candidate?.user_id
    if (value) return String(value)
  }

  return ''
}

export function saveResumeCandidateId(jobId: string, candidateId: string) {
  if (!jobId || !candidateId) return
  window.sessionStorage.setItem(getResumeCandidateIdKey(jobId), candidateId)
  window.localStorage.setItem(getResumeCandidateIdKey(jobId), candidateId)
}

export function getSavedResumeCandidateId(jobId: string) {
  return window.sessionStorage.getItem(getResumeCandidateIdKey(jobId)) ||
    window.localStorage.getItem(getResumeCandidateIdKey(jobId)) ||
    ''
}

export function getCurrentCandidateId() {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return ''

  try {
    const user = JSON.parse(rawUser)
    return String(user?.candidateId || user?.candidate_id || user?.id || user?.userId || user?.user_id || '')
  } catch {
    return ''
  }
}

export function getResumeUploadedKey(jobId: string) {
  return `${resumeUploadedPrefix}${jobId}`
}

export function markResumeUploaded(jobId: string) {
  if (!jobId) return
  window.localStorage.setItem(getResumeUploadedKey(jobId), 'true')
}

export function hasUploadedResume(jobId: string) {
  return window.localStorage.getItem(getResumeUploadedKey(jobId)) === 'true'
}
