export function getStoredCurrentUserStatus() {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return ''

  try {
    const user = JSON.parse(rawUser)
    return String(user?.status || user?.accountStatus || user?.userStatus || user?.state || '')
  } catch {
    return ''
  }
}

export function isInactiveCurrentUserStatus(value: string) {
  const normalized = value.trim().toLowerCase()
  return ['inactive', 'disabled', 'deactivated', 'not_active', 'not active'].includes(normalized)
}

export function isStoredCurrentUserInactive() {
  return isInactiveCurrentUserStatus(getStoredCurrentUserStatus())
}
