import { adminApi } from './adminApi'
import { jobApi } from './jobApi'
import { tenantAdminApi } from './tenantAdminApi'

export { ADMIN_LIST_PAGE_SIZE } from './roleRequests'

export { adminApi, jobApi, tenantAdminApi }

export const roleApi = {
  ...adminApi,
  ...tenantAdminApi,
  ...jobApi,
}
