export type PaginationMeta = {
  totalPages?: number
  totalElements?: number
  last?: boolean
  first?: boolean
}

export function getPaginationMeta(payload: any): PaginationMeta {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.page,
    payload?.data?.page,
    payload?.data?.data?.page,
    payload?.pagination,
    payload?.data?.pagination,
    payload?.data?.data?.pagination,
  ].filter(Boolean)

  for (const candidate of candidates) {
    const totalPages = Number(candidate.totalPages ?? candidate.total_pages ?? candidate.pageCount ?? candidate.totalPage)
    const totalElements = Number(candidate.totalElements ?? candidate.total_elements ?? candidate.totalItems ?? candidate.total)
    const last = typeof candidate.last === 'boolean' ? candidate.last : undefined
    const first = typeof candidate.first === 'boolean' ? candidate.first : undefined

    if (!Number.isNaN(totalPages) || !Number.isNaN(totalElements) || last !== undefined || first !== undefined) {
      return {
        totalPages: Number.isNaN(totalPages) ? undefined : totalPages,
        totalElements: Number.isNaN(totalElements) ? undefined : totalElements,
        last,
        first,
      }
    }
  }

  return {}
}

export function attachPaginationMeta<T>(items: T[], payload: any): T[] {
  return Object.assign(items, { __pagination: getPaginationMeta(payload) })
}

export function getListPageCount(items: unknown[], currentPage: number, pageSize: number) {
  const meta = (items as { __pagination?: PaginationMeta }).__pagination

  if (meta?.totalPages !== undefined) {
    return Math.max(1, meta.totalPages)
  }

  if (meta?.totalElements !== undefined) {
    return Math.max(1, Math.ceil(meta.totalElements / pageSize))
  }

  return Math.max(1, currentPage)
}

export function getListTotalElements(items: unknown[], fallbackTotal: number) {
  const meta = (items as { __pagination?: PaginationMeta }).__pagination
  return meta?.totalElements ?? fallbackTotal
}

export function getCompactPageItems(currentPage: number, pageCount: number): Array<number | 'ellipsis'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, pageCount, currentPage - 1, currentPage, currentPage + 1])

  if (currentPage <= 3) {
    pages.add(2)
    pages.add(3)
  }

  if (currentPage >= pageCount - 2) {
    pages.add(pageCount - 2)
    pages.add(pageCount - 1)
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right)

  return sortedPages.reduce<Array<number | 'ellipsis'>>((items, page, index) => {
    const previousPage = sortedPages[index - 1]

    if (previousPage !== undefined && page - previousPage > 1) {
      items.push('ellipsis')
    }

    items.push(page)
    return items
  }, [])
}
