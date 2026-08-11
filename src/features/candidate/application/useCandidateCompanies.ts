import { useQuery } from '@tanstack/react-query'

import { candidateCompanyApi, type CandidateCompanyListParams } from '../infrastructure/candidateCompanyApi'
import { candidateJobPostingApi } from '../infrastructure/candidateJobPostingApi'
import { candidateQueryKeys } from './candidateQueryKeys'
import { hrApi } from '@/features/hr/infrastructure/hrApi'

export function useCandidateCompanies(params?: CandidateCompanyListParams) {
  return useQuery({
    queryKey: candidateQueryKeys.companyList(params),
    queryFn: () => candidateCompanyApi.getCompanies(params),
  })
}

export function useCandidateCompanyDetail(id: string | undefined) {
  return useQuery({
    queryKey: candidateQueryKeys.companyDetail(id ?? ''),
    queryFn: () => candidateCompanyApi.getCompanyById(id!),
    enabled: Boolean(id),
  })
}

export function useCandidateCompanyJobs(companyId: string | undefined, params?: { page?: number; size?: number }) {
  const requestParams = {
    page: params?.page ?? 1,
    size: params?.size ?? 6,
    sortField: 'createdAt',
    sortBy: 'DESC' as const,
    filters: companyId
      ? {
        status: 'OPEN',
        tenantId: companyId,
      }
      : { status: 'OPEN' },
  }

  return useQuery({
    queryKey: candidateQueryKeys.companyJobs(companyId ?? '', requestParams),
    queryFn: () => candidateJobPostingApi.getCompanyJobs(requestParams),
    enabled: Boolean(companyId),
  })
}

export function useCandidateJobDetail(id: string | undefined) {
  return useQuery({
    queryKey: candidateQueryKeys.jobDetail(id ?? ''),
    queryFn: () => hrApi.getJobPostingById(id!),
    enabled: Boolean(id),
  })
}
