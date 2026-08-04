export type CandidatePortalPageProps = {
  onLogout: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}
