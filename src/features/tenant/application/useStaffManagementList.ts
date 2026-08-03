import { useEffect } from 'react'
import { getListTotalElements } from '@/core/utils/pagination'
import type { StaffMember } from '../domain/tenantApi.types'
import { TENANT_ADMIN_LIST_PAGE_SIZE } from '../infrastructure/tenantAdminApi'

type UseStaffManagementListOptions = {
  currentPage: number
  error: string
  isLoading: boolean
  isStaffQuotaUnlimited?: boolean
  maxStaffQuota: number
  onPageChange: (page: number) => void
  staffAccountCount: number
  staffList: StaffMember[]
}

export function useStaffManagementList({
  currentPage,
  error,
  isLoading,
  isStaffQuotaUnlimited = false,
  maxStaffQuota,
  onPageChange,
  staffAccountCount,
  staffList,
}: UseStaffManagementListOptions) {
  const totalElements = getListTotalElements(staffList, staffList.length)
  const displayStart = totalElements === 0 ? 0 : (currentPage - 1) * TENANT_ADMIN_LIST_PAGE_SIZE + 1
  const displayEnd = displayStart === 0 ? 0 : Math.min(totalElements, displayStart + staffList.length - 1)
  const quotaPercent = Math.min(100, Math.round((staffAccountCount / Math.max(maxStaffQuota, 1)) * 100))
  const hasReachedStaffQuota = !isStaffQuotaUnlimited && staffAccountCount >= maxStaffQuota

  useEffect(() => {
    if (!isLoading && !error && staffList.length === 0 && currentPage > 1) {
      onPageChange(Math.max(1, currentPage - 1))
    }
  }, [currentPage, error, isLoading, onPageChange, staffList.length])

  return {
    displayEnd,
    displayStart,
    hasReachedStaffQuota,
    quotaPercent,
    totalElements,
  }
}
