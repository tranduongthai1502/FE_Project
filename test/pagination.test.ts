import { describe, expect, it } from 'vitest'
import {
  attachPaginationMeta,
  getCompactPageItems,
  getListPageCount,
  getListTotalElements,
  getPaginationMeta,
} from '@/core/utils/pagination'

describe('pagination utils', () => {
  it('reads pagination meta from nested API payloads', () => {
    expect(getPaginationMeta({
      data: {
        data: {
          page: {
            total_pages: 4,
            total_elements: 39,
            first: true,
            last: false,
          },
        },
      },
    })).toEqual({
      totalPages: 4,
      totalElements: 39,
      first: true,
      last: false,
    })
  })

  it('attaches pagination meta without changing list items', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    const result = attachPaginationMeta(items, {
      pagination: {
        totalPages: 3,
        totalElements: 12,
      },
    })

    expect(result).toEqual(items)
    expect((result as typeof result & { __pagination?: unknown }).__pagination).toEqual({
      totalPages: 3,
      totalElements: 12,
    })
  })

  it('uses server total pages before local fallback', () => {
    const items = attachPaginationMeta([{ id: 'a' }], {
      page: {
        totalPages: 5,
        totalElements: 43,
      },
    })

    expect(getListPageCount(items, 2, 10)).toBe(5)
    expect(getListTotalElements(items, items.length)).toBe(43)
  })

  it('falls back to current page when server meta is absent', () => {
    expect(getListPageCount([], 3, 10)).toBe(3)
    expect(getListTotalElements([], 0)).toBe(0)
  })

  it('builds compact page items with ellipsis for large page counts', () => {
    expect(getCompactPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
  })
})
