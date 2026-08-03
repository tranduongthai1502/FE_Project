export type ListRequest<Filters extends object | null = Record<string, unknown>> = {
  sortField: string
  filters: Filters
  sortBy: 'ASC' | 'DESC'
  page: number
  size: number
}

export type PlanListRequest = ListRequest

export type TenantListRequest = PlanListRequest

export type AdminListParams<Filters extends object | null = Record<string, unknown>> = Partial<ListRequest<Filters>>
