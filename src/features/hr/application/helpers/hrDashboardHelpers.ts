import type { JobPostingPayload, JobRevisionHistory } from '../../domain/hrApi.types'
import type { JobDetailTab } from '../../infrastructure/hrJobLogic'
import { formatJobDateTimeInVietnam } from '../../infrastructure/hrJobLogic'
import { hrCreateJobPostingPath, hrGenerateJobAiPath, hrJobDetailPathPrefix, hrJobsPath } from '../../domain/hrRoutePaths'

export const calendarWeekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function getDateInputValue(value?: string): string {
  return value ? value.slice(0, 10) : ''
}

export function formatDeadlineDisplay(value?: string): string {
  const dateValue = getDateInputValue(value)
  if (!dateValue) return ''
  const [year, month, day] = dateValue.split('-')
  return year && month && day ? `${day}/${month}/${year}` : ''
}

export function formatLocationDisplay(locationType?: string, location?: string): string {
  const type = String(locationType || '').trim().toUpperCase()
  const resolvedType = type === 'REMOTE' ? 'Remote' : type === 'HYBRID' ? 'Hybrid' : 'Office'
  const resolvedLocation = String(location || '').trim()
  return resolvedLocation ? `${resolvedType} - ${resolvedLocation}` : resolvedType
}

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDeadlineInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return ''

  const [, dayValue, monthValue, yearValue] = match
  const day = Number(dayValue)
  const month = Number(monthValue)
  const year = Number(yearValue)
  const date = new Date(year, month - 1, day)

  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return ''
  }

  return getLocalDateKey(date)
}

export function getCalendarMonth(value?: string): Date {
  const dateValue = getDateInputValue(value)
  if (dateValue) {
    const [year, month] = dateValue.split('-').map(Number)
    if (Number.isFinite(year) && Number.isFinite(month)) return new Date(year, month - 1, 1)
  }
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), 1)
}

export function withDefaultApplicationDeadline(payload: JobPostingPayload): JobPostingPayload {
  if (payload.applicationDeadline.trim()) return payload

  return {
    ...payload,
    applicationDeadline: getLocalDateKey(new Date()),
  }
}

export function getJobsEllipsisPageItems(currentPage: number, pageCount: number): Array<number | 'ellipsis'> {
  if (pageCount <= 4) {
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

export function getCalendarDays(monthDate: Date): Date[] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(year, month, 1 - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    return date
  })
}

export function formatRevisionTitle(action: string, jobTitle: string): string {
  const normalizedAction = action.trim()
  const lowerAction = normalizedAction.toLowerCase()

  if (lowerAction.includes('create') && jobTitle && !lowerAction.includes(jobTitle.toLowerCase())) {
    return `${normalizedAction}: "${jobTitle}"`
  }

  return normalizedAction || 'Update Job Posting'
}

export function formatRevisionMeta(actorName?: string, createdAt?: string): string {
  const actorLabel = String(actorName || 'Unknown').trim().toUpperCase()
  const dateTime = formatJobDateTimeInVietnam(createdAt).replace(/, ([^,]+)$/, ' • $1')

  return `${actorLabel} • ${dateTime}`
}

export function getHrJobViewFromPath(pathname: string): 'list' | 'detail' | 'create' | 'edit' | 'ai' {
  if (pathname === hrGenerateJobAiPath) return 'ai'
  if (pathname === hrCreateJobPostingPath) return 'create'
  if (pathname.startsWith(hrJobDetailPathPrefix) && pathname.endsWith('/edit')) return 'edit'
  if (pathname.startsWith(hrJobDetailPathPrefix)) return 'detail'
  return 'list'
}

export function getHrJobDetailPath(jobId: string): string {
  return `${hrJobsPath}/${encodeURIComponent(jobId)}`
}

export function getHrJobEditPath(jobId: string): string {
  return `${getHrJobDetailPath(jobId)}/edit`
}

export function getHrJobIdFromPath(pathname: string): string {
  if (pathname === hrCreateJobPostingPath || pathname === hrGenerateJobAiPath) return ''
  if (!pathname.startsWith(hrJobDetailPathPrefix)) return ''
  return decodeURIComponent(pathname.slice(hrJobDetailPathPrefix.length).split('/')[0] || '')
}

export function getHrJobDetailTabFromSearch(search: string): JobDetailTab {
  const tab = new URLSearchParams(search).get('tab')
  if (tab === 'criteria') return 'criteria'
  if (tab === 'application') return 'application'
  return 'overview'
}
