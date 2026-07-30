import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildNavigation } from '@/components/common/navigation'
import { hrNav } from './hrNavigation'
import { JobRichTextEditor, RequirementsDisplay, RichTextDisplay } from './HrRichTextEditor'
import type { RoleHomeView } from '@/app/routes/route.types'
import type { DashboardStatsJobPostingResponse, JobCriteriaResponse, JobListFilters, JobPosting, JobPostingPayload, JobRevisionHistory } from '@/services/api/api.types'
import { HR_LIST_PAGE_SIZE, hrApi } from '../services/hrApi'
import { isStoredCurrentUserInactive } from '@/features/auth/utils/authAccess'
import { getErrorMessage as getAdminErrorMessage } from '@/services/error/errorMessages'
import { getListPageCount, getListTotalElements } from '@/utils/pagination'
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/currencyFormat'
import { getInitialRoleHomeView, getRoleHomeViewPath } from '@/app/routes/roleRouteHelpers'
import { AccountSettingsPanel } from '@/components/common/AccountSettingsPanel'
import { getStoredRequirePasswordChange } from '@/services/api/authStorage'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { SearchInput } from '@/components/common/SearchInput'
import { ConfirmActionModal } from '@/components/common/ConfirmActionModal'
import { DashboardShell } from '@/components/common/DashboardShell'
import styles from '../styles/HrDashboard.module.css'
import { FIELD_LENGTH_LIMITS } from '@/services/api/axiosErrorHandler'
import {
  buildJobPayloadFromPosting,
  createEmptyCriterionRow,
  criteriaCategories,
  criteriaDescriptionLimit,
  criteriaNameLimit,
  criteriaLengthExceededMessage,
  duplicateJobTitleConfirmMessage,
  emptyJobForm,
  type CriteriaFieldErrors,
  type EditableCriterion,
  type JobConfirmAction,
  type JobDetailTab,
  type JobFieldErrors,
  formatEmploymentType,
  formatJobDate,
  formatJobDateTimeInVietnam,
  formatJobStatus,
  getAiJobValidationErrors,
  getCriteriaSaveError,
  getDaysOpen,
  getDaysUntilDeadline,
  getJobActionConfirmMessage,
  getJobFieldErrorsFromApiError,
  getJobValidationErrors,
  hasDuplicateJobTitle,
  isClosedJobStatus,
  isDraftJobStatus,
  isJobPostingLimitReachedError,
  isJobTitleAlreadyExistsError,
  isOpenJobStatus,
  jobPostingLimitReachedMessage,
  jobTitleMaxLength,
  mapCriteriaResponseToRow,
  maxCriteriaCount,
  normalizeWeightInput,
  requiredJobFieldMessage,
} from '../services/hrJobLogic'
const jobFormRefreshViewKey = 'jobfusion.hr.jobFormRefreshView'
const hrJobsPath = '/hr/jobs'
const hrCreateJobPostingPath = '/hr/jobs/createjobposting'
const hrGenerateJobAiPath = '/hr/jobs/createjobposting/generatewithai'
const hrJobDetailPathPrefix = `${hrJobsPath}/`

type ToastTrigger = (message: string, type?: 'success' | 'error') => void

function JobFieldError({ message, showDefaultMessage = true }: { message?: string; showDefaultMessage?: boolean }) {
  return (
    <small className={styles.jobFieldError} aria-hidden={!message}>
      {message || (showDefaultMessage ? requiredJobFieldMessage : '')}
    </small>
  )
}

const calendarWeekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : ''
}

function formatDeadlineDisplay(value?: string) {
  const dateValue = getDateInputValue(value)
  if (!dateValue) return ''
  const [year, month, day] = dateValue.split('-')
  return year && month && day ? `${day}/${month}/${year}` : ''
}

function formatLocationDisplay(locationType?: string, location?: string) {
  const type = String(locationType || '').trim().toUpperCase()
  const resolvedType = type === 'REMOTE' ? 'Remote' : type === 'HYBRID' ? 'Hybrid' : 'Office'
  const resolvedLocation = String(location || '').trim()
  return resolvedLocation ? `${resolvedType} - ${resolvedLocation}` : resolvedType
}

function parseDeadlineInput(value: string) {
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

function getCalendarMonth(value?: string) {
  const dateValue = getDateInputValue(value)
  if (dateValue) {
    const [year, month] = dateValue.split('-').map(Number)
    if (Number.isFinite(year) && Number.isFinite(month)) return new Date(year, month - 1, 1)
  }
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), 1)
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function withDefaultApplicationDeadline(payload: JobPostingPayload): JobPostingPayload {
  if (payload.applicationDeadline.trim()) return payload

  return {
    ...payload,
    applicationDeadline: getLocalDateKey(new Date()),
  }
}

function getJobsEllipsisPageItems(currentPage: number, pageCount: number): Array<number | 'ellipsis'> {
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

function getCalendarDays(monthDate: Date) {
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

function CriteriaTrashIcon() {
  return (
    <svg width="40" height="31" viewBox="0 0 40 31" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M12.5 24.25C12.5 24.913 12.7634 25.5489 13.2322 26.0178C13.7011 26.4866 14.337 26.75 15 26.75H25C25.663 26.75 26.2989 26.4866 26.7678 26.0178C27.2366 25.5489 27.5 24.913 27.5 24.25V9.25H12.5V24.25ZM15 11.75H25V24.25H15V11.75ZM24.375 5.5L23.125 4.25H16.875L15.625 5.5H11.25V8H28.75V5.5H24.375Z" fill="#565E74" />
    </svg>
  )
}

function RevisionHistoryOpenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7.5 3H4.5C4.10218 3 3.72064 3.15804 3.43934 3.43934C3.15804 3.72064 3 4.10218 3 4.5V13.5C3 13.8978 3.15804 14.2794 3.43934 14.5607C3.72064 14.842 4.10218 15 4.5 15H13.5C13.8978 15 14.2794 14.842 14.5607 14.5607C14.842 14.2794 15 13.8978 15 13.5V10.5M9 9L15 3M11.25 3H15V6.75" stroke="#0B1C30" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RevisionHistoryUpdateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9 15.75C8.0625 15.75 7.1845 15.572 6.366 15.216C5.5475 14.86 4.835 14.3788 4.2285 13.7723C3.622 13.1658 3.14075 12.4532 2.78475 11.6347C2.42875 10.8162 2.2505 9.938 2.25 9C2.2495 8.062 2.42775 7.184 2.78475 6.366C3.14175 5.548 3.62275 4.8355 4.22775 4.2285C4.83275 3.6215 5.54525 3.14025 6.36525 2.78475C7.18525 2.42925 8.0635 2.251 9 2.25C10.025 2.25 10.997 2.46875 11.916 2.90625C12.835 3.34375 13.613 3.9625 14.25 4.7625V3.75C14.25 3.5375 14.322 3.3595 14.466 3.216C14.61 3.0725 14.788 3.0005 15 3C15.212 2.9995 15.3903 3.0715 15.5348 3.216C15.6793 3.3605 15.751 3.5385 15.75 3.75V6.75C15.75 6.9625 15.678 7.14075 15.534 7.28475C15.39 7.42875 15.212 7.5005 15 7.5H12C11.7875 7.5 11.6095 7.428 11.466 7.284C11.3225 7.14 11.2505 6.962 11.25 6.75C11.2495 6.538 11.3215 6.36 11.466 6.216C11.6105 6.072 11.7885 6 12 6H13.3125C12.8 5.3 12.1688 4.75 11.4188 4.35C10.6688 3.95 9.8625 3.75 9 3.75C7.5375 3.75 6.297 4.2595 5.2785 5.2785C4.26 6.2975 3.7505 7.538 3.75 9C3.7495 10.462 4.259 11.7027 5.2785 12.7222C6.298 13.7417 7.5385 14.251 9 14.25C10.1875 14.25 11.25 13.8938 12.1875 13.1813C13.125 12.4688 13.7438 11.55 14.0438 10.425C14.1063 10.225 14.2188 10.075 14.3813 9.975C14.5438 9.875 14.725 9.8375 14.925 9.8625C15.1375 9.8875 15.3063 9.978 15.4313 10.134C15.5563 10.29 15.5938 10.462 15.5438 10.65C15.1813 12.1375 14.3938 13.3595 13.1813 14.316C11.9688 15.2725 10.575 15.7505 9 15.75ZM9.75 8.7L11.625 10.575C11.7625 10.7125 11.8313 10.8875 11.8313 11.1C11.8313 11.3125 11.7625 11.4875 11.625 11.625C11.4875 11.7625 11.3125 11.8312 11.1 11.8312C10.8875 11.8312 10.7125 11.7625 10.575 11.625L8.475 9.525C8.4 9.45 8.34375 9.36575 8.30625 9.27225C8.26875 9.17875 8.25 9.08175 8.25 8.98125V6C8.25 5.7875 8.322 5.6095 8.466 5.466C8.61 5.3225 8.788 5.2505 9 5.25C9.212 5.2495 9.39025 5.3215 9.53475 5.466C9.67925 5.6105 9.751 5.7885 9.75 6V8.7Z" fill="#0B1C30" fillOpacity="0.8" />
    </svg>
  )
}

function RevisionHistoryCreateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M15.75 10.5V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H7.5V3.75H3.75V14.25H14.25V10.5H15.75Z" fill="#0B1C30" fillOpacity="0.7" />
      <path d="M15.75 5.25H12.75V2.25H11.25V5.25H8.25V6.75H11.25V9.75H12.75V6.75H15.75V5.25Z" fill="#0B1C30" fillOpacity="0.7" />
    </svg>
  )
}

function getRevisionHistoryIcon(action: string) {
  const normalizedAction = action.trim().toLowerCase()

  if (normalizedAction.includes('close')) return <CloseJobIcon />
  if (normalizedAction.includes('open')) return <RevisionHistoryOpenIcon />
  if (normalizedAction.includes('update') || normalizedAction.includes('edit')) return <RevisionHistoryUpdateIcon />
  if (normalizedAction.includes('create')) return <RevisionHistoryCreateIcon />

  return <RevisionHistoryUpdateIcon />
}

function formatRevisionTitle(action: string, jobTitle: string) {
  const normalizedAction = action.trim()
  const lowerAction = normalizedAction.toLowerCase()

  if (lowerAction.includes('create') && jobTitle && !lowerAction.includes(jobTitle.toLowerCase())) {
    return `${normalizedAction}: "${jobTitle}"`
  }

  return normalizedAction || 'Update Job Posting'
}

function formatRevisionMeta(actorName?: string, createdAt?: string) {
  const actorLabel = String(actorName || 'Unknown').trim().toUpperCase()
  const dateTime = formatJobDateTimeInVietnam(createdAt).replace(/, ([^,]+)$/, ' • $1')

  return `${actorLabel} • ${dateTime}`
}

function buildRevisionHistoryItems(history: JobRevisionHistory[] | undefined, jobTitle: string) {
  return (history || []).slice(0, 4).map((item, index) => ({
    id: item.id || `${item.action}-${item.createdAt || index}`,
    icon: getRevisionHistoryIcon(item.action),
    title: formatRevisionTitle(item.action, jobTitle),
    meta: formatRevisionMeta(item.actorName, item.createdAt),
  }))
}

function CriteriaAiSuggestIcon() {
  return (
    <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M6 8.38125L6.75 6.75L8.38125 6L6.75 5.25L6 3.61875L5.25 5.25L3.61875 6L5.25 6.75L6 8.38125ZM6 12L4.125 7.875L0 6L4.125 4.125L6 0L7.875 4.125L12 6L7.875 7.875L6 12ZM12 13.5L11.0625 11.4375L9 10.5L11.0625 9.5625L12 7.5L12.9375 9.5625L15 10.5L12.9375 11.4375L12 13.5Z" fill="#5B4039" />
    </svg>
  )
}

function CloseJobIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12.5001 0C13.8814 0 15.2062 0.548733 16.1829 1.52549C17.1597 2.50224 17.7084 3.827 17.7084 5.20833V8.46875C18.6023 8.69955 19.3942 9.22068 19.9598 9.95033C20.5255 10.68 20.8327 11.5768 20.8334 12.5V18.75C20.8334 19.8551 20.3944 20.9149 19.613 21.6963C18.8316 22.4777 17.7718 22.9167 16.6667 22.9167H8.33342C7.22835 22.9167 6.16854 22.4777 5.38714 21.6963C4.60573 20.9149 4.16675 19.8551 4.16675 18.75V12.5C4.16744 11.5768 4.47471 10.68 5.04033 9.95033C5.60594 9.22068 6.39786 8.69955 7.29175 8.46875V5.20833C7.29175 3.827 7.84048 2.50224 8.81723 1.52549C9.79399 0.548733 11.1187 0 12.5001 0ZM8.33342 10.4167C7.78088 10.4167 7.25098 10.6362 6.86028 11.0269C6.46957 11.4176 6.25008 11.9475 6.25008 12.5V18.75C6.25008 19.3025 6.46957 19.8324 6.86028 20.2231C7.25098 20.6138 7.78088 20.8333 8.33342 20.8333H16.6667C17.2193 20.8333 17.7492 20.6138 18.1399 20.2231C18.5306 19.8324 18.7501 19.3025 18.7501 18.75V12.5C18.7501 11.9475 18.5306 11.4176 18.1399 11.0269C17.7492 10.6362 17.2193 10.4167 16.6667 10.4167H8.33342ZM12.5001 14.0625C12.9145 14.0625 13.3119 14.2271 13.6049 14.5201C13.898 14.8132 14.0626 15.2106 14.0626 15.625C14.0626 16.0394 13.898 16.4368 13.6049 16.7299C13.3119 17.0229 12.9145 17.1875 12.5001 17.1875C12.0857 17.1875 11.6883 17.0229 11.3952 16.7299C11.1022 16.4368 10.9376 16.0394 10.9376 15.625C10.9376 15.2106 11.1022 14.8132 11.3952 14.5201C11.6883 14.2271 12.0857 14.0625 12.5001 14.0625ZM12.5001 2.08333C11.6713 2.08333 10.8764 2.41257 10.2904 2.99862C9.70432 3.58468 9.37508 4.37953 9.37508 5.20833V8.33333H15.6251V5.20833C15.6251 4.37953 15.2958 3.58468 14.7098 2.99862C14.1237 2.41257 13.3289 2.08333 12.5001 2.08333Z" fill="currentColor" />
    </svg>
  )
}

function OpenJobIcon() {
  return (
    <svg width="16" height="21" viewBox="0 0 16 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1 12C1 11.4696 1.21071 10.9609 1.58579 10.5858C1.96086 10.2107 2.46957 10 3 10H13C13.5304 10 14.0391 10.2107 14.4142 10.5858C14.7893 10.9609 15 11.4696 15 12V18C15 18.5304 14.7893 19.0391 14.4142 19.4142C14.0391 19.7893 13.5304 20 13 20H3C2.46957 20 1.96086 19.7893 1.58579 19.4142C1.21071 19.0391 1 18.5304 1 18V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10V5C4 3.93913 4.42143 2.92172 5.17157 2.17157C5.92172 1.42143 6.93913 1 8 1C9.06087 1 10.0783 1.42143 10.8284 2.17157C11.5786 2.92172 12 3.93913 12 5M7 15C7 15.2652 7.10536 15.5196 7.29289 15.7071C7.48043 15.8946 7.73478 16 8 16C8.26522 16 8.51957 15.8946 8.70711 15.7071C8.89464 15.5196 9 15.2652 9 15C9 14.7348 8.89464 14.4804 8.70711 14.2929C8.51957 14.1054 8.26522 14 8 14C7.73478 14 7.48043 14.1054 7.29289 14.2929C7.10536 14.4804 7 14.7348 7 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EditJobIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8.75 21.25V16.25L21.25 3.75L26.25 8.75L13.75 21.25H8.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.75 26.25H26.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.5 7.5L22.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function JobsEmptyLargeIcon() {
  return (
    <svg width="131" height="132" viewBox="0 0 131 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clipPath="url(#jobs-empty-large-clip)">
        <path d="M57.3125 111.375C49.0347 111.378 40.8499 109.616 33.2959 106.205C33.0936 106.099 32.8689 106.043 32.6409 106.043C32.4128 106.043 32.1882 106.099 31.9859 106.205C31.7988 106.332 31.646 106.505 31.5412 106.706C31.4364 106.908 31.3829 107.132 31.3855 107.36V118.36C31.3855 119.089 31.673 119.789 32.1848 120.304C32.6966 120.82 33.3908 121.11 34.1146 121.11H40.9375C41.2995 121.11 41.6465 121.255 41.9025 121.513C42.1584 121.771 42.3021 122.12 42.3021 122.485V129.25C42.3021 129.979 42.5897 130.679 43.1015 131.194C43.6133 131.71 44.3075 132 45.0313 132H72.323C73.0468 132 73.741 131.71 74.2528 131.194C74.7646 130.679 75.0521 129.979 75.0521 129.25V122.375C75.0521 122.01 75.1959 121.66 75.4518 121.403C75.7077 121.145 76.0548 121 76.4167 121H83.2396C83.9635 121 84.6576 120.71 85.1694 120.194C85.6813 119.679 85.9688 118.979 85.9688 118.25V106.15C85.9709 105.916 85.9113 105.686 85.7962 105.483C85.6812 105.28 85.5147 105.112 85.3138 104.995C85.1166 104.873 84.8899 104.809 84.6588 104.809C84.4277 104.809 84.201 104.873 84.0038 104.995C75.7356 109.227 66.5861 111.414 57.3125 111.375Z" fill="#E4BEB4" fillOpacity="0.4" />
        <path d="M121.775 104.17L99.2325 81.455C99.0177 81.213 98.8989 80.8997 98.8989 80.575C98.8989 80.2503 99.0177 79.937 99.2325 79.695C106.348 69.2215 109.326 56.4481 107.584 43.8775C105.841 31.3069 99.502 19.8451 89.8099 11.7378C80.1178 3.63054 67.7707 -0.537917 55.1876 0.0491832C42.6045 0.636284 30.6925 5.93663 21.7854 14.9117C12.8783 23.8868 7.61812 35.8898 7.03546 48.5689C6.45281 61.248 10.5897 73.6894 18.6356 83.4555C26.6814 93.2216 38.0564 99.6085 50.5318 101.365C63.0072 103.121 75.6838 100.12 86.0779 92.95C86.3181 92.7336 86.629 92.6139 86.9513 92.6139C87.2735 92.6139 87.5844 92.7336 87.8246 92.95L110.368 115.665C111.903 117.21 113.984 118.078 116.153 118.078C118.323 118.078 120.404 117.21 121.939 115.665C123.414 114.111 124.224 112.034 124.193 109.884C124.163 107.733 123.294 105.681 121.775 104.17ZM46.505 41.635C46.563 41.4249 46.6738 41.2335 46.8269 41.0793C46.9799 40.9251 47.1699 40.8134 47.3784 40.755C47.5543 40.6588 47.7513 40.6083 47.9515 40.6083C48.1517 40.6083 48.3487 40.6588 48.5246 40.755C53.2028 43.7099 58.6141 45.2732 64.1354 45.265C65.9669 45.2358 67.7928 45.0519 69.5938 44.715C69.67 44.6763 69.7541 44.6562 69.8394 44.6562C69.9247 44.6562 70.0088 44.6763 70.085 44.715C70.135 44.8574 70.135 45.0127 70.085 45.155C70.085 48.4371 68.7911 51.5847 66.4879 53.9055C64.1847 56.2262 61.061 57.53 57.8038 57.53C54.5466 57.53 51.4228 56.2262 49.1196 53.9055C46.8164 51.5847 45.5225 48.4371 45.5225 45.155C45.6712 43.9383 46.0024 42.7514 46.505 41.635ZM17.7396 50.93C17.7366 44.3161 19.3642 37.8051 22.476 31.9817C25.5878 26.1583 30.0864 21.2049 35.5678 17.5666C41.0492 13.9283 47.3417 11.7189 53.8801 11.1369C60.4184 10.5549 66.9978 11.6185 73.0273 14.2322C79.0568 16.846 84.3476 20.9279 88.4244 26.1114C92.5012 31.295 95.2363 37.4177 96.384 43.9297C97.5318 50.4417 97.0563 57.139 95.0002 63.42C92.9441 69.7011 89.3718 75.3691 84.6042 79.915C84.4803 80.0477 84.3257 80.1473 84.1542 80.2049C83.9828 80.2625 83.7998 80.2763 83.6217 80.245C83.4458 80.2208 83.277 80.1592 83.1265 80.0644C82.9759 79.9696 82.8471 79.8437 82.7483 79.695C79.5564 74.6489 74.9362 70.6832 69.4846 68.31C69.2539 68.1974 69.0593 68.0216 68.9232 67.8028C68.787 67.5839 68.7148 67.3308 68.7148 67.0725C68.7148 66.8142 68.787 66.5611 68.9232 66.3423C69.0593 66.1234 69.2539 65.9476 69.4846 65.835C73.9884 63.3443 77.5417 59.4144 79.5846 54.6645C81.6275 49.9146 82.0438 44.6147 80.7679 39.6002C79.492 34.5856 76.5965 30.1413 72.5376 26.9677C68.4787 23.7941 63.4871 22.0716 58.3496 22.0716C53.2121 22.0716 48.2205 23.7941 44.1616 26.9677C40.1027 30.1413 37.2072 34.5856 35.9313 39.6002C34.6554 44.6147 35.0717 49.9146 37.1146 54.6645C39.1575 59.4144 42.7108 63.3443 47.2146 65.835C47.4427 65.9528 47.6316 66.1354 47.7577 66.3603C47.8838 66.5852 47.9417 66.8423 47.9242 67.1C47.9101 67.3652 47.8201 67.6205 47.6651 67.8352C47.5102 68.0499 47.2968 68.2148 47.0508 68.31C41.1757 70.5076 36.3152 74.8175 33.405 80.41C33.3194 80.5961 33.1903 80.7583 33.0286 80.8829C32.867 81.0075 32.6777 81.0906 32.4771 81.125C32.2902 81.2173 32.0848 81.2653 31.8767 81.2653C31.6686 81.2653 31.4632 81.2173 31.2763 81.125C27.0065 77.3616 23.5885 72.7183 21.2531 67.5091C18.9178 62.2998 17.7196 56.6461 17.7396 50.93Z" fill="#E4BEB4" fillOpacity="0.4" />
      </g>
      <defs>
        <clipPath id="jobs-empty-large-clip">
          <rect width="131" height="132" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function JobsEmptySmallIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clipPath="url(#jobs-empty-small-clip)">
        <path d="M11.007 21H9.605C6.02 21 4.228 21 3.114 19.865C2 18.73 2 16.903 2 13.25C2 9.597 2 7.77 3.114 6.635C4.228 5.5 6.02 5.5 9.605 5.5H13.408C16.993 5.5 18.786 5.5 19.9 6.635C20.757 7.508 20.954 8.791 21 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 5.5L17.9 5.19C17.405 3.65 17.158 2.88 16.569 2.44C15.979 2 15.197 2 13.63 2H13.367C11.802 2 11.019 2 10.43 2.44C9.84 2.88 9.593 3.65 9.098 5.19L9 5.5M19.111 13.255C19.296 13.085 19.388 13 19.5 13C19.612 13 19.704 13.085 19.889 13.255L20.602 13.912C20.688 13.991 20.731 14.031 20.784 14.05C20.838 14.07 20.896 14.068 21.014 14.063L21.976 14.025C22.224 14.015 22.348 14.011 22.433 14.082C22.518 14.153 22.535 14.276 22.568 14.522L22.7 15.508C22.716 15.622 22.723 15.678 22.751 15.728C22.779 15.776 22.824 15.811 22.914 15.882L23.69 16.492C23.882 16.644 23.978 16.719 23.997 16.827C24.016 16.935 23.951 17.039 23.823 17.247L23.297 18.094C23.237 18.191 23.207 18.24 23.197 18.294C23.187 18.348 23.199 18.405 23.223 18.517L23.432 19.495C23.482 19.735 23.508 19.855 23.453 19.951C23.398 20.047 23.281 20.085 23.048 20.161L22.122 20.462C22.012 20.498 21.956 20.516 21.913 20.552C21.87 20.589 21.843 20.641 21.79 20.744L21.338 21.615C21.223 21.838 21.165 21.949 21.06 21.987C20.955 22.025 20.84 21.977 20.608 21.881L19.72 21.513C19.611 21.468 19.557 21.445 19.5 21.445C19.443 21.445 19.389 21.468 19.28 21.513L18.392 21.881C18.16 21.977 18.045 22.025 17.94 21.987C17.835 21.949 17.777 21.837 17.662 21.615L17.21 20.744C17.156 20.641 17.13 20.589 17.087 20.553C17.044 20.517 16.988 20.498 16.878 20.463L15.952 20.161C15.719 20.085 15.602 20.047 15.547 19.951C15.492 19.855 15.517 19.736 15.568 19.495L15.778 18.517C15.801 18.405 15.813 18.349 15.803 18.295C15.7825 18.2227 15.7486 18.1548 15.703 18.095L15.178 17.247C15.048 17.039 14.984 16.935 15.003 16.827C15.022 16.719 15.118 16.644 15.31 16.493L16.086 15.883C16.176 15.811 16.221 15.776 16.249 15.727C16.277 15.678 16.284 15.622 16.299 15.507L16.432 14.522C16.465 14.277 16.482 14.153 16.567 14.082C16.652 14.011 16.776 14.015 17.024 14.025L17.987 14.063C18.104 14.068 18.162 14.07 18.216 14.05C18.269 14.03 18.312 13.991 18.398 13.912L19.111 13.255Z" stroke="white" strokeWidth="1.5" />
      </g>
      <defs>
        <clipPath id="jobs-empty-small-clip">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function JobsEmptyState() {
  return (
    <section className={styles.jobsEmptyState}>
      <div className={styles.jobsEmptyIcon}>
        <JobsEmptyLargeIcon />
        <span><JobsEmptySmallIcon /></span>
      </div>
      <p className={styles.jobsEmptyTitle}>No job postings found</p>
      <p>Click 'Create New Job Posting' to get started.</p>
    </section>
  )
}

function getHrJobViewFromPath(pathname: string): 'list' | 'detail' | 'create' | 'edit' | 'ai' {
  if (pathname === hrGenerateJobAiPath) return 'ai'
  if (pathname === hrCreateJobPostingPath) return 'create'
  if (pathname.startsWith(hrJobDetailPathPrefix) && pathname.endsWith('/edit')) return 'edit'
  if (pathname.startsWith(hrJobDetailPathPrefix)) return 'detail'
  return 'list'
}

function getHrJobDetailPath(jobId: string) {
  return `${hrJobsPath}/${encodeURIComponent(jobId)}`
}

function getHrJobEditPath(jobId: string) {
  return `${getHrJobDetailPath(jobId)}/edit`
}

function getHrJobIdFromPath(pathname: string) {
  if (pathname === hrCreateJobPostingPath || pathname === hrGenerateJobAiPath) return ''
  if (!pathname.startsWith(hrJobDetailPathPrefix)) return ''
  return decodeURIComponent(pathname.slice(hrJobDetailPathPrefix.length).split('/')[0] || '')
}

function getHrJobDetailTabFromSearch(search: string): JobDetailTab {
  const tab = new URLSearchParams(search).get('tab')
  return tab === 'criteria' ? 'criteria' : 'overview'
}

function HrJobsView({ isActionLocked, onHome, triggerToast }: { isActionLocked: boolean; onHome: () => void; triggerToast?: ToastTrigger }) {
  const location = useLocation()
  const navigate = useNavigate()
  const deadlineInputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [jobStats, setJobStats] = useState<DashboardStatsJobPostingResponse | null>(null)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [jobListError, setJobListError] = useState('')
  const [jobPage, setJobPage] = useState(1)
  const [jobPageCount, setJobPageCount] = useState(1)
  const [jobListReloadKey, setJobListReloadKey] = useState(0)
  const [jobView, setJobView] = useState<'list' | 'detail' | 'create' | 'edit' | 'ai'>(() => getHrJobViewFromPath(location.pathname))
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [jobForm, setJobForm] = useState<JobPostingPayload>(emptyJobForm)
  const [salaryInputValues, setSalaryInputValues] = useState({ salaryMin: '', salaryMax: '' })
  const [jobFieldErrors, setJobFieldErrors] = useState<JobFieldErrors>({})
  const [isSavingJob, setIsSavingJob] = useState(false)
  const [isDeadlineCalendarOpen, setIsDeadlineCalendarOpen] = useState(false)
  const [deadlineCalendarMonth, setDeadlineCalendarMonth] = useState(() => getCalendarMonth(emptyJobForm.applicationDeadline))
  const [deadlineInputValue, setDeadlineInputValue] = useState('')
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [jobConfirmAction, setJobConfirmAction] = useState<JobConfirmAction>(null)
  const [jobConfirmTarget, setJobConfirmTarget] = useState<JobPosting | null>(null)
  const [isJobActionSubmitting, setIsJobActionSubmitting] = useState(false)
  const [pendingDuplicateTitlePayload, setPendingDuplicateTitlePayload] = useState<JobPostingPayload | null>(null)
  const [jobDetailTab, setJobDetailTab] = useState<JobDetailTab>(() => getHrJobDetailTabFromSearch(location.search))
  const [jobCriteria, setJobCriteria] = useState<JobCriteriaResponse[]>([])
  const [isEditingCriteria, setIsEditingCriteria] = useState(false)
  const [criteriaForms, setCriteriaForms] = useState<EditableCriterion[]>([])
  const [criteriaFieldErrors, setCriteriaFieldErrors] = useState<Record<string, CriteriaFieldErrors>>({})
  const [deletedCriteriaIds, setDeletedCriteriaIds] = useState<string[]>([])
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false)
  const [isSavingCriteria, setIsSavingCriteria] = useState(false)
  const [pendingCriteriaCancelAction, setPendingCriteriaCancelAction] = useState<(() => void) | null>(null)
  const activeJobCount = jobStats?.totalActivePostings ?? jobs.filter((job) => job.status.toLowerCase() === 'open' || job.status.toLowerCase() === 'active').length
  const totalApplicantCount = jobStats?.totalApplicants ?? jobs.reduce((total, job) => total + job.applicantCount, 0)
  const expiringSoonCount = jobStats?.postingsExpiringSoon ?? jobs.filter((job) => job.status.toLowerCase() === 'pending_review' || job.status.toLowerCase() === 'pending review').length
  const jobTotalElements = getListTotalElements(jobs, jobs.length)
  const safeJobPage = Math.min(jobPage, jobPageCount)
  const jobPageItems = getJobsEllipsisPageItems(safeJobPage, jobPageCount)
  const isJobFormDirty = (
    jobForm.title.trim() !== '' ||
    jobForm.department.trim() !== '' ||
    jobForm.level.trim() !== '' ||
    jobForm.employmentType.trim() !== '' ||
    jobForm.locationType !== emptyJobForm.locationType ||
    jobForm.location.trim() !== '' ||
    jobForm.applicationDeadline.trim() !== '' ||
    jobForm.description.trim() !== '' ||
    jobForm.requirements.trim() !== '' ||
    jobForm.benefits.trim() !== '' ||
    salaryInputValues.salaryMin.trim() !== '' ||
    salaryInputValues.salaryMax.trim() !== ''
  )

  useEffect(() => {
    if (jobView !== 'list') return

    let isActive = true
    hrApi.getJobPostingStats()
      .then((statsData) => {
        if (isActive && statsData) {
          setJobStats(statsData)
        }
      })
      .catch(() => {})

    return () => {
      isActive = false
    }
  }, [jobView, jobListReloadKey])

  useEffect(() => {
    if (jobView !== 'list') return

    let isActive = true
    const filters: JobListFilters = {}
    const search = searchQuery.trim()

    if (search) filters.title = search
    if (employmentTypeFilter) filters.employmentType = employmentTypeFilter
    if (statusFilter) filters.status = statusFilter

    setIsLoadingJobs(true)
    setJobListError('')

    hrApi.getJobPostings({
      sortField: 'createdAt',
      filters,
      sortBy: 'DESC',
      page: jobPage,
      size: HR_LIST_PAGE_SIZE,
    })
      .then((items) => {
        if (!isActive) return
        setJobs(items)
        setJobPageCount(getListPageCount(items, jobPage, HR_LIST_PAGE_SIZE))
      })
      .catch((error) => {
        if (!isActive) return
        setJobs([])
        setJobListError(getAdminErrorMessage(error, 'Failed to load job postings.'))
      })
      .finally(() => {
        if (isActive) setIsLoadingJobs(false)
      })

    return () => {
      isActive = false
    }
  }, [employmentTypeFilter, jobListReloadKey, jobPage, jobView, searchQuery, statusFilter])

  useEffect(() => {
    const refreshView = window.sessionStorage.getItem(jobFormRefreshViewKey)
    if (refreshView !== 'create') return

    window.sessionStorage.removeItem(jobFormRefreshViewKey)
    setJobForm(emptyJobForm)
    setDeadlineInputValue('')
    setSalaryInputValues({ salaryMin: '', salaryMax: '' })
    setJobFieldErrors({})
    setPendingDuplicateTitlePayload(null)
    setSelectedJob(null)
    setJobView('create')
    if (location.pathname !== hrCreateJobPostingPath) {
      navigate(hrCreateJobPostingPath)
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    setJobView(getHrJobViewFromPath(location.pathname))
  }, [location.pathname])

  useEffect(() => {
    if (getHrJobViewFromPath(location.pathname) !== 'detail') return
    setJobDetailTab(getHrJobDetailTabFromSearch(location.search))
  }, [location.pathname, location.search])

  useEffect(() => {
    const jobId = getHrJobIdFromPath(location.pathname)
    if (!jobId) return
    if (selectedJob?.id === jobId) return

    const nextJobView = getHrJobViewFromPath(location.pathname)
    let isActive = true
    setJobView(nextJobView)
    setJobDetailTab(getHrJobDetailTabFromSearch(location.search))
    setJobCriteria([])
    setIsEditingCriteria(false)
    setCriteriaForms([])
    setCriteriaFieldErrors({})
    setDeletedCriteriaIds([])

    hrApi.getJobPostingById(jobId)
      .then((job) => {
        if (!isActive) return
        setSelectedJob(job)
        if (nextJobView === 'edit') {
          setJobFieldErrors({})
          setPendingDuplicateTitlePayload(null)
          setIsCancelConfirmOpen(false)
          setSalaryInputValues({
            salaryMin: job.salaryMin ? formatCurrencyInput(String(job.salaryMin)) : '',
            salaryMax: job.salaryMax ? formatCurrencyInput(String(job.salaryMax)) : '',
          })
          setDeadlineInputValue(formatDeadlineDisplay(job.applicationDeadline || ''))
          setJobForm({
            title: job.title,
            department: job.department,
            level: job.level || '',
            employmentType: job.employmentType || 'FULL_TIME',
            locationType: job.locationType || 'OFFICE',
            location: job.location || '',
            applicationDeadline: job.applicationDeadline || '',
            description: job.description || '',
            requirements: job.requirements || '',
            benefits: job.benefits || '',
            salaryMin: job.salaryMin || 0,
            salaryMax: job.salaryMax || 0,
            status: job.status || 'DRAFT',
          })
        }
      })
      .catch((error) => {
        if (!isActive) return
        triggerToast?.(getAdminErrorMessage(error, 'Failed to load job posting.'), 'error')
        setSelectedJob(null)
        setJobView('list')
        navigate(hrJobsPath)
      })

    return () => {
      isActive = false
    }
  }, [location.pathname, location.search, navigate, selectedJob?.id, triggerToast])

  const updateJobDetailTab = (tab: JobDetailTab) => {
    setJobDetailTab(tab)
    if (jobView !== 'detail') return

    const search = tab === 'criteria' ? '?tab=criteria' : ''
    if (location.search !== search) {
      navigate({ pathname: location.pathname, search })
    }
  }

  useEffect(() => {
    if (jobView !== 'detail' || jobDetailTab !== 'criteria' || !selectedJob?.id) return

    let isActive = true
    setIsLoadingCriteria(true)

    hrApi.getJobCriteriaByJobId(selectedJob.id)
      .then((items) => {
        if (!isActive) return
        const nextCriteria = (Array.isArray(items) ? items : [])
          .slice()
          .sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0))
        setJobCriteria(nextCriteria)
        setIsEditingCriteria(false)
        setCriteriaForms([])
        setCriteriaFieldErrors({})
        setDeletedCriteriaIds([])
      })
      .catch(() => {
        if (!isActive) return
        setJobCriteria([])
        setIsEditingCriteria(false)
        setCriteriaForms([])
        setCriteriaFieldErrors({})
        setDeletedCriteriaIds([])
      })
      .finally(() => {
        if (isActive) setIsLoadingCriteria(false)
      })

    return () => {
      isActive = false
    }
  }, [jobDetailTab, jobView, selectedJob?.id])

  const updateHrJobsPath = (path: string) => {
    if (location.pathname !== path) {
      navigate(path)
    }
  }

  useEffect(() => {
    const shouldWarnOnRefresh = jobView === 'create' && isJobFormDirty
    if (!shouldWarnOnRefresh) return undefined

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      window.sessionStorage.setItem(jobFormRefreshViewKey, 'create')
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isJobFormDirty, jobView])

  const reloadJobCriteria = async (jobId: string) => {
    const nextCriteria = await hrApi.getJobCriteriaByJobId(jobId)
    setJobCriteria(nextCriteria.slice().sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0)))
  }
  const startEditCriteria = () => {
    if (isActionLocked || isClosedJobStatus(selectedJob?.status)) return

    setIsEditingCriteria(true)
    setCriteriaForms(jobCriteria.length > 0 ? jobCriteria.map(mapCriteriaResponseToRow) : [createEmptyCriterionRow()])
    setCriteriaFieldErrors({})
    setDeletedCriteriaIds([])
  }
  const addCriterionRow = () => {
    if (isActionLocked || isClosedJobStatus(selectedJob?.status) || criteriaForms.length >= maxCriteriaCount) return

    setCriteriaForms((currentForms) => [...currentForms, createEmptyCriterionRow()])
  }
  const updateCriterionForm = (clientId: string, field: keyof Pick<EditableCriterion, 'name' | 'description' | 'category' | 'weight'>, value: string) => {
    if (isActionLocked || isClosedJobStatus(selectedJob?.status)) return

    const limit = field === 'name' ? criteriaNameLimit : field === 'description' ? criteriaDescriptionLimit : null
    const nextValue = field === 'weight'
      ? normalizeWeightInput(value)
      : field === 'name'
        ? value.slice(0, criteriaNameLimit)
        : field === 'description'
          ? value.slice(0, criteriaDescriptionLimit)
          : value
    setCriteriaForms((currentForms) => currentForms.map((form) => (
      form.clientId === clientId ? { ...form, [field]: nextValue } : form
    )))
    setCriteriaFieldErrors((currentErrors) => {
      const formErrors = currentErrors[clientId]
      const shouldShowLengthError = limit !== null && value.length > limit
      if (shouldShowLengthError) {
        return {
          ...currentErrors,
          [clientId]: {
            ...(formErrors || {}),
            [field]: criteriaLengthExceededMessage,
          },
        }
      }
      if (!formErrors?.[field]) return currentErrors
      const { [field]: _removed, ...nextFormErrors } = formErrors
      return { ...currentErrors, [clientId]: nextFormErrors }
    })
  }
  const discardCriterionFormChanges = () => {
    setIsEditingCriteria(false)
    setCriteriaForms([])
    setCriteriaFieldErrors({})
    setDeletedCriteriaIds([])
  }
  const requestCriteriaCancel = (nextAction?: () => void) => {
    if (isSavingCriteria) return

    if (!isEditingCriteria) {
      nextAction?.()
      return
    }

    setPendingCriteriaCancelAction(() => nextAction || (() => undefined))
  }
  const cancelCriterionForm = () => {
    requestCriteriaCancel()
  }
  const confirmCriteriaCancel = () => {
    const nextAction = pendingCriteriaCancelAction
    discardCriterionFormChanges()
    setPendingCriteriaCancelAction(null)
    nextAction?.()
  }
  const removeDraftCriterion = (clientId: string) => {
    if (isSavingCriteria) return

    setCriteriaForms((currentForms) => {
      const removedForm = currentForms.find((form) => form.clientId === clientId)
      if (removedForm?.id) {
        setDeletedCriteriaIds((currentIds) => currentIds.includes(removedForm.id as string) ? currentIds : [...currentIds, removedForm.id as string])
      }
      return currentForms.filter((form) => form.clientId !== clientId)
    })
    setCriteriaFieldErrors((currentErrors) => {
      const { [clientId]: _removed, ...nextErrors } = currentErrors
      return nextErrors
    })
  }
  const getCriteriaTotalWithForm = () => {
    const savedTotal = jobCriteria.reduce((total, item) => total + (Number(item.weight) || 0), 0)
    if (isEditingCriteria && criteriaForms.length === 0) return 0
    if (criteriaForms.length === 0) return savedTotal

    const draftTotal = criteriaForms.reduce((total, form) => {
      const currentWeight = Number(normalizeWeightInput(form.weight))
      return total + (Number.isFinite(currentWeight) ? currentWeight : 0)
    }, 0)
    return draftTotal
  }
  const validateCriterionForms = () => {
    const nextErrors: Record<string, CriteriaFieldErrors> = {}
    const trimmedRows = criteriaForms.map((form) => ({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim() || criteriaCategories[0],
      weight: normalizeWeightInput(form.weight),
    }))
    const draftNameCounts = new Map<string, number>()

    trimmedRows.forEach((row) => {
      const normalizedName = row.name.toLowerCase()
      if (normalizedName) draftNameCounts.set(normalizedName, (draftNameCounts.get(normalizedName) || 0) + 1)
    })

    trimmedRows.forEach((row) => {
      const rowErrors: CriteriaFieldErrors = {}
      const numericWeight = Number(row.weight)
      const normalizedName = row.name.toLowerCase()

      if (!row.name) rowErrors.name = 'Criterion name is required.'
      if (row.name.length > criteriaNameLimit) rowErrors.name = criteriaLengthExceededMessage
      if (normalizedName && Number(draftNameCounts.get(normalizedName)) > 1) {
        rowErrors.name = 'Criterion name must be unique in this job.'
      }
      if (!criteriaCategories.includes(row.category)) rowErrors.category = 'Category is required.'
      if (!row.description) rowErrors.description = 'Description is required.'
      if (row.description.length > criteriaDescriptionLimit) rowErrors.description = criteriaLengthExceededMessage
      if (!/^\d+(\.\d)?$/.test(row.weight) || !Number.isFinite(numericWeight) || numericWeight < 1 || numericWeight > 100) {
        rowErrors.weight = 'Must be between 1 and 100.'
      }
      if (Object.keys(rowErrors).length > 0) nextErrors[row.clientId] = rowErrors
    })

    setCriteriaFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return null

    return trimmedRows
  }
  const saveCriteria = async () => {
    if (isActionLocked || isSavingCriteria || isClosedJobStatus(selectedJob?.status) || !selectedJob?.id || !isEditingCriteria) return
    const validRows = validateCriterionForms()
    if (!validRows) return
    if (validRows.length === 0) {
      triggerToast?.('Please add at least one criterion before saving.', 'error')
      return
    }

    if (Math.round(getCriteriaTotalWithForm() * 10) / 10 !== 100) {
      triggerToast?.('Total weight must equal 100% before saving.', 'error')
      return
    }

    setIsSavingCriteria(true)
    try {
      await Promise.all(deletedCriteriaIds.map((id) => hrApi.deleteJobCriteria(id)))

      await hrApi.createJobCriteria(validRows.map((row) => ({
        ...(row.id ? { id: row.id } : {}),
        jobId: selectedJob.id,
        criterionName: row.name,
        category: row.category,
        description: row.description,
        weight: Number(row.weight),
      })))
      await reloadJobCriteria(selectedJob.id)
      setIsEditingCriteria(false)
      setCriteriaForms([])
      setCriteriaFieldErrors({})
      setDeletedCriteriaIds([])
      triggerToast?.('Criteria saved successfully.', 'success')
    } catch (error) {
      triggerToast?.(getCriteriaSaveError(error), 'error')
    } finally {
      setIsSavingCriteria(false)
    }
  }
  const clearAllCriteria = async () => {
    if (isActionLocked || isSavingCriteria || isClosedJobStatus(selectedJob?.status) || !selectedJob?.id) return
    if (jobCriteria.length === 0 && criteriaForms.length === 0) return

    const idsToDelete = (isEditingCriteria ? criteriaForms : jobCriteria)
      .map((criterion) => criterion.id)
      .filter((id): id is string => Boolean(id))

    setIsEditingCriteria(true)
    setCriteriaForms([])
    setCriteriaFieldErrors({})
    setDeletedCriteriaIds((currentIds) => Array.from(new Set([...currentIds, ...idsToDelete])))
  }
  const updateJobFormField = <Field extends keyof JobPostingPayload>(field: Field, value: JobPostingPayload[Field]) => {
    const nextValue = field === 'title' && typeof value === 'string'
      ? (value.slice(0, jobTitleMaxLength) as JobPostingPayload[Field])
      : value

    setJobFieldErrors((current) => {
      if (!current[field]) return current
      const { [field]: _removed, ...nextErrors } = current
      return nextErrors
    })
    setJobForm((current) => ({ ...current, [field]: nextValue }))
  }
  const updateSalaryField = (field: 'salaryMin' | 'salaryMax', value: string) => {
    setJobFieldErrors((current) => {
      if (!current.salaryMin && !current.salaryMax) return current
      const { salaryMin: _removedMin, salaryMax: _removedMax, ...nextErrors } = current
      return nextErrors
    })
    const formattedValue = formatCurrencyInput(value)
    setSalaryInputValues((current) => ({ ...current, [field]: formattedValue }))
    setJobForm((current) => ({ ...current, [field]: formattedValue === '' ? 0 : parseCurrencyInput(formattedValue) }))
  }
  const generateAiJobContent = () => {
    if (isActionLocked) return
    const payload = withDefaultApplicationDeadline(jobForm)
    const nextErrors = getAiJobValidationErrors(payload, salaryInputValues)

    if (Object.keys(nextErrors).length > 0) {
      setJobFieldErrors(nextErrors)
      return
    }

    if (payload.applicationDeadline !== jobForm.applicationDeadline) {
      setJobForm(payload)
      setDeadlineInputValue(formatDeadlineDisplay(payload.applicationDeadline))
    }
    setJobFieldErrors({})
  }
  const getInputClassName = (hasError?: boolean) => (hasError ? styles.jobInputError : undefined)
  const toggleDeadlinePicker = () => {
    setDeadlineCalendarMonth(getCalendarMonth(jobForm.applicationDeadline))
    setIsDeadlineCalendarOpen((isOpen) => !isOpen)
  }
  const updateDeadlineInputValue = (value: string) => {
    const nextInputValue = value.slice(0, FIELD_LENGTH_LIMITS.defaultText)
    setDeadlineInputValue(nextInputValue)

    const nextDeadlineValue = parseDeadlineInput(nextInputValue)
    updateJobFormField('applicationDeadline', nextDeadlineValue)

    if (nextDeadlineValue) {
      setDeadlineCalendarMonth(getCalendarMonth(nextDeadlineValue))
    }
  }
  const selectDeadlineDate = (date: Date) => {
    const nextDeadlineValue = getLocalDateKey(date)
    setDeadlineInputValue(formatDeadlineDisplay(nextDeadlineValue))
    updateJobFormField('applicationDeadline', nextDeadlineValue)
    setDeadlineCalendarMonth(getCalendarMonth(nextDeadlineValue))
    setIsDeadlineCalendarOpen(false)
  }
  const clearDeadlineDate = () => {
    setDeadlineInputValue('')
    updateJobFormField('applicationDeadline', '')
    setIsDeadlineCalendarOpen(false)
  }
  const openCreateJob = () => {
    window.sessionStorage.removeItem(jobFormRefreshViewKey)
    setJobForm(emptyJobForm)
    setDeadlineInputValue('')
    setSalaryInputValues({ salaryMin: '', salaryMax: '' })
    setJobFieldErrors({})
    setIsCancelConfirmOpen(false)
    setSelectedJob(null)
    setJobView('create')
    updateHrJobsPath(hrCreateJobPostingPath)
  }
  const openGenerateWithAi = () => {
    setJobView('ai')
    updateHrJobsPath(hrGenerateJobAiPath)
  }
  const openCreateJobForm = () => {
    setDeadlineInputValue('')
    setJobView('create')
    updateHrJobsPath(hrCreateJobPostingPath)
  }
  const discardJobFormChanges = () => {
    window.sessionStorage.removeItem(jobFormRefreshViewKey)
    setIsCancelConfirmOpen(false)
    setJobFieldErrors({})
    setPendingDuplicateTitlePayload(null)
    setDeadlineInputValue('')
    setSalaryInputValues({ salaryMin: '', salaryMax: '' })
    setJobForm(emptyJobForm)
    if (jobView === 'edit' && selectedJob) {
      setJobView('detail')
      updateHrJobsPath(hrJobsPath)
      return
    }

    setSelectedJob(null)
    setJobView('list')
    updateHrJobsPath(hrJobsPath)
  }
  const handleCancelJobForm = () => {
    if (isJobFormDirty) {
      setIsCancelConfirmOpen(true)
      return
    }

    discardJobFormChanges()
  }
  const updateJobSearchQuery = (value: string) => {
    setSearchQuery(value)
    setJobPage(1)
  }
  const updateJobStatusFilter = (value: string) => {
    setStatusFilter(value)
    setJobPage(1)
  }
  const updateJobEmploymentTypeFilter = (value: string) => {
    setEmploymentTypeFilter(value)
    setJobPage(1)
  }
  const returnToJobsListAfterSave = () => {
    window.sessionStorage.removeItem(jobFormRefreshViewKey)
    setIsCancelConfirmOpen(false)
    setJobFieldErrors({})
    setPendingDuplicateTitlePayload(null)
    setDeadlineInputValue('')
    setSalaryInputValues({ salaryMin: '', salaryMax: '' })
    setJobForm(emptyJobForm)
    setSelectedJob(null)
    setJobView('list')
    updateHrJobsPath(hrJobsPath)
    setJobPage(1)
    setJobListReloadKey((key) => key + 1)
  }
  const openJobDetail = async (job: JobPosting) => {
    setSelectedJob(job)
    setJobDetailTab('overview')
    setJobCriteria([])
    setJobView('detail')
    updateHrJobsPath(getHrJobDetailPath(job.id))
    try {
      setSelectedJob(await hrApi.getJobPostingById(job.id))
    } catch {
      setSelectedJob(job)
    }
  }
  const openEditJob = (job: JobPosting) => {
    setSelectedJob(job)
    setJobFieldErrors({})
    setPendingDuplicateTitlePayload(null)
    setIsCancelConfirmOpen(false)
    setDeadlineInputValue(formatDeadlineDisplay(job.applicationDeadline || ''))
    setSalaryInputValues({
      salaryMin: job.salaryMin ? formatCurrencyInput(String(job.salaryMin)) : '',
      salaryMax: job.salaryMax ? formatCurrencyInput(String(job.salaryMax)) : '',
    })
    setJobForm({
      title: job.title,
      department: job.department,
      level: job.level || '',
      employmentType: job.employmentType || 'FULL_TIME',
      locationType: job.locationType || 'OFFICE',
      location: job.location || '',
      applicationDeadline: job.applicationDeadline || '',
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      salaryMin: job.salaryMin || 0,
      salaryMax: job.salaryMax || 0,
      status: job.status || 'DRAFT',
    })
    setJobView('edit')
    updateHrJobsPath(getHrJobEditPath(job.id))
  }
  const requestJobAction = (action: Exclude<JobConfirmAction, null>, job: JobPosting) => {
    if (isActionLocked || isJobActionSubmitting) return
    setJobConfirmAction(action)
    setJobConfirmTarget(job)
  }
  const closeJobConfirm = () => {
    if (isJobActionSubmitting) return
    setJobConfirmAction(null)
    setJobConfirmTarget(null)
  }
  const applyJobActionResult = (nextJob: JobPosting | null) => {
    if (!nextJob) return

    setJobs((currentJobs) => currentJobs.map((job) => (
      job.id === nextJob.id ? nextJob : job
    )))
    setSelectedJob((currentJob) => (
      currentJob?.id === nextJob.id ? nextJob : currentJob
    ))
  }
  const confirmJobAction = async () => {
    if (!jobConfirmAction || !jobConfirmTarget || isJobActionSubmitting) return

    setIsJobActionSubmitting(true)
    try {
      if (jobConfirmAction === 'delete') {
        await hrApi.deleteJobPosting(jobConfirmTarget.id)
        setJobConfirmAction(null)
        setJobConfirmTarget(null)
        setSelectedJob(null)
        setJobView('list')
        updateHrJobsPath(hrJobsPath)
        setJobPage(1)
        setJobListReloadKey((key) => key + 1)
        triggerToast?.('Job posting deleted.', 'success')
        return
      }

      const nextStatus = jobConfirmAction === 'close' ? 'CLOSED' : 'OPEN'
      await hrApi.updateJobPosting(jobConfirmTarget.id, buildJobPayloadFromPosting(jobConfirmTarget, nextStatus))
      const nextJob = { ...jobConfirmTarget, status: nextStatus }
      applyJobActionResult(nextJob)
      setJobConfirmAction(null)
      setJobConfirmTarget(null)
      setJobListReloadKey((key) => key + 1)
      triggerToast?.(
        jobConfirmAction === 'close'
          ? 'Job posting closed successfully.'
          : isDraftJobStatus(jobConfirmTarget.status)
            ? 'Job posting opened successfully.'
            : 'Job posting reopened successfully.',
        'success',
      )
    } catch (error) {
      triggerToast?.(getAdminErrorMessage(error, 'Error system. Please try again.'), 'error')
    } finally {
      setIsJobActionSubmitting(false)
    }
  }
  const saveJob = async (payload: JobPostingPayload = jobForm, options: { allowDuplicateTitle?: boolean } = {}) => {
    if (isActionLocked || isSavingJob) return
    const payloadWithDeadline = withDefaultApplicationDeadline(payload)
    const nextErrors = getJobValidationErrors(payloadWithDeadline, salaryInputValues)

    if (Object.keys(nextErrors).length > 0) {
      setJobFieldErrors(nextErrors)
      return
    }

    if (!options.allowDuplicateTitle && hasDuplicateJobTitle(payloadWithDeadline, jobs, selectedJob?.id)) {
      setJobFieldErrors({})
      setPendingDuplicateTitlePayload(payloadWithDeadline)
      return
    }

    if (payloadWithDeadline.applicationDeadline !== payload.applicationDeadline) {
      setJobForm(payloadWithDeadline)
      setDeadlineInputValue(formatDeadlineDisplay(payloadWithDeadline.applicationDeadline))
    }
    setJobFieldErrors({})
    setPendingDuplicateTitlePayload(null)
    setIsSavingJob(true)
    const isEditingJob = jobView === 'edit' && selectedJob

    try {
      if (isEditingJob) {
        await hrApi.updateJobPosting(selectedJob.id, payloadWithDeadline)
      } else {
        await hrApi.createJobPosting(payloadWithDeadline)
      }
      returnToJobsListAfterSave()
      triggerToast?.(isEditingJob ? 'Job posting updated successfully.' : 'Job posting created successfully.', 'success')
    } catch (error) {
      const apiFieldErrors = getJobFieldErrorsFromApiError(error)

      if (isJobTitleAlreadyExistsError(error)) {
        setPendingDuplicateTitlePayload(payload)
      } else if (!isEditingJob && isJobPostingLimitReachedError(error)) {
        triggerToast?.(jobPostingLimitReachedMessage, 'error')
      } else if (Object.keys(apiFieldErrors).length > 0) {
        setJobFieldErrors(apiFieldErrors)
        triggerToast?.('Please check the highlighted fields.', 'error')
      } else {
        triggerToast?.(getAdminErrorMessage(error, 'Error system. Please try again.'), 'error')
      }
    } finally {
      setIsSavingJob(false)
    }
  }

  if (jobView === 'detail' && selectedJob) {
    const selectedJobIsDraft = isDraftJobStatus(selectedJob.status)
    const selectedJobIsClosed = isClosedJobStatus(selectedJob.status)
    const selectedJobIsOpen = isOpenJobStatus(selectedJob.status)
    const daysUntilDeadline = getDaysUntilDeadline(selectedJob.applicationDeadline)
    const totalCriteriaWeight = jobCriteria.reduce((total, item) => total + (Number(item.weight) || 0), 0)
    const normalizedCriteriaWeight = Math.round(totalCriteriaWeight * 10) / 10
    const isCriteriaReadOnly = selectedJobIsClosed || isActionLocked || isSavingCriteria
    const projectedCriteriaWeight = Math.round(getCriteriaTotalWithForm() * 10) / 10
    const isCriterionSaveDisabled = isCriteriaReadOnly || !isEditingCriteria || criteriaForms.length === 0 || projectedCriteriaWeight !== 100
    const jobStatusStat = selectedJobIsClosed
      ? { label: '', value: 'CLOSED', helper: 'Position Filled' }
      : selectedJobIsDraft
        ? { label: '', value: 'NOT YET PUBLISH', helper: '' }
        : { label: 'Days Open', value: String(getDaysOpen(selectedJob.createdAt)), helper: daysUntilDeadline === null ? 'No deadline' : `Exp: ${daysUntilDeadline} days left` }
    const revisionHistoryItems = buildRevisionHistoryItems(selectedJob.revisionHistory, selectedJob.title)

    return (
      <div className={`role-content ${styles.jobsContent}`}>
        <Breadcrumb items={[
          { label: 'Home', onClick: () => requestCriteriaCancel(onHome) },
          { label: 'Jobs', onClick: () => requestCriteriaCancel(() => { setJobView('list'); updateHrJobsPath(hrJobsPath) }) },
          { label: 'Job Detail', onClick: () => requestCriteriaCancel(() => setJobDetailTab('overview')) },
          ...(jobDetailTab === 'criteria' ? [{ label: 'Job Criteria Setup' }] : []),
        ]} />
        <div className={styles.jobsHeader}>
          <h1>{selectedJob.title} <em className={`${styles.jobStatusBadge} ${selectedJob.status.toLowerCase()}`}>{formatJobStatus(selectedJob.status)}</em></h1>
          {jobDetailTab === 'overview' && (
            <div>
              <button type="button" className={styles.secondaryJobButton} disabled={isActionLocked || isJobActionSubmitting} onClick={() => requestJobAction('delete', selectedJob)}>Delete</button>
              {(selectedJobIsDraft || selectedJobIsClosed) && (
                <button type="button" className={styles.secondaryJobButton} disabled={isActionLocked || isJobActionSubmitting} onClick={() => requestJobAction('open', selectedJob)}>Open</button>
              )}
              {selectedJobIsOpen && (
                <button type="button" className={styles.secondaryJobButton} disabled={isActionLocked || isJobActionSubmitting} onClick={() => requestJobAction('close', selectedJob)}>Close</button>
              )}
              <button type="button" disabled={isActionLocked || isJobActionSubmitting} onClick={() => openEditJob(selectedJob)}>Edit</button>
            </div>
          )}
        </div>
        <div className={styles.jobDetailTabs}>
          <button type="button" className={jobDetailTab === 'overview' ? styles.activeJobDetailTab : undefined} onClick={() => requestCriteriaCancel(() => updateJobDetailTab('overview'))}>Job Overview</button>
          <button type="button" className={jobDetailTab === 'criteria' ? styles.activeJobDetailTab : undefined} onClick={() => requestCriteriaCancel(() => updateJobDetailTab('criteria'))}>Criteria Set</button>
        </div>
        {jobDetailTab === 'overview' ? (
          <section className={styles.jobDetailGrid}>
            <div className={styles.jobDetailMain}>
              <article className={styles.jobGeneralInfoCard}>
                <h2>General Information</h2>
                <div className={styles.jobGeneralInfoGrid}>
                  <div>
                    <strong>Department</strong>
                    <span>{selectedJob.department || 'N/A'}</span>
                  </div>
                  <div>
                    <strong>Employment type</strong>
                    <span>{formatEmploymentType(selectedJob.employmentType)}</span>
                  </div>
                  <div>
                    <strong>Location</strong>
                    <span>{formatLocationDisplay(selectedJob.locationType, selectedJob.location)}</span>
                  </div>
                  <div>
                    <strong>Application Deadline</strong>
                    <span>{formatJobDate(selectedJob.applicationDeadline) || 'N/A'}</span>
                  </div>
                  <div>
                    <strong>Salary Range</strong>
                    <span>
                      {selectedJob.salaryMin || selectedJob.salaryMax
                        ? `$${formatCurrencyInput(String(selectedJob.salaryMin || 0))} - $${formatCurrencyInput(String(selectedJob.salaryMax || 0))}`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </article>
              <article className={styles.jobDetailCard}>
                <h2>Technical Overview</h2>
                <strong>Job Description</strong>
                <RichTextDisplay value={selectedJob.description} fallback="No description provided." />
                <strong>Key Requirements</strong>
                <RequirementsDisplay value={selectedJob.requirements} fallback="No requirements provided." />
                <div className={styles.jobBenefitsBox}>
                  <strong>Company Benefits</strong>
                  <RichTextDisplay value={selectedJob.benefits} fallback="No benefits provided." />
                </div>
              </article>
              {!selectedJobIsDraft && (
                <article className={styles.recentActivityCard}>
                  <header><strong>Recent Applicants</strong><button type="button">View All Candidates</button></header>
                  <section><span>KS</span><div><strong>Kasper Schmidt</strong><small>Applied 2 hours ago - 98% Match</small></div><i className="fa-solid fa-ellipsis-vertical"></i></section>
                  <section><span>ML</span><div><strong>Maria Lopez</strong><small>Applied 5 hours ago - 92% Match</small></div><i className="fa-solid fa-ellipsis-vertical"></i></section>
                </article>
              )}
            </div>
            <aside className={styles.jobSidePanel}>
              <div className={styles.jobStatsRow}>
                <section><small>Applicants</small><strong>{selectedJob.applicantCount}</strong><span>+0 this week</span></section>
                <section>
                  {jobStatusStat.label && <small>{jobStatusStat.label}</small>}
                  <strong className={!selectedJobIsOpen ? styles.jobStatusStatValue : undefined}>{jobStatusStat.value}</strong>
                  {jobStatusStat.helper && <span>{jobStatusStat.helper}</span>}
                </section>
              </div>
              {!selectedJobIsDraft && (
                <section className={styles.funnelHealthCard}>
                  <h3><i className="fa-solid fa-square-poll-vertical"></i> Funnel Health</h3>
                  <label><span>Candidate Fit Quality</span><b>High (84%)</b></label>
                  <div><span style={{ width: '84%' }}></span></div>
                  <label><span>Sourcing Velocity</span><b>Medium (62%)</b></label>
                  <div><span style={{ width: '62%' }}></span></div>
                </section>
              )}
              <section className={styles.revisionHistoryCard}>
                <h3>Revision History</h3>
                <div className={styles.revisionHistoryList}>
                  {revisionHistoryItems.length > 0 ? (
                    revisionHistoryItems.map((item) => (
                      <div className={styles.revisionHistoryItem} key={item.id}>
                        <span className={styles.revisionHistoryIcon}>{item.icon}</span>
                        <div className={styles.revisionHistoryText}>
                          <strong>{item.title}</strong>
                          <small>{item.meta}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <small>No revision history yet.</small>
                  )}
                </div>
              </section>
            </aside>
          </section>
        ) : (
          <section className={styles.criteriaSetup}>
            <article className={styles.criteriaTableCard}>
              <header>
                <span>Evaluation Criteria</span>
              </header>
              <div className={`${styles.criteriaTableRow} ${styles.criteriaTableHead} ${!isEditingCriteria ? styles.criteriaTableRowNoAction : ''}`}>
                <span>Criterion Name</span><span>Description</span><span>Category</span><span>Weightage (%)</span>{isEditingCriteria && <span>Actions</span>}
              </div>
              {isLoadingCriteria ? (
                <div className={styles.criteriaSkeletonTable}>
                  {Array.from({ length: 4 }).map((_, index) => <span key={index}></span>)}
                </div>
              ) : !isEditingCriteria && jobCriteria.length > 0 ? (
                jobCriteria.map((item) => (
                  <div className={`${styles.criteriaTableRow} ${styles.criteriaTableRowNoAction} ${styles.criteriaEditableRow}`} key={item.id} onClick={startEditCriteria} role="button" tabIndex={0} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') startEditCriteria()
                  }}>
                    <span>{item.name}</span>
                    <span>{item.description || '-'}</span>
                    <span>{item.category || '-'}</span>
                    <span>{item.weight ?? 0}%</span>
                  </div>
                ))
              ) : null}
              {criteriaForms.map((form) => {
                const rowErrors = criteriaFieldErrors[form.clientId] || {}

                return (
                  <div className={styles.criteriaFormRow} key={form.clientId}>
                  <label>
                    <span>Criterion Name *</span>
                    <input value={form.name} disabled={isCriteriaReadOnly} onChange={(event) => updateCriterionForm(form.clientId, 'name', event.target.value)} placeholder="System Architecture" />
                    <small aria-hidden={!rowErrors.name}>{rowErrors.name || 'Criterion name error'}</small>
                  </label>
                  <label>
                    <span>Description *</span>
                    <textarea value={form.description} disabled={isCriteriaReadOnly} onChange={(event) => updateCriterionForm(form.clientId, 'description', event.target.value)} placeholder="Describe what this criterion evaluates" />
                    <small aria-hidden={!rowErrors.description}>{rowErrors.description || 'Description error'}</small>
                  </label>
                  <label>
                    <span>Category</span>
                    <select value={form.category || criteriaCategories[0]} disabled={isCriteriaReadOnly} onChange={(event) => updateCriterionForm(form.clientId, 'category', event.target.value)}>
                      {criteriaCategories.map((category) => <option value={category} key={category}>{category}</option>)}
                    </select>
                    <small aria-hidden={!rowErrors.category}>{rowErrors.category || 'Category error'}</small>
                  </label>
                  <label>
                    <span>Weight</span>
                    <input value={form.weight} inputMode="decimal" disabled={isCriteriaReadOnly} onChange={(event) => updateCriterionForm(form.clientId, 'weight', event.target.value)} placeholder="40" />
                    <small aria-hidden={!rowErrors.weight}>{rowErrors.weight || 'Weight error'}</small>
                  </label>
                  <span className={styles.criteriaRowActions}>
                    <button type="button" className={styles.criteriaDeleteButton} disabled={isCriteriaReadOnly} onClick={() => removeDraftCriterion(form.clientId)} aria-label="Remove draft criterion">
                      <CriteriaTrashIcon />
                    </button>
                  </span>
                </div>
                )
              })}
              {!isLoadingCriteria && ((isEditingCriteria && criteriaForms.length === 0) || (!isEditingCriteria && jobCriteria.length === 0)) && (
                <div className={styles.criteriaTableState}>
                  No criteria yet. Add at least one criterion or use Auto-suggest with AI
                </div>
              )}
              <footer title={isEditingCriteria && projectedCriteriaWeight !== 100 ? 'Total weight must equal 100% before candidates are evaluated.' : undefined}>
                <div>
                  {isEditingCriteria ? (
                    <button type="button" disabled={isCriteriaReadOnly || criteriaForms.length >= maxCriteriaCount} onClick={addCriterionRow}>+ Add Criterion</button>
                  ) : (
                    <button type="button" disabled={isCriteriaReadOnly} onClick={startEditCriteria}>Edit Criterion</button>
                  )}
                  <button type="button" disabled={isCriteriaReadOnly} onClick={isEditingCriteria ? addCriterionRow : startEditCriteria}><CriteriaAiSuggestIcon /> Re-suggest with AI</button>
                  {isEditingCriteria && (
                    <button type="button" disabled={isCriteriaReadOnly || criteriaForms.length === 0} onClick={clearAllCriteria}>Clear All</button>
                  )}
                </div>
                <strong className={(isEditingCriteria ? projectedCriteriaWeight : normalizedCriteriaWeight) === 100 ? styles.criteriaWeightComplete : styles.criteriaWeightInvalid}>
                  Total Weightage: <span>{isEditingCriteria ? projectedCriteriaWeight : normalizedCriteriaWeight}%</span>
                </strong>
              </footer>
              {(isEditingCriteria ? projectedCriteriaWeight !== 100 && criteriaForms.length > 0 : normalizedCriteriaWeight !== 100 && jobCriteria.length > 0) && (
                <p className={styles.criteriaTableError}>All criteria must have a total weight of 100%.</p>
              )}
            </article>
            {isEditingCriteria && (
              <div className={styles.criteriaSaveBar}>
                <button type="button" disabled={isSavingCriteria} onClick={cancelCriterionForm}>Cancel</button>
                <button type="button" disabled={isCriterionSaveDisabled} onClick={saveCriteria}>{isSavingCriteria ? 'Saving...' : 'Save Criteria'}</button>
              </div>
            )}
          </section>
        )}
        {pendingCriteriaCancelAction !== null && (
          <ConfirmActionModal
            isSubmitting={isSavingCriteria}
            title="Confirm Action"
            message="Are you sure you want to cancel? Your changes will not be saved."
            cancelLabel="Cancel"
            confirmLabel="Confirm"
            onCancel={() => setPendingCriteriaCancelAction(null)}
            onConfirm={confirmCriteriaCancel}
          />
        )}
        {jobConfirmAction && jobConfirmTarget && (
          <ConfirmActionModal
            isSubmitting={isJobActionSubmitting}
            title="Confirm Action"
            message={getJobActionConfirmMessage(jobConfirmAction, jobConfirmTarget)}
            cancelLabel="Cancel"
            confirmLabel="Confirm"
            onCancel={closeJobConfirm}
            onConfirm={confirmJobAction}
          />
        )}
      </div>
    )
  }

  if (jobView === 'ai') {
    return (
      <div className={`role-content ${styles.jobsContent}`}>
        <Breadcrumb items={[
          { label: 'Home', onClick: onHome },
          { label: 'Jobs', onClick: () => { setJobView('list'); updateHrJobsPath(hrJobsPath) } },
          { label: 'Create New Job Posting', onClick: openCreateJobForm },
          { label: 'Generate with AI' },
        ]} />
        <div className={styles.aiJobTitle}>
          <h1>Create New Job Description</h1>
          <p>Provide the core details and let our AI engine craft the perfect job description for you.</p>
        </div>

        <section className={styles.aiJobLayout}>
          <form className={`${styles.jobForm} ${styles.aiJobForm}`} noValidate>
            <section className={styles.aiJobInputPanel}>
              <label className={styles.fullField}>
                <span>Job Title <b>*</b></span>
                <input className={getInputClassName(Boolean(jobFieldErrors.title))} value={jobForm.title} maxLength={jobTitleMaxLength} onChange={(e) => updateJobFormField('title', e.target.value)} placeholder="e.g. Senior Product Designer" />
                <JobFieldError message={jobFieldErrors.title} />
              </label>
              <label className={styles.aiDepartmentField}>
                <span>Department <b>*</b></span>
                <select className={getInputClassName(Boolean(jobFieldErrors.department))} value={jobForm.department} onChange={(e) => updateJobFormField('department', e.target.value)}><option value="">Select department type</option><option value="Engineering">Engineering</option><option value="Design">Design</option><option value="Marketing">Marketing</option><option value="Operations">Operations</option><option value="Data">Data</option></select>
                <JobFieldError message={jobFieldErrors.department} />
              </label>
              <div className={styles.aiLocationField}>
                <span>Location <b>*</b></span>
                <div className={styles.aiLocationControls}>
                  <div>
                    <select className={getInputClassName(Boolean(jobFieldErrors.locationType))} value={jobForm.locationType} onChange={(e) => updateJobFormField('locationType', e.target.value)}><option value="OFFICE">Office</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option></select>
                    <JobFieldError message={jobFieldErrors.locationType} />
                  </div>
                  <div>
                    <div className={styles.iconInput}>
                      <svg width="16" height="28" viewBox="0 0 16 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="#565E74" />
                      </svg>
                      <input className={getInputClassName(Boolean(jobFieldErrors.location))} value={jobForm.location} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => updateJobFormField('location', e.target.value)} placeholder="e.g. San Francisco, CA" />
                    </div>
                    <JobFieldError message={jobFieldErrors.location} />
                  </div>
                </div>
              </div>
              <label>
                <span>Application Deadline</span>
                <input className={getInputClassName(Boolean(jobFieldErrors.applicationDeadline))} type="text" value={jobForm.applicationDeadline ? jobForm.applicationDeadline.slice(0, 10) : ''} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => updateJobFormField('applicationDeadline', e.target.value)} placeholder="mm/dd/yyyy" />
                <JobFieldError message={jobFieldErrors.applicationDeadline} />
              </label>
              <div className={styles.aiSalaryField}>
                <span>Salary Range (Optional)</span>
                <div className={styles.aiSalaryControls}>
                  <div className={styles.salaryInputSlot}>
                    <div className={`${styles.moneyInput} ${jobFieldErrors.salaryMin ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Minimum salary" type="text" inputMode="decimal" value={salaryInputValues.salaryMin} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => updateSalaryField('salaryMin', e.target.value)} placeholder="0" /></div>
                    <JobFieldError message={jobFieldErrors.salaryMin} />
                  </div>
                  <div className={styles.salaryInputSlot}>
                    <div className={`${styles.moneyInput} ${jobFieldErrors.salaryMax ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Maximum salary" type="text" inputMode="decimal" value={salaryInputValues.salaryMax} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => updateSalaryField('salaryMax', e.target.value)} placeholder="0" /></div>
                    <JobFieldError message={jobFieldErrors.salaryMax} />
                  </div>
                </div>
              </div>
              <label className={`${styles.fullField} ${styles.aiTextAreaField}`}>
                <span>Key Skills <b>*</b></span>
                <textarea className={getInputClassName(Boolean(jobFieldErrors.requirements))} value={jobForm.requirements} maxLength={FIELD_LENGTH_LIMITS.jobDescription} onChange={(e) => updateJobFormField('requirements', e.target.value)} placeholder="Add skill..." />
                <JobFieldError message={jobFieldErrors.requirements} />
              </label>
              <button type="button" disabled={isActionLocked} onClick={generateAiJobContent}>Generate Content</button>
            </section>
          </form>

          <aside className={styles.aiDraftPanel}>
            <header>
              <span>AI Content Draft</span>
              <button type="button" aria-label="Copy AI content draft">
                <i className="fa-regular fa-copy"></i>
              </button>
            </header>
            <div className={styles.aiDraftBody}></div>
            <footer>
              <div className={styles.aiTokenUsage}>
                <span>Token Usage</span>
                <strong>2 Generations Left</strong>
                <div><span></span></div>
              </div>
              <div className={styles.aiDraftActions}>
                <button type="button">Regenerate</button>
                <button type="button">Discard Draft</button>
              </div>
              <button type="button" className={styles.aiApproveButton}>Approve &amp; Save Job</button>
            </footer>
          </aside>
        </section>
      </div>
    )
  }

  if (jobView === 'create' || jobView === 'edit') {
    return (
      <div className={`role-content ${styles.jobsContent}`}>
        <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Jobs', onClick: () => { setJobView('list'); updateHrJobsPath(hrJobsPath) } }, { label: jobView === 'edit' ? 'Edit Job Posting' : 'Create New Job Posting' }]} />
        <div className={styles.jobsHeader}>
          <div>
            <h1>{jobView === 'edit' ? 'Edit Job Posting' : 'Create New Job Posting'}</h1>
            {jobView === 'edit' && <p>Manage and update the details of your active talent acquisition campaign.</p>}
          </div>
          <button type="button" className={styles.aiJobButton} disabled={isActionLocked} onClick={openGenerateWithAi}>Generate with AI</button>
        </div>
        <form className={styles.jobForm} onSubmit={(event) => { event.preventDefault(); saveJob() }} noValidate>
          <div className={styles.jobFormMain}>
            <section className={styles.jobFormPanel}>
              <h2>General Information</h2>
              <div className={styles.jobFieldGrid}>
                <label className={styles.fullField}>
                  <span>Job Title <b>*</b></span>
                  <input
                    maxLength={jobTitleMaxLength}
                    className={getInputClassName(Boolean(jobFieldErrors.title))}
                    value={jobForm.title}
                    onChange={(e) => updateJobFormField('title', e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    required
                  />
                  <JobFieldError message={jobFieldErrors.title} />
                </label>
                <label>
                  <span>Department <b>*</b></span>
                  <select className={getInputClassName(Boolean(jobFieldErrors.department))} value={jobForm.department} onChange={(e) => updateJobFormField('department', e.target.value)} required><option value="">Select department type</option><option value="Engineering">Engineering</option><option value="Design">Design</option><option value="Marketing">Marketing</option><option value="Operations">Operations</option><option value="Data">Data</option></select>
                  <JobFieldError message={jobFieldErrors.department} />
                </label>
                <label>
                  <span>Employment Type <b>*</b></span>
                  <select className={getInputClassName(Boolean(jobFieldErrors.employmentType))} value={jobForm.employmentType} onChange={(e) => updateJobFormField('employmentType', e.target.value)} required><option value="">Select employment type</option><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="INTERNSHIP">Internship</option></select>
                  <JobFieldError message={jobFieldErrors.employmentType} />
                </label>
                <div className={styles.locationRow}>
                  <span>Location <b>*</b></span>
                  <div className={styles.locationControls}>
                    <select value={jobForm.locationType} onChange={(e) => updateJobFormField('locationType', e.target.value)}><option value="OFFICE">Office</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option></select>
                    <div>
                      <div className={styles.iconInput}>
                        <svg width="16" height="28" viewBox="0 0 16 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="#565E74" />
                        </svg>
                        <input className={getInputClassName(Boolean(jobFieldErrors.location))} value={jobForm.location} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => updateJobFormField('location', e.target.value)} placeholder="e.g. San Francisco, CA" />
                      </div>
                      <JobFieldError message={jobFieldErrors.location} />
                    </div>
                  </div>
                </div>
                <label className={styles.deadlineField}>
                  <span>Application Deadline</span>
                  <div className={`${styles.iconInput} ${styles.deadlinePickerShell}`}>
                    <button type="button" className={styles.datePickerButton} onClick={toggleDeadlinePicker} aria-label="Open application deadline calendar">
                      <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V0H5V2H13V0H15V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6ZM2 6V4V6Z" fill="#565E74" />
                      </svg>
                    </button>
                    <input
                      ref={deadlineInputRef}
                      className={getInputClassName(Boolean(jobFieldErrors.applicationDeadline))}
                      type="text"
                      value={deadlineInputValue}
                      maxLength={FIELD_LENGTH_LIMITS.defaultText}
                      onFocus={() => setDeadlineCalendarMonth(getCalendarMonth(jobForm.applicationDeadline))}
                      onChange={(event) => updateDeadlineInputValue(event.target.value)}
                      placeholder="dd/mm/yyyy"
                    />
                    {isDeadlineCalendarOpen && (
                      <div className={styles.deadlineCalendar}>
                        <header>
                          <button type="button" onClick={() => setDeadlineCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
                          <strong>{deadlineCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
                          <button type="button" onClick={() => setDeadlineCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Next month">›</button>
                        </header>
                        <div className={styles.deadlineCalendarWeekdays}>
                          {calendarWeekdays.map((day) => <span key={day}>{day}</span>)}
                        </div>
                        <div className={styles.deadlineCalendarGrid}>
                          {getCalendarDays(deadlineCalendarMonth).map((date) => {
                            const dateKey = getLocalDateKey(date)
                            const isSelected = dateKey === getDateInputValue(jobForm.applicationDeadline)
                            const isToday = dateKey === getLocalDateKey(new Date())
                            const isOutsideMonth = date.getMonth() !== deadlineCalendarMonth.getMonth()

                            return (
                              <button type="button" className={`${isSelected ? styles.selectedCalendarDay : ''} ${isToday ? styles.todayCalendarDay : ''} ${isOutsideMonth ? styles.outsideCalendarDay : ''}`} key={dateKey} onClick={() => selectDeadlineDate(date)}>
                                {date.getDate()}
                              </button>
                            )
                          })}
                        </div>
                        <footer>
                          <button type="button" onClick={clearDeadlineDate}>Clear</button>
                          <button type="button" onClick={() => selectDeadlineDate(new Date())}>Today</button>
                        </footer>
                      </div>
                    )}
                  </div>
                  <JobFieldError message={jobFieldErrors.applicationDeadline} />
                </label>
                <div className={styles.salaryRangeRow}>
                  <span>Salary Range</span>
                  <div className={styles.salaryRangeControls}>
                    <div className={styles.salaryInputSlot}>
                      <div className={`${styles.moneyInput} ${jobFieldErrors.salaryMin ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Minimum salary" type="text" inputMode="decimal" value={salaryInputValues.salaryMin} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => updateSalaryField('salaryMin', e.target.value)} /></div>
                      <JobFieldError message={jobFieldErrors.salaryMin} />
                    </div>
                    <small className={styles.salaryRangeDivider}>To</small>
                    <div className={styles.salaryInputSlot}>
                      <div className={`${styles.moneyInput} ${jobFieldErrors.salaryMax ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Maximum salary" type="text" inputMode="decimal" value={salaryInputValues.salaryMax} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => updateSalaryField('salaryMax', e.target.value)} /></div>
                      <JobFieldError message={jobFieldErrors.salaryMax} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.jobFormPanel}>
              <div className={styles.richTextField}><span>Job Description <b>*</b></span>
                <JobRichTextEditor hasError={Boolean(jobFieldErrors.description)} value={jobForm.description} onChange={(value) => updateJobFormField('description', value)} placeholder="Enter job summary and context..." />
                <JobFieldError message={jobFieldErrors.description} />
              </div>
            </section>
          </div>

          <aside className={styles.jobFormAside}>
            <section className={styles.jobFormPanel}>
              <div className={styles.richTextField}><span>Requirements <b>*</b></span>
                <JobRichTextEditor hasError={Boolean(jobFieldErrors.requirements)} value={jobForm.requirements} onChange={(value) => updateJobFormField('requirements', value)} placeholder="List technical and soft skills required..." />
                <JobFieldError message={jobFieldErrors.requirements} />
              </div>
            </section>
            <section className={styles.jobFormPanel}>
              <div className={styles.richTextField}><span>Benefits</span>
                <JobRichTextEditor hasError={Boolean(jobFieldErrors.benefits)} value={jobForm.benefits} onChange={(value) => updateJobFormField('benefits', value)} placeholder="Enter company benefits and perks..." />
                <JobFieldError message={jobFieldErrors.benefits} showDefaultMessage={false} />
              </div>
            </section>
            <footer>
              <button type="button" onClick={handleCancelJobForm} disabled={isSavingJob}>Cancel</button>
              {jobView === 'create' && (
                <button type="button" disabled={isActionLocked || isSavingJob} onClick={() => saveJob({ ...jobForm, status: 'DRAFT' })}>Save as Draft</button>
              )}
              <button type="submit" disabled={isActionLocked || isSavingJob}>{isSavingJob ? 'Saving...' : (jobView === 'edit' ? 'Save Change' : 'Save')}</button>
            </footer>
          </aside>
        </form>
        {isCancelConfirmOpen && (
          <ConfirmActionModal
            isSubmitting={isSavingJob}
            title="Confirm Action"
            message="Are you sure you want to cancel? Your changes will not be saved."
            cancelLabel="Cancel"
            confirmLabel="Confirm"
            onCancel={() => setIsCancelConfirmOpen(false)}
            onConfirm={discardJobFormChanges}
          />
        )}
        {pendingDuplicateTitlePayload && (
          <ConfirmActionModal
            isSubmitting={isSavingJob}
            title="Confirm Action"
            message={duplicateJobTitleConfirmMessage}
            cancelLabel="Cancel"
            confirmLabel="Confirm"
            onCancel={() => setPendingDuplicateTitlePayload(null)}
            onConfirm={() => saveJob(pendingDuplicateTitlePayload, { allowDuplicateTitle: true })}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`role-content ${styles.jobsContent}`}>
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Jobs' }]} />

      <div className={styles.jobsHeader}>
        <h1>Job Postings</h1>
        <div className={styles.jobPostingHeaderActions}>
          <button type="button" disabled={isActionLocked} onClick={openCreateJob}>Create New Job Posting</button>
        </div>
      </div>

      <div className={styles.jobsMetrics}>
        <section>
          <small>Total Active Postings</small>
          <strong>{isLoadingJobs ? '...' : activeJobCount}</strong>
          <span>
            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM8 4H12V2H8V4Z" fill="#AD2B00" />
            </svg>
          </span>
        </section>
        <section>
          <small>Total Applicants</small>
          <strong>{isLoadingJobs ? '...' : totalApplicantCount.toLocaleString()}</strong>
          <span>
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M0 12V10.425C0 9.70833 0.366667 9.125 1.1 8.675C1.83333 8.225 2.8 8 4 8C4.21667 8 4.425 8.00417 4.625 8.0125C4.825 8.02083 5.01667 8.04167 5.2 8.075C4.96667 8.425 4.79167 8.79167 4.675 9.175C4.55833 9.55833 4.5 9.95833 4.5 10.375V12H0ZM6 12V10.375C6 9.84167 6.14583 9.35417 6.4375 8.9125C6.72917 8.47083 7.14167 8.08333 7.675 7.75C8.20833 7.41667 8.84583 7.16667 9.5875 7C10.3292 6.83333 11.1333 6.75 12 6.75C12.8833 6.75 13.6958 6.83333 14.4375 7C15.1792 7.16667 15.8167 7.41667 16.35 7.75C16.8833 8.08333 17.2917 8.47083 17.575 8.9125C17.8583 9.35417 18 9.84167 18 10.375V12H6ZM19.5 12V10.375C19.5 9.94167 19.4458 9.53333 19.3375 9.15C19.2292 8.76667 19.0667 8.40833 18.85 8.075C19.0333 8.04167 19.2208 8.02083 19.4125 8.0125C19.6042 8.00417 19.8 8 20 8C21.2 8 22.1667 8.22083 22.9 8.6625C23.6333 9.10417 24 9.69167 24 10.425V12H19.5ZM4 7C3.45 7 2.97917 6.80417 2.5875 6.4125C2.19583 6.02083 2 5.55 2 5C2 4.43333 2.19583 3.95833 2.5875 3.575C2.97917 3.19167 3.45 3 4 3C4.56667 3 5.04167 3.19167 5.425 3.575C5.80833 3.95833 6 4.43333 6 5C6 5.55 5.80833 6.02083 5.425 6.4125C5.04167 6.80417 4.56667 7 4 7ZM20 7C19.45 7 18.9792 6.80417 18.5875 6.4125C18.1958 6.02083 18 5.55 18 5C18 4.43333 18.1958 3.95833 18.5875 3.575C18.9792 3.19167 19.45 3 20 3C20.5667 3 21.0417 3.19167 21.425 3.575C21.8083 3.95833 22 4.43333 22 5C22 5.55 21.8083 6.02083 21.425 6.4125C21.0417 6.80417 20.5667 7 20 7ZM12 6C11.1667 6 10.4583 5.70833 9.875 5.125C9.29167 4.54167 9 3.83333 9 3C9 2.15 9.29167 1.4375 9.875 0.8625C10.4583 0.2875 11.1667 0 12 0C12.85 0 13.5625 0.2875 14.1375 0.8625C14.7125 1.4375 15 2.15 15 3C15 3.83333 14.7125 4.54167 14.1375 5.125C13.5625 5.70833 12.85 6 12 6Z" fill="#A73921" />
            </svg>
          </span>
        </section>
        <section>
          <small>POSTINGS EXPIRING SOON</small>
          <strong>{isLoadingJobs ? '...' : expiringSoonCount}</strong>
          <span>
            <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5.95 2V0H11.95V2H5.95ZM6.95 13.75L5.85 11.55C5.76667 11.3667 5.64167 11.2292 5.475 11.1375C5.30833 11.0458 5.13333 11 4.95 11H0C0.25 8.75 1.225 6.85417 2.925 5.3125C4.625 3.77083 6.63333 3 8.95 3C9.98333 3 10.975 3.16667 11.925 3.5C12.875 3.83333 13.7667 4.31667 14.6 4.95L16 3.55L17.4 4.95L16 6.35C16.5333 7.05 16.9583 7.7875 17.275 8.5625C17.5917 9.3375 17.8 10.15 17.9 11H13.575L11.85 7.55C11.6667 7.16667 11.3667 6.975 10.95 6.975C10.5333 6.975 10.2333 7.16667 10.05 7.55L6.95 13.75ZM8.95 21C6.63333 21 4.625 20.2292 2.925 18.6875C1.225 17.1458 0.25 15.25 0 13H4.325L6.05 16.45C6.23333 16.8333 6.53333 17.025 6.95 17.025C7.36667 17.025 7.66667 16.8333 7.85 16.45L10.95 10.25L12.05 12.45C12.1333 12.6333 12.2583 12.7708 12.425 12.8625C12.5917 12.9542 12.7667 13 12.95 13H17.9C17.65 15.25 16.675 17.1458 14.975 18.6875C13.275 20.2292 11.2667 21 8.95 21Z" fill="#545C72" />
            </svg>
          </span>
        </section>
      </div>

      <div className={styles.jobsToolbar}>
        <SearchInput
          className={styles.jobsSearch}
          value={searchQuery}
          onChange={(event) => updateJobSearchQuery(event.target.value)}
          placeholder="Search job title..."
          ariaLabel="Job posting search"
        />
        <label>
          <span>Status:</span>
          <select value={statusFilter} onChange={(event) => updateJobStatusFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <label>
          <span>Employment type:</span>
          <select value={employmentTypeFilter} onChange={(event) => updateJobEmploymentTypeFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </label>
      </div>

      {isLoadingJobs ? (
        <div className={styles.jobsTableState}>Loading job postings...</div>
      ) : jobListError ? (
        <JobsEmptyState />
      ) : jobs.length === 0 ? (
        <JobsEmptyState />
      ) : (
        <section className={styles.jobsTableCard}>
          <div className={`${styles.jobsTableRow} ${styles.jobsTableHead}`}>
            <span>Job Title</span>
            <span>Department</span>
            <span>Employment Type</span>
            <span>Status</span>
            <span>No. of Applicants</span>
            <span>Date Created</span>
            <span>Actions</span>
          </div>
          {jobs.map((job) => {
            const jobIsDraft = isDraftJobStatus(job.status)
            const jobIsClosed = isClosedJobStatus(job.status)
            const jobIsOpen = isOpenJobStatus(job.status)

            return (
              <article className={styles.jobsTableRow} key={job.id} onClick={() => openJobDetail(job)}>
                <span className="table-name-tooltip" data-tooltip={job.title} title={job.title} tabIndex={0}>
                  <strong>{job.title}</strong>
                </span>
                <span title={job.department}>{job.department}</span>
                <span>{formatEmploymentType(job.employmentType)}</span>
                <em className={job.status.toLowerCase()}>{formatJobStatus(job.status)}</em>
                <span>{job.applicantCount}</span>
                <span>{formatJobDate(job.createdAt)}</span>
                <div className={styles.jobsActions}>
                  <button type="button" className="icon-tooltip" data-tooltip="Edit" aria-label={`Edit ${job.title}`} disabled={isActionLocked} onClick={(event) => { event.stopPropagation(); openEditJob(job) }}><EditJobIcon /></button>
                  {(jobIsDraft || jobIsClosed) && (
                    <button type="button" className="icon-tooltip" data-tooltip="Open" aria-label={`Open ${job.title}`} disabled={isActionLocked} onClick={(event) => { event.stopPropagation(); requestJobAction('open', job) }}><OpenJobIcon /></button>
                  )}
                  {jobIsOpen && (
                    <button type="button" className="icon-tooltip" data-tooltip="Close" aria-label={`Close ${job.title}`} disabled={isActionLocked} onClick={(event) => { event.stopPropagation(); requestJobAction('close', job) }}><CloseJobIcon /></button>
                  )}
                </div>
              </article>
            )
          })}
          <footer>
            <span>Showing {jobs.length} of {jobTotalElements} entries</span>
            <div>
              <button type="button" className={`icon-tooltip ${styles.paginationIconButton}`} data-tooltip="Previous page" disabled={safeJobPage === 1} onClick={() => setJobPage((page) => Math.max(1, page - 1))}><i className="fa-solid fa-chevron-left"></i></button>
              {jobPageItems.map((item, index) => (
                item === 'ellipsis' ? (
                  <span className={styles.paginationEllipsis} key={`job-ellipsis-${index}`}>...</span>
                ) : (
                  <button type="button" className={item === safeJobPage ? styles.activePage : ''} onClick={() => setJobPage(item)} key={item}>{item}</button>
                )
              ))}
              <button type="button" className={`icon-tooltip ${styles.paginationIconButton}`} data-tooltip="Next page" disabled={safeJobPage === jobPageCount} onClick={() => setJobPage((page) => Math.min(jobPageCount, page + 1))}><i className="fa-solid fa-chevron-right"></i></button>
            </div>
          </footer>
        </section>
      )}
      {jobConfirmAction && jobConfirmTarget && (
        <ConfirmActionModal
          isSubmitting={isJobActionSubmitting}
          title="Confirm Action"
          message={getJobActionConfirmMessage(jobConfirmAction, jobConfirmTarget)}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={closeJobConfirm}
          onConfirm={confirmJobAction}
        />
      )}
    </div>
  )
}

export function HrDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isPasswordChangeRequired] = useState(() => getStoredRequirePasswordChange())
  const [activeView, setActiveView] = useState<RoleHomeView>(() => (
    getStoredRequirePasswordChange() ? 'settings' : getInitialRoleHomeView('hr', location.pathname)
  ))
  const [viewResetKeys, setViewResetKeys] = useState<Record<RoleHomeView, number>>({
    dashboard: 0,
    jobs: 0,
    settings: 0,
  })
  const selectView = (view: RoleHomeView) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(getRoleHomeViewPath('hr', 'settings'))
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setActiveView(view)
    navigate(getRoleHomeViewPath('hr', view))
  }
  const reloadViewFromSidebar = (view: RoleHomeView) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(getRoleHomeViewPath('hr', 'settings'))
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setActiveView(view)
    navigate(getRoleHomeViewPath('hr', view))
    if (view === 'jobs') {
      window.sessionStorage.removeItem(jobFormRefreshViewKey)
    }
    setViewResetKeys((current) => ({
      ...current,
      [view]: current[view] + 1,
    }))
  }
  const navItems = buildNavigation(hrNav, activeView, reloadViewFromSidebar).map((item) => (
    isPasswordChangeRequired && item.label !== 'Settings'
      ? {
          ...item,
          onClick: () => {
            setActiveView('settings')
            navigate(getRoleHomeViewPath('hr', 'settings'))
            triggerToast?.('Please change your password before using this workspace.', 'error')
          },
        }
      : item
  ))
  const isActionLocked = isStoredCurrentUserInactive()

  useEffect(() => {
    if (isPasswordChangeRequired) {
      setActiveView('settings')
      if (location.pathname !== getRoleHomeViewPath('hr', 'settings')) {
        navigate(getRoleHomeViewPath('hr', 'settings'), { replace: true })
      }
      return
    }

    setActiveView(getInitialRoleHomeView('hr', location.pathname))
  }, [isPasswordChangeRequired, location.pathname, navigate])

  return (
    <DashboardShell navItems={navItems} subtitle="HR" onLogout={onLogout} onChangePassword={() => selectView('settings')}>
      {activeView === 'settings' ? (
        <AccountSettingsPanel
          key={viewResetKeys.settings}
          isPasswordChangeRequired={isPasswordChangeRequired}
          onBack={() => selectView('dashboard')}
          triggerToast={triggerToast}
        />
      ) : activeView === 'jobs' ? (
        <HrJobsView key={viewResetKeys.jobs} isActionLocked={isActionLocked} onHome={() => selectView('dashboard')} triggerToast={triggerToast} />
      ) : (
      <div key={viewResetKeys.dashboard} className={`role-content ${styles.content}`}>
        <div className={`role-title-row ${styles.title}`}>
          <div>
            <h1>Welcome back, Alex</h1>
            <p>Here&apos;s what&apos;s happening with your recruitment funnel today.</p>
          </div>
          <div>
            <button type="button" disabled={isActionLocked}>Download Reports</button>
            <button type="button" disabled={isActionLocked}>View Schedule</button>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          {[
            ['fa-user-group', 'Total Candidates', '2,842', '+12%', 'fa-arrow-trend-up'],
            ['fa-briefcase', 'Active Jobs', '48', 'Stable', ''],
            ['fa-bolt', 'AI-Scored Top Talents', '156', 'AI Enhanced', ''],
            ['fa-stopwatch', 'Avg. Time to Hire', '18 days', '-4 days', 'fa-arrow-trend-down'],
          ].map(([icon, label, value, note, noteIcon]) => (
            <section className={styles.kpiCard} key={label}>
              <span><i className={`fa-solid ${icon}`}></i></span>
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{note}{noteIcon && <i className={`fa-solid ${noteIcon}`}></i>}</em>
            </section>
          ))}
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardColumn}>
            <section className={`role-panel ${styles.activityPanel}`}>
              <div className="role-panel-head">
                <h2>Recent Activity</h2>
                <a href="#activity">View All</a>
              </div>
              <article>
                <i className="fa-solid fa-headset"></i>
                <div><strong>AI parsed 50 CVs for Senior React Developer role.</strong><small>2 minutes ago - Automated</small></div>
                <span>Match 92%</span>
              </article>
              <article>
                <i className="fa-solid fa-user-plus"></i>
                <div><strong>New application from Sarah Chen for UX Lead.</strong><small>45 minutes ago - LinkedIn Import</small></div>
                <b></b>
              </article>
              <article className={styles.urgent}>
                <i className="fa-solid fa-exclamation"></i>
                <div><strong>URGENT: Interview with Marcus V. is starting in 15 mins.</strong><small>In progress - AI Interviewer Ready</small></div>
                <button type="button" disabled={isActionLocked}>Join</button>
              </article>
              <article>
                <i className="fa-regular fa-circle-check"></i>
                <div><strong>Job Posting &quot;Cloud Architect&quot; successfully published.</strong><small>2 hours ago - Manual</small></div>
              </article>
            </section>

            <section className={`role-panel ${styles.pipelinePanel}`}>
              <h2>Pipeline Health</h2>
              <div className={styles.pipelineTrack}><span></span><span></span><span></span><span></span></div>
              <footer><span>Sourced (450)</span><span>Screened (120)</span><span>Interview (24)</span><span>Offer (4)</span></footer>
            </section>
          </div>

          <div className={styles.dashboardColumn}>
            <section className={`role-panel ${styles.quickPanel}`}>
              <h2>Quick Actions</h2>
              <div>
                <button type="button" disabled={isActionLocked}><i className="fa-regular fa-file-lines"></i> Parse Resume</button>
                <button type="button" disabled={isActionLocked}><i className="fa-regular fa-envelope"></i> Blast Email</button>
                <button type="button" disabled={isActionLocked}><i className="fa-solid fa-video"></i> AI Screening</button>
                <button type="button" disabled={isActionLocked}><i className="fa-solid fa-share-nodes"></i> Social Share</button>
              </div>
            </section>

            <section className={`role-panel ${styles.topPicks}`}>
              <div className="role-panel-head">
                <h2>Top Picks</h2>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19ZM8 14.15L9 12L11.15 11L9 10L8 7.85L7 10L4.85 11L7 12L8 14.15Z" fill="#AD2B00" />
                </svg>
              </div>
              {[
                ['JD', 'Jordan Day', 'DevOps Engineer', '98%'],
                ['ML', 'Maria Lopez', 'Data Scientist', '95%'],
                ['BK', 'Ben King', 'Product Lead', '89%'],
              ].map(([initials, name, title, score]) => (
                <article key={name}>
                  <span>{initials}</span>
                  <div>
                    <span className="table-name-tooltip" data-tooltip={name} title={name} tabIndex={0}>
                      <strong>{name}</strong>
                    </span>
                    <span className="table-name-tooltip" data-tooltip={title} title={title} tabIndex={0}>
                      <small>{title}</small>
                    </span>
                  </div>
                  <em>{score}</em>
                </article>
              ))}
            </section>
          </div>
        </div>
      </div>
      )}
    </DashboardShell>
  )
}
