import { useEffect } from 'react'
import { getCompactPageItems, getListTotalElements } from '@/core/utils/pagination'
import type { ActivityLog } from '../domain/tenantApi.types'
import { ACTIVITY_LOG_PAGE_SIZE } from '../domain/tenantActivityDates'

const vietnamTimeZone = 'Asia/Ho_Chi_Minh'

function formatDate(dateStr?: string, fallback = 'Oct 12, 2023') {
  if (!dateStr) return fallback

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatLogDateTime(dateStr?: string) {
  if (!dateStr) return '-'

  const normalizedValue = /(?:z|[+-]\d{2}:?\d{2})$/i.test(dateStr.trim())
    ? dateStr
    : `${dateStr.trim()}Z`
  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return dateStr

  const dateLabel = date
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: vietnamTimeZone,
      year: 'numeric',
    })
    .replace(',', ',')
  const timeLabel = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: vietnamTimeZone,
  })

  return `${dateLabel}, ${timeLabel}`
}

type UseStaffActivityLogListOptions = {
  activityError: string
  activityLogs: ActivityLog[]
  currentPage: number
  endDateFilter: string
  isLoadingActivities: boolean
  onPageChange: (page: number) => void
  pageCount: number
  startDateFilter: string
}

export function useStaffActivityLogList({
  activityError,
  activityLogs,
  currentPage,
  endDateFilter,
  isLoadingActivities,
  onPageChange,
  pageCount,
  startDateFilter,
}: UseStaffActivityLogListOptions) {
  const totalElements = getListTotalElements(activityLogs, activityLogs.length)
  const displayStart = totalElements === 0 ? 0 : (currentPage - 1) * ACTIVITY_LOG_PAGE_SIZE + 1
  const displayEnd = displayStart === 0 ? 0 : Math.min(totalElements, displayStart + activityLogs.length - 1)
  const pageItems = getCompactPageItems(currentPage, pageCount)
  const shouldShowActivityTable = isLoadingActivities || Boolean(activityError) || activityLogs.length > 0
  const startDateLabel = formatDate(startDateFilter)
  const endDateLabel = formatDate(endDateFilter)

  useEffect(() => {
    if (!isLoadingActivities && !activityError && activityLogs.length === 0 && currentPage > 1) {
      onPageChange(Math.max(1, currentPage - 1))
    }
  }, [activityError, activityLogs.length, currentPage, isLoadingActivities, onPageChange])

  return {
    displayEnd,
    displayStart,
    endDateLabel,
    formatDate,
    formatLogDateTime,
    pageItems,
    shouldShowActivityTable,
    startDateLabel,
    totalElements,
  }
}
