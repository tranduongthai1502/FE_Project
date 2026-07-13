export { CandidateChangePasswordView } from './components/ChangePasswordView'
export { authApi } from './services/authApi'
export type { ChangePasswordPayload, LoginPayload, RegisterPayload } from './types/auth.types'
export type { AppRole } from './utils/authRole'
export { getPageForUserRole, unsupportedRoleMessage } from './utils/authRole'
export {
  AUTH_EXPIRED_EVENT_NAME,
  AUTH_PAGE_STORAGE_KEY,
  clearAuthStorage,
  getStoredAuthRole,
  saveAuthRole,
} from './utils/authStorage'
