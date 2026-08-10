export const candidateQueryKeys = {
  all: ['candidate'] as const,
  companies: () => [...candidateQueryKeys.all, 'companies'] as const,
  companyList: (params?: Record<string, unknown>) => [...candidateQueryKeys.companies(), 'list', params ?? {}] as const,
  companyDetail: (id: string) => [...candidateQueryKeys.companies(), 'detail', id] as const,
  companyJobs: (companyId: string, params?: Record<string, unknown>) => [...candidateQueryKeys.companyDetail(companyId), 'jobs', params ?? {}] as const,
  jobDetail: (id: string) => [...candidateQueryKeys.all, 'job-posting', 'detail', id] as const,
}
