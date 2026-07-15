export type AppRole = 'candidate' | 'tenantAdmin' | 'superAdmin' | 'hr' | 'interviewer'

export const unsupportedRoleMessage = 'This role is not supported in the current frontend.'

const backendRoleConstants = {
  superAdmin: 'Super Admin',
  tenantAdmin: 'Tenant Admin',
  hr: 'HR',
  interviewer: 'Interviewer',
  candidate: 'Candidate',
}

const pageByBackendRole: Record<string, AppRole> = {
  [normalizeRole(backendRoleConstants.superAdmin)]: 'superAdmin',
  [normalizeRole(backendRoleConstants.tenantAdmin)]: 'tenantAdmin',
  [normalizeRole(backendRoleConstants.hr)]: 'hr',
  [normalizeRole(backendRoleConstants.interviewer)]: 'interviewer',
  [normalizeRole(backendRoleConstants.candidate)]: 'candidate',
}

const legacyRolePages: Record<string, AppRole> = {
  tenantadmin: 'tenantAdmin',
  admin: 'tenantAdmin',
  superadmin: 'superAdmin',
  recruiter: 'hr',
  tenant_hr: 'hr',
  tenant_recruiter: 'hr',
}

export function getPageForUserRole(userRole: string): AppRole | null {
  const normalizedRoles = getNormalizedRoles(userRole)
  const rolePriority = ['super_admin', 'tenant_admin', 'hr', 'interviewer', 'candidate']

  for (const role of rolePriority) {
    if (normalizedRoles.includes(role)) {
      return pageByBackendRole[role] || legacyRolePages[role] || null
    }
  }

  for (const role of normalizedRoles) {
    const page = pageByBackendRole[role] || legacyRolePages[role]
    if (page) return page
  }

  return null
}

function normalizeRole(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/^role_/, '')
}

function getNormalizedRoles(value: string) {
  return value
    .split(/[,;/|]+/)
    .map((role) => normalizeRole(role))
    .filter(Boolean)
}
