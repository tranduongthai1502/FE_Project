import axiosClient from '@/core/api/axiosClient'
import { attachPaginationMeta } from '@/core/utils/pagination'
import { getTenantList, normalizeTenant } from '@/features/admin/infrastructure/adminMappers'
import type { Tenant } from '@/features/admin/domain/adminApi.types'

export type CandidateCompanyListParams = {
  page?: number
  size?: number
  filters?: Record<string, unknown>
  sortField?: string
  sortBy?: 'ASC' | 'DESC'
}

export const candidateCompanyApi = {
  async getCompanies(params?: CandidateCompanyListParams) {
    const request = {
      sortField: params?.sortField ?? 'companyName',
      filters: params?.filters ?? {},
      sortBy: params?.sortBy ?? 'ASC',
      page: Math.max(1, params?.page ?? 1),
      size: params?.size ?? 9,
    }

    const response = await axiosClient.post('/api/tenant/list', request)

    return attachPaginationMeta(getTenantList(response)
      .map(normalizeTenant)
      .filter((tenant): tenant is Tenant => Boolean(tenant)), response)
  },

  async getCompanyById(id: string) {
    const response = await axiosClient.get(`/api/tenant/${encodeURIComponent(id)}`)
    const tenant = normalizeTenant(response?.data?.data ?? response?.data ?? response)

    if (!tenant) {
      throw new Error('Company detail not found')
    }

    return tenant
  },
}
