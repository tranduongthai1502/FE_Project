import { useEffect, useState } from 'react'
import { getRoleHomeNav, hrNav } from '../../data/adminNavigation'
import type { JobPosting, JobPostingPayload, RoleHomeView } from '../../types/admin.types'
import { ADMIN_LIST_PAGE_SIZE, adminApi } from '../../services/adminApi'
import { isStoredCurrentUserInactive } from '../../utils/adminAccess'
import { getAdminErrorMessage } from '../../utils/adminErrors'
import { getListPageCount } from '../../utils/adminMappers'
import { getInitialRoleHomeView, updateRoleHomeViewUrl } from '../../utils/adminRouteHelpers'
import { hasMultipleStaffWorkspaces, switchStaffWorkspace } from '../../utils/staffWorkspace'
import { AccountSettingsView } from '../shared/AccountSettingsView'
import { AdminBreadcrumb } from '../shared/AdminBreadcrumb'
import { AdminSearchInput } from '../shared/AdminSearchInput'
import { ConfirmActionModal } from '../shared/ConfirmActionModal'
import { DashboardShell } from '../shared/DashboardShell'
import styles from './HrDashboard.module.css'

const requiredJobFieldMessage = 'Please fill in all required fields.'
const departmentRequiredMessage = 'Please select department type.'
const employmentTypeRequiredMessage = 'Please select employment type.'
const duplicateJobTitleMessage = 'A job posting with this title already exists.'
const salaryPairMessage = 'Please enter both minimum and maximum salary or leave both empty.'
const salaryOrderMessage = 'Maximum salary must be greater than or equal to minimum salary.'
const salaryPositiveMessage = 'Salary must be a positive number.'
const deadlineFutureMessage = 'Application deadline must be today or a future date.'
const jobFormRefreshViewKey = 'jobfusion.hr.jobFormRefreshView'
const hrJobsPath = '/hr/jobs'
const hrCreateJobPostingPath = '/hr/jobs/createjobposting'
const hrGenerateJobAiPath = '/hr/jobs/createjobposting/generatewithai'

type JobFieldErrors = Partial<Record<keyof JobPostingPayload, string>>

const emptyJobForm: JobPostingPayload = {
  title: '',
  department: '',
  level: '',
  employmentType: '',
  locationType: 'OFFICE',
  location: '',
  applicationDeadline: '',
  description: '',
  requirements: '',
  benefits: '',
  salaryMin: 0,
  salaryMax: 0,
  status: 'DRAFT',
}

function JobFieldError({ message }: { message?: string }) {
  return (
    <small className={styles.jobFieldError} aria-hidden={!message}>
      {message || requiredJobFieldMessage}
    </small>
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

function getInitialHrJobView(): 'list' | 'detail' | 'create' | 'edit' | 'ai' {
  if (window.location.pathname === hrGenerateJobAiPath) return 'ai'
  return window.location.pathname === hrCreateJobPostingPath ? 'create' : 'list'
}

function updateHrJobsPath(path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path)
  }
}

function HrJobsView({ isActionLocked, onHome }: { isActionLocked: boolean; onHome: () => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [jobListError, setJobListError] = useState('')
  const [jobPage, setJobPage] = useState(1)
  const [jobPageCount, setJobPageCount] = useState(1)
  const [jobView, setJobView] = useState<'list' | 'detail' | 'create' | 'edit' | 'ai'>(() => getInitialHrJobView())
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [jobForm, setJobForm] = useState<JobPostingPayload>(emptyJobForm)
  const [salaryInputValues, setSalaryInputValues] = useState({ salaryMin: '', salaryMax: '' })
  const [jobFieldErrors, setJobFieldErrors] = useState<JobFieldErrors>({})
  const [isSavingJob, setIsSavingJob] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const activeJobCount = jobs.filter((job) => job.status.toLowerCase() === 'open' || job.status.toLowerCase() === 'active').length
  const totalApplicantCount = jobs.reduce((total, job) => total + job.applicantCount, 0)
  const pendingReviewCount = jobs.filter((job) => job.status.toLowerCase() === 'pending_review' || job.status.toLowerCase() === 'pending review').length
  const displayStart = jobs.length === 0 ? 0 : ((jobPage - 1) * ADMIN_LIST_PAGE_SIZE) + 1
  const displayEnd = displayStart === 0 ? 0 : displayStart + jobs.length - 1
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
    let isActive = true
    const filters: Record<string, unknown> = {}
    const search = searchQuery.trim()

    if (search) filters.search = search
    if (employmentTypeFilter) filters.employmentType = employmentTypeFilter
    if (statusFilter) filters.status = statusFilter

    setIsLoadingJobs(true)
    setJobListError('')

    adminApi.getJobPostings({
      sortField: 'createdAt',
      filters,
      sortBy: 'DESC',
      page: jobPage,
      size: ADMIN_LIST_PAGE_SIZE,
    })
      .then((items) => {
        if (!isActive) return
        setJobs(items)
        setJobPageCount(getListPageCount(items, jobPage, ADMIN_LIST_PAGE_SIZE))
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
  }, [employmentTypeFilter, jobPage, searchQuery, statusFilter])

  useEffect(() => {
    setJobPage(1)
  }, [employmentTypeFilter, searchQuery, statusFilter])

  useEffect(() => {
    const refreshView = window.sessionStorage.getItem(jobFormRefreshViewKey)
    if (refreshView !== 'create') return

    window.sessionStorage.removeItem(jobFormRefreshViewKey)
    setJobForm(emptyJobForm)
    setSalaryInputValues({ salaryMin: '', salaryMax: '' })
    setJobFieldErrors({})
    setSelectedJob(null)
    setJobView('create')
    updateHrJobsPath(hrCreateJobPostingPath)
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setJobView(getInitialHrJobView())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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

  const formatJobDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  }

  const formatJobStatus = (value: string) => {
    const normalized = value.trim().toLowerCase().replace(/[_-]+/g, ' ')
    return normalized ? normalized.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Draft'
  }

  const formatEmploymentType = (value: string) => (
    value.trim().replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
  const updateJobFormField = <Field extends keyof JobPostingPayload>(field: Field, value: JobPostingPayload[Field]) => {
    setJobFieldErrors((current) => {
      if (!current[field]) return current
      const { [field]: _removed, ...nextErrors } = current
      return nextErrors
    })
    setJobForm((current) => ({ ...current, [field]: value }))
  }
  const updateSalaryField = (field: 'salaryMin' | 'salaryMax', value: string) => {
    setJobFieldErrors((current) => {
      if (!current.salaryMin && !current.salaryMax) return current
      const { salaryMin: _removedMin, salaryMax: _removedMax, ...nextErrors } = current
      return nextErrors
    })
    setSalaryInputValues((current) => ({ ...current, [field]: value }))
    const numericValue = Number(value)
    setJobForm((current) => ({ ...current, [field]: value === '' || !Number.isFinite(numericValue) ? 0 : numericValue }))
  }
  const getJobValidationErrors = (payload: JobPostingPayload) => {
    const nextErrors: JobFieldErrors = {}
    const title = payload.title.trim()
    const requiresSalaryPair = ['FULL_TIME', 'PART_TIME'].includes(payload.employmentType)
    const minSalaryValue = salaryInputValues.salaryMin.trim()
    const maxSalaryValue = salaryInputValues.salaryMax.trim()
    const minSalaryEntered = minSalaryValue !== ''
    const maxSalaryEntered = maxSalaryValue !== ''
    const salaryNumberPattern = /^\d+(\.\d+)?$/
    const minSalaryInvalid = minSalaryEntered && !salaryNumberPattern.test(minSalaryValue)
    const maxSalaryInvalid = maxSalaryEntered && !salaryNumberPattern.test(maxSalaryValue)

    if (!title) nextErrors.title = requiredJobFieldMessage
    if (!payload.department.trim()) nextErrors.department = departmentRequiredMessage
    if (!payload.employmentType.trim()) nextErrors.employmentType = employmentTypeRequiredMessage
    if (!payload.locationType.trim()) nextErrors.locationType = requiredJobFieldMessage
    if (!payload.location.trim()) nextErrors.location = requiredJobFieldMessage
    if (!payload.description.trim()) nextErrors.description = requiredJobFieldMessage
    if (!payload.requirements.trim()) nextErrors.requirements = requiredJobFieldMessage

    if (title && jobs.some((job) => (
      job.id !== selectedJob?.id &&
      job.title.trim().toLowerCase() === title.toLowerCase() &&
      ['open', 'draft'].includes(job.status.trim().toLowerCase())
    ))) {
      nextErrors.title = duplicateJobTitleMessage
    }

    if (minSalaryInvalid || payload.salaryMin < 0) nextErrors.salaryMin = salaryPositiveMessage
    if (maxSalaryInvalid || payload.salaryMax < 0) nextErrors.salaryMax = salaryPositiveMessage
    if (!minSalaryInvalid && !maxSalaryInvalid && requiresSalaryPair && ((minSalaryEntered && !maxSalaryEntered) || (!minSalaryEntered && maxSalaryEntered))) {
      nextErrors.salaryMax = salaryPairMessage
    }
    if (!minSalaryInvalid && !maxSalaryInvalid && minSalaryEntered && maxSalaryEntered && payload.salaryMin > payload.salaryMax) {
      nextErrors.salaryMax = salaryOrderMessage
    }

    if (payload.applicationDeadline) {
      const deadline = new Date(payload.applicationDeadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (Number.isNaN(deadline.getTime()) || deadline < today) {
        nextErrors.applicationDeadline = deadlineFutureMessage
      }
    }

    return nextErrors
  }
  const getAiJobValidationErrors = (payload: JobPostingPayload) => {
    const nextErrors: JobFieldErrors = {}
    const minSalaryValue = salaryInputValues.salaryMin.trim()
    const maxSalaryValue = salaryInputValues.salaryMax.trim()
    const minSalaryEntered = minSalaryValue !== ''
    const maxSalaryEntered = maxSalaryValue !== ''
    const salaryNumberPattern = /^\d+(\.\d+)?$/
    const minSalaryInvalid = minSalaryEntered && !salaryNumberPattern.test(minSalaryValue)
    const maxSalaryInvalid = maxSalaryEntered && !salaryNumberPattern.test(maxSalaryValue)

    if (!payload.title.trim()) nextErrors.title = requiredJobFieldMessage
    if (!payload.department.trim()) nextErrors.department = departmentRequiredMessage
    if (!payload.locationType.trim()) nextErrors.locationType = requiredJobFieldMessage
    if (!payload.location.trim()) nextErrors.location = requiredJobFieldMessage
    if (!payload.requirements.trim()) nextErrors.requirements = requiredJobFieldMessage

    if (minSalaryInvalid || payload.salaryMin < 0) nextErrors.salaryMin = salaryPositiveMessage
    if (maxSalaryInvalid || payload.salaryMax < 0) nextErrors.salaryMax = salaryPositiveMessage
    if (!minSalaryInvalid && !maxSalaryInvalid && ((minSalaryEntered && !maxSalaryEntered) || (!minSalaryEntered && maxSalaryEntered))) {
      nextErrors.salaryMax = salaryPairMessage
    }
    if (!minSalaryInvalid && !maxSalaryInvalid && minSalaryEntered && maxSalaryEntered && payload.salaryMin > payload.salaryMax) {
      nextErrors.salaryMax = salaryOrderMessage
    }

    if (payload.applicationDeadline) {
      const deadline = new Date(payload.applicationDeadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (Number.isNaN(deadline.getTime()) || deadline < today) {
        nextErrors.applicationDeadline = deadlineFutureMessage
      }
    }

    return nextErrors
  }
  const generateAiJobContent = () => {
    if (isActionLocked) return
    const nextErrors = getAiJobValidationErrors(jobForm)

    if (Object.keys(nextErrors).length > 0) {
      setJobFieldErrors(nextErrors)
      return
    }

    setJobFieldErrors({})
  }
  const getInputClassName = (hasError?: boolean) => (hasError ? styles.jobInputError : undefined)
  const openCreateJob = () => {
    window.sessionStorage.removeItem(jobFormRefreshViewKey)
    setJobForm(emptyJobForm)
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
  const discardJobFormChanges = () => {
    window.sessionStorage.removeItem(jobFormRefreshViewKey)
    setIsCancelConfirmOpen(false)
    setJobFieldErrors({})
    setSalaryInputValues({ salaryMin: '', salaryMax: '' })
    setJobForm(emptyJobForm)
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
  const openJobDetail = async (job: JobPosting) => {
    setSelectedJob(job)
    setJobView('detail')
    updateHrJobsPath(hrJobsPath)
    try {
      setSelectedJob(await adminApi.getJobPostingById(job.id))
    } catch {
      setSelectedJob(job)
    }
  }
  const openEditJob = (job: JobPosting) => {
    setSelectedJob(job)
    setJobFieldErrors({})
    setIsCancelConfirmOpen(false)
    setSalaryInputValues({
      salaryMin: job.salaryMin ? String(job.salaryMin) : '',
      salaryMax: job.salaryMax ? String(job.salaryMax) : '',
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
    updateHrJobsPath(hrJobsPath)
  }
  const saveJob = async (payload: JobPostingPayload = jobForm) => {
    if (isActionLocked) return
    const nextErrors = getJobValidationErrors(payload)

    if (Object.keys(nextErrors).length > 0) {
      setJobFieldErrors(nextErrors)
      return
    }

    setJobFieldErrors({})
    setIsSavingJob(true)
    try {
      if (jobView === 'edit' && selectedJob) {
        await adminApi.updateJobPosting(selectedJob.id, payload)
      } else {
        await adminApi.createJobPosting(payload)
      }
      setJobView('list')
      updateHrJobsPath(hrJobsPath)
      setJobPage(1)
      adminApi.getJobPostings({ sortField: 'createdAt', filters: {}, sortBy: 'DESC', page: 1, size: ADMIN_LIST_PAGE_SIZE })
        .then((items) => setJobs(items))
      window.sessionStorage.removeItem(jobFormRefreshViewKey)
    } finally {
      setIsSavingJob(false)
    }
  }

  if (jobView === 'detail' && selectedJob) {
    return (
      <div className={`role-content ${styles.jobsContent}`}>
        <AdminBreadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Jobs', onClick: () => { setJobView('list'); updateHrJobsPath(hrJobsPath) } }, { label: 'Job Detail' }]} />
        <div className={styles.jobsHeader}>
          <h1>{selectedJob.title} <em className={styles.jobStatusBadge}>{formatJobStatus(selectedJob.status)}</em></h1>
          <div>
            <button type="button" className={styles.secondaryJobButton} disabled={isActionLocked}>Open</button>
            <button type="button" disabled={isActionLocked} onClick={() => openEditJob(selectedJob)}>Edit</button>
          </div>
        </div>
        <section className={styles.jobDetailGrid}>
          <article className={styles.jobDetailCard}>
            <h2><i className="fa-solid fa-lightbulb"></i> Technical Overview</h2>
            <strong>The Opportunity</strong>
            <p>{selectedJob.description || 'No description provided.'}</p>
            <strong>Key Requirements</strong>
            <p>{selectedJob.requirements || 'No requirements provided.'}</p>
            <strong>Company Benefits</strong>
            <p>{selectedJob.benefits || 'No benefits provided.'}</p>
          </article>
          <aside className={styles.jobSidePanel}>
            <section><small>Applicants</small><strong>{selectedJob.applicantCount}</strong><span>Total received</span></section>
            <section><small>Status</small><strong>{formatJobStatus(selectedJob.status)}</strong><span>{formatEmploymentType(selectedJob.employmentType)}</span></section>
          </aside>
        </section>
      </div>
    )
  }

  if (jobView === 'ai') {
    return (
      <div className={`role-content ${styles.jobsContent}`}>
        <AdminBreadcrumb items={[
          { label: 'Home', onClick: onHome },
          { label: 'Jobs', onClick: () => { setJobView('list'); updateHrJobsPath(hrJobsPath) } },
          { label: 'Create New Job Posting', current: true },
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
                <input className={getInputClassName(Boolean(jobFieldErrors.title))} value={jobForm.title} onChange={(e) => updateJobFormField('title', e.target.value)} placeholder="e.g. Senior Product Designer" />
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
                      <input className={getInputClassName(Boolean(jobFieldErrors.location))} value={jobForm.location} onChange={(e) => updateJobFormField('location', e.target.value)} placeholder="e.g. San Francisco, CA" />
                    </div>
                    <JobFieldError message={jobFieldErrors.location} />
                  </div>
                </div>
              </div>
              <label>
                <span>Application Deadline</span>
                <input className={getInputClassName(Boolean(jobFieldErrors.applicationDeadline))} type="text" value={jobForm.applicationDeadline ? jobForm.applicationDeadline.slice(0, 10) : ''} onChange={(e) => updateJobFormField('applicationDeadline', e.target.value)} placeholder="mm/dd/yyyy" />
                <JobFieldError message={jobFieldErrors.applicationDeadline} />
              </label>
              <div className={styles.aiSalaryField}>
                <span>Salary Range</span>
                <div className={styles.aiSalaryControls}>
                  <div className={styles.salaryInputSlot}>
                    <div className={`${styles.moneyInput} ${jobFieldErrors.salaryMin ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Minimum salary" type="text" inputMode="decimal" value={salaryInputValues.salaryMin} onChange={(e) => updateSalaryField('salaryMin', e.target.value)} placeholder="0" /></div>
                    <JobFieldError message={jobFieldErrors.salaryMin} />
                  </div>
                  <div className={styles.salaryInputSlot}>
                    <div className={`${styles.moneyInput} ${jobFieldErrors.salaryMax ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Maximum salary" type="text" inputMode="decimal" value={salaryInputValues.salaryMax} onChange={(e) => updateSalaryField('salaryMax', e.target.value)} placeholder="0" /></div>
                    <JobFieldError message={jobFieldErrors.salaryMax} />
                  </div>
                </div>
              </div>
              <label className={styles.fullField}>
                <span>Key Skills <b>*</b></span>
                <textarea className={getInputClassName(Boolean(jobFieldErrors.requirements))} value={jobForm.requirements} onChange={(e) => updateJobFormField('requirements', e.target.value)} placeholder="Add skill..." />
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
        <AdminBreadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Jobs', onClick: () => { setJobView('list'); updateHrJobsPath(hrJobsPath) } }, { label: jobView === 'edit' ? 'Edit Job Posting' : 'Create New Job Posting' }]} />
        <div className={styles.jobsHeader}>
          <div><h1>{jobView === 'edit' ? 'Edit Job Posting' : 'Create New Job Posting'}</h1></div>
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
                        <input className={getInputClassName(Boolean(jobFieldErrors.location))} value={jobForm.location} onChange={(e) => updateJobFormField('location', e.target.value)} placeholder="e.g. San Francisco, CA" />
                      </div>
                      <JobFieldError message={jobFieldErrors.location} />
                    </div>
                  </div>
                </div>
                <label className={styles.deadlineField}>
                  <span>Application Deadline</span>
                  <div className={styles.iconInput}>
                    <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V0H5V2H13V0H15V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6ZM2 6V4V6Z" fill="#565E74" />
                    </svg>
                    <input className={getInputClassName(Boolean(jobFieldErrors.applicationDeadline))} type="date" value={jobForm.applicationDeadline.slice(0, 10)} onChange={(e) => updateJobFormField('applicationDeadline', e.target.value ? new Date(e.target.value).toISOString() : '')} />
                  </div>
                  <JobFieldError message={jobFieldErrors.applicationDeadline} />
                </label>
                <div className={styles.salaryRangeRow}>
                  <span>Salary Range</span>
                  <div className={styles.salaryRangeControls}>
                    <div className={styles.salaryInputSlot}>
                      <div className={`${styles.moneyInput} ${jobFieldErrors.salaryMin ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Minimum salary" type="text" inputMode="decimal" value={salaryInputValues.salaryMin} onChange={(e) => updateSalaryField('salaryMin', e.target.value)} /></div>
                      <JobFieldError message={jobFieldErrors.salaryMin} />
                    </div>
                    <small className={styles.salaryRangeDivider}>To</small>
                    <div className={styles.salaryInputSlot}>
                      <div className={`${styles.moneyInput} ${jobFieldErrors.salaryMax ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Maximum salary" type="text" inputMode="decimal" value={salaryInputValues.salaryMax} onChange={(e) => updateSalaryField('salaryMax', e.target.value)} /></div>
                      <JobFieldError message={jobFieldErrors.salaryMax} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.jobFormPanel}>
              <label className={styles.richTextField}><span>Job Description <b>*</b></span>
                <div className={`${styles.richTextBox} ${jobFieldErrors.description ? styles.jobInputError : ''}`.trim()}>
                  <div className={styles.richTextToolbar}><b>B</b><i>I</i><span>≡</span><span>↔</span></div>
                  <textarea value={jobForm.description} onChange={(e) => updateJobFormField('description', e.target.value)} placeholder="Enter job summary and context..." />
                </div>
                <JobFieldError message={jobFieldErrors.description} />
              </label>
            </section>
          </div>

          <aside className={styles.jobFormAside}>
            <section className={styles.jobFormPanel}>
              <label className={styles.richTextField}><span>Requirements <b>*</b></span>
                <div className={`${styles.richTextBox} ${jobFieldErrors.requirements ? styles.jobInputError : ''}`.trim()}>
                  <div className={styles.richTextToolbar}><b>B</b><i>I</i><span>≡</span><span>↔</span></div>
                  <textarea value={jobForm.requirements} onChange={(e) => updateJobFormField('requirements', e.target.value)} placeholder="List technical and soft skills required..." />
                </div>
                <JobFieldError message={jobFieldErrors.requirements} />
              </label>
            </section>
            <section className={styles.jobFormPanel}>
              <label className={styles.richTextField}><span>Benefits</span>
                <div className={styles.richTextBox}>
                  <div className={styles.richTextToolbar}><b>B</b><i>I</i><span>≡</span><span>↔</span></div>
                  <textarea value={jobForm.benefits} onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })} placeholder="Enter company benefits and perks..." />
                </div>
              </label>
            </section>
            <footer>
              <button type="button" onClick={handleCancelJobForm} disabled={isSavingJob}>Cancel</button>
              <button type="button" disabled={isActionLocked || isSavingJob} onClick={() => saveJob({ ...jobForm, status: 'DRAFT' })}>Save as Draft</button>
              <button type="submit" disabled={isActionLocked || isSavingJob}>{isSavingJob ? 'Saving...' : 'Save'}</button>
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
      </div>
    )
  }

  return (
    <div className={`role-content ${styles.jobsContent}`}>
      <AdminBreadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Jobs' }]} />

      <div className={styles.jobsHeader}>
        <h1>Job Postings</h1>
        <button type="button" disabled={isActionLocked} onClick={openCreateJob}>Create New Job Posting</button>
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
          <small>Pending Review</small>
          <strong>{isLoadingJobs ? '...' : pendingReviewCount}</strong>
          <span>
            <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5.95 2V0H11.95V2H5.95ZM6.95 13.75L5.85 11.55C5.76667 11.3667 5.64167 11.2292 5.475 11.1375C5.30833 11.0458 5.13333 11 4.95 11H0C0.25 8.75 1.225 6.85417 2.925 5.3125C4.625 3.77083 6.63333 3 8.95 3C9.98333 3 10.975 3.16667 11.925 3.5C12.875 3.83333 13.7667 4.31667 14.6 4.95L16 3.55L17.4 4.95L16 6.35C16.5333 7.05 16.9583 7.7875 17.275 8.5625C17.5917 9.3375 17.8 10.15 17.9 11H13.575L11.85 7.55C11.6667 7.16667 11.3667 6.975 10.95 6.975C10.5333 6.975 10.2333 7.16667 10.05 7.55L6.95 13.75ZM8.95 21C6.63333 21 4.625 20.2292 2.925 18.6875C1.225 17.1458 0.25 15.25 0 13H4.325L6.05 16.45C6.23333 16.8333 6.53333 17.025 6.95 17.025C7.36667 17.025 7.66667 16.8333 7.85 16.45L10.95 10.25L12.05 12.45C12.1333 12.6333 12.2583 12.7708 12.425 12.8625C12.5917 12.9542 12.7667 13 12.95 13H17.9C17.65 15.25 16.675 17.1458 14.975 18.6875C13.275 20.2292 11.2667 21 8.95 21Z" fill="#545C72" />
            </svg>
          </span>
        </section>
      </div>

      <div className={styles.jobsToolbar}>
        <AdminSearchInput
          className={styles.jobsSearch}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search job title, or department..."
          ariaLabel="Job posting search"
        />
        <label>
          <span>Status:</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <label>
          <span>Employment type:</span>
          <select value={employmentTypeFilter} onChange={(event) => setEmploymentTypeFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
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
          {jobs.map((job) => (
            <article className={styles.jobsTableRow} key={job.id} onClick={() => openJobDetail(job)}>
              <strong>{job.title}</strong>
              <span>{job.department}</span>
              <span>{formatEmploymentType(job.employmentType)}</span>
              <em className={job.status.toLowerCase()}>{formatJobStatus(job.status)}</em>
              <span>{job.applicantCount}</span>
              <span>{formatJobDate(job.createdAt)}</span>
              <div className={styles.jobsActions}>
                <button type="button" aria-label={`Edit ${job.title}`} disabled={isActionLocked} onClick={(event) => { event.stopPropagation(); openEditJob(job) }}><i className="fa-regular fa-pen-to-square"></i></button>
                <button type="button" aria-label={`Lock ${job.title}`} disabled={isActionLocked}><i className="fa-solid fa-lock"></i></button>
              </div>
            </article>
          ))}
          <footer>
            <span>Showing {displayStart} to {displayEnd} of entries</span>
            <div>
              <button type="button" disabled={jobPage === 1} onClick={() => setJobPage((page) => Math.max(1, page - 1))}><i className="fa-solid fa-chevron-left"></i></button>
              {Array.from({ length: jobPageCount }, (_, index) => index + 1).map((page) => (
                <button type="button" className={page === jobPage ? styles.activePage : ''} onClick={() => setJobPage(page)} key={page}>{page}</button>
              ))}
              <button type="button" disabled={jobPage === jobPageCount} onClick={() => setJobPage((page) => Math.min(jobPageCount, page + 1))}><i className="fa-solid fa-chevron-right"></i></button>
            </div>
          </footer>
        </section>
      )}
    </div>
  )
}

export function HrDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<RoleHomeView>(() => getInitialRoleHomeView('hr'))
  const selectView = (view: RoleHomeView) => {
    setActiveView(view)
    updateRoleHomeViewUrl('hr', view)
  }
  const navItems = getRoleHomeNav(hrNav, activeView, selectView)
  const canSwitchWorkspace = hasMultipleStaffWorkspaces()
  const isActionLocked = isStoredCurrentUserInactive()

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getInitialRoleHomeView('hr'))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <DashboardShell navItems={navItems} subtitle="HR" onLogout={onLogout} onChangePassword={() => selectView('settings')} showWorkspaceSwitcher={canSwitchWorkspace} onWorkspaceSwitch={() => switchStaffWorkspace('interviewer')}>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => selectView('dashboard')} triggerToast={triggerToast} />
      ) : activeView === 'jobs' ? (
        <HrJobsView isActionLocked={isActionLocked} onHome={() => selectView('dashboard')} />
      ) : (
      <div className={`role-content ${styles.content}`}>
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
            ['fa-user-group', 'Total Candidates', '2,842', '+12%'],
            ['fa-briefcase', 'Active Jobs', '48', 'Stable'],
            ['fa-bolt', 'AI-Scored Top Talents', '156', 'AI Enhanced'],
            ['fa-stopwatch', 'Avg. Time to Hire', '18 days', '-4 days'],
          ].map(([icon, label, value, note]) => (
            <section className={styles.kpiCard} key={label}>
              <span><i className={`fa-solid ${icon}`}></i></span>
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{note}</em>
            </section>
          ))}
        </div>

        <div className={styles.dashboardGrid}>
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

          <section className={`role-panel ${styles.quickPanel}`}>
            <h2>Quick Actions</h2>
            <div>
              <button type="button" disabled={isActionLocked}><i className="fa-regular fa-file-lines"></i> Parse Resume</button>
              <button type="button" disabled={isActionLocked}><i className="fa-regular fa-envelope"></i> Blast Email</button>
              <button type="button" disabled={isActionLocked}><i className="fa-solid fa-video"></i> AI Screening</button>
              <button type="button" disabled={isActionLocked}><i className="fa-solid fa-share-nodes"></i> Social Share</button>
            </div>
          </section>

          <section className={`role-panel ${styles.pipelinePanel}`}>
            <h2>Pipeline Health</h2>
            <div className={styles.pipelineTrack}><span></span><span></span><span></span><span></span></div>
            <footer><span>Sourced (450)</span><span>Screened (120)</span><span>Interview (24)</span><span>Offer (4)</span></footer>
          </section>

          <section className={`role-panel ${styles.topPicks}`}>
            <div className="role-panel-head"><h2>Top Picks</h2><i className="fa-solid fa-wand-magic-sparkles"></i></div>
            {[
              ['JD', 'Jordan Day', 'DevOps Engineer', '98%'],
              ['ML', 'Maria Lopez', 'Data Scientist', '95%'],
              ['BK', 'Ben King', 'Product Lead', '89%'],
            ].map(([initials, name, title, score]) => (
              <article key={name}>
                <span>{initials}</span>
                <div><strong>{name}</strong><small>{title}</small></div>
                <em>{score}</em>
              </article>
            ))}
          </section>
        </div>
      </div>
      )}
    </DashboardShell>
  )
}
