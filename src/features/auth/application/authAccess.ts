import { getStoredUserInfo } from '../infrastructure/authStorageRepository'

export function getStoredCurrentUserStatus() {
  const user = getStoredUserInfo()
  return String(user?.status || user?.accountStatus || user?.userStatus || user?.state || '')
}

export function isInactiveCurrentUserStatus(value: string) {
  const normalized = value.trim().toLowerCase()
  return ['inactive', 'disabled', 'deactivated', 'not_active', 'not active'].includes(normalized)
}

export function isStoredCurrentUserInactive() {
  return isInactiveCurrentUserStatus(getStoredCurrentUserStatus())
}
