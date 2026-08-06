import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HR_LIST_PAGE_SIZE, hrApi } from '../../infrastructure/hrApi'
import { useJobPostings, useJobPostingStats } from '../queryHooks/useHrQueries'
import type { DashboardStatsJobPostingResponse, JobListFilters, JobPosting } from '../../domain/hrApi.types'
import type { JobConfirmAction, JobDetailTab } from '../../infrastructure/hrJobLogic'
import {
  buildJobPayloadFromPosting,
  isDraftJobStatus,
} from '../../infrastructure/hrJobLogic'
import { getErrorMessage as getAdminErrorMessage } from '@/core/utils/errors/errorMessages'
import { getListPageCount, getListTotalElements } from '@/core/utils/pagination'
import {
  getHrJobDetailPath,
  getHrJobDetailTabFromSearch,
  getHrJobEditPath,
  getHrJobIdFromPath,
  getHrJobViewFromPath,
  getJobsEllipsisPageItems,
} from '../helpers/hrDashboardHelpers'
import { hrCreateJobPostingPath, hrGenerateJobAiPath, hrJobsPath } from '../../domain/hrRoutePaths'

export function useHrJobsController({
  isActionLocked,
  triggerToast,
}: {
  isActionLocked: boolean
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const location = useLocation()
  const navigate = useNavigate()

  const initialJobListSearchParams = new URLSearchParams(location.search)
  const initialJobPage = Number(initialJobListSearchParams.get('page') || 1)

  const [searchQuery, setSearchQuery] = useState(initialJobListSearchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(initialJobListSearchParams.get('status') || '')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState(initialJobListSearchParams.get('employmentType') || '')
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [jobStats, setJobStats] = useState<DashboardStatsJobPostingResponse | null>(null)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [jobListError, setJobListError] = useState('')
  const [jobPage, setJobPage] = useState(() => Number.isFinite(initialJobPage) ? Math.max(1, initialJobPage) : 1)
  const [jobPageCount, setJobPageCount] = useState(1)
  const [jobListReloadKey, setJobListReloadKey] = useState(0)

  const [jobView, setJobView] = useState<'list' | 'detail' | 'create' | 'edit' | 'ai'>(() => getHrJobViewFromPath(location.pathname))
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [jobDetailTab, setJobDetailTab] = useState<JobDetailTab>(() => getHrJobDetailTabFromSearch(location.search))

  const [jobConfirmAction, setJobConfirmAction] = useState<JobConfirmAction>(null)
  const [jobConfirmTarget, setJobConfirmTarget] = useState<JobPosting | null>(null)
  const [isJobActionSubmitting, setIsJobActionSubmitting] = useState(false)

  const didMountJobListFilters = useRef(false)

  const activeJobCount = jobStats?.totalActivePostings ?? jobs.filter((job) => job.status.toLowerCase() === 'open' || job.status.toLowerCase() === 'active').length
  const totalApplicantCount = jobStats?.totalApplicants ?? jobs.reduce((total, job) => total + job.applicantCount, 0)
  const expiringSoonCount = jobStats?.postingsExpiringSoon ?? jobs.filter((job) => job.status.toLowerCase() === 'pending_review' || job.status.toLowerCase() === 'pending review').length

  const jobTotalElements = getListTotalElements(jobs, jobs.length)
  const safeJobPage = Math.min(jobPage, jobPageCount)
  const jobPageItems = getJobsEllipsisPageItems(safeJobPage, jobPageCount)

  useEffect(() => {
    if (jobView !== 'list') return

    const searchParams = new URLSearchParams()
    if (statusFilter) searchParams.set('status', statusFilter)
    if (employmentTypeFilter) searchParams.set('employmentType', employmentTypeFilter)
    if (searchQuery.trim()) searchParams.set('search', searchQuery.trim())
    if (jobPage > 1) searchParams.set('page', String(jobPage))

    const nextSearch = searchParams.toString()
    const nextPath = `${hrJobsPath}${nextSearch ? `?${nextSearch}` : ''}`
    const currentPath = `${location.pathname}${location.search}`

    if (currentPath !== nextPath) {
      navigate(nextPath, { replace: true })
    }
  }, [employmentTypeFilter, jobPage, jobView, location.pathname, location.search, navigate, searchQuery, statusFilter])

  useEffect(() => {
    if (!didMountJobListFilters.current) {
      didMountJobListFilters.current = true
      return
    }

    setJobPage(1)
  }, [employmentTypeFilter, searchQuery, statusFilter])

  const jobListFilters = useMemo<JobListFilters>(() => {
    const filters: JobListFilters = {}
    const search = searchQuery.trim()
    if (search) filters.title = search
    if (employmentTypeFilter) filters.employmentType = employmentTypeFilter
    if (statusFilter) filters.status = statusFilter
    return filters
  }, [searchQuery, employmentTypeFilter, statusFilter])

  const jobListParams = useMemo(() => ({
    sortField: 'createdAt',
    filters: jobListFilters,
    sortBy: 'DESC' as const,
    page: jobPage,
    size: HR_LIST_PAGE_SIZE,
  }), [jobListFilters, jobPage])

  const jobPostingsQuery = useJobPostings(jobListParams)
  const jobStatsQuery = useJobPostingStats()

  useEffect(() => {
    if (jobStatsQuery.data) {
      setJobStats(jobStatsQuery.data)
    }
  }, [jobStatsQuery.data])

  useEffect(() => {
    if (jobView !== 'list') return

    setIsLoadingJobs(jobPostingsQuery.isLoading)
    if (jobPostingsQuery.isError) {
      setJobs([])
      setJobListError(getAdminErrorMessage(jobPostingsQuery.error, 'Failed to load job postings.'))
    } else if (jobPostingsQuery.data) {
      setJobs(jobPostingsQuery.data)
      setJobPageCount(getListPageCount(jobPostingsQuery.data, jobPage, HR_LIST_PAGE_SIZE))
      setJobListError('')
    }
  }, [jobPostingsQuery.data, jobPostingsQuery.isLoading, jobPostingsQuery.isError, jobPostingsQuery.error, jobPage, jobView])

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

    hrApi.getJobPostingById(jobId)
      .then((job) => {
        if (!isActive) return
        setSelectedJob(job)
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

  const updateHrJobsPath = (path: string) => {
    if (location.pathname !== path) {
      navigate(path)
    }
  }

  const updateJobDetailTab = (tab: JobDetailTab) => {
    setJobDetailTab(tab)
    if (jobView !== 'detail') return

    const search = tab === 'criteria' ? '?tab=criteria' : ''
    if (location.search !== search) {
      navigate({ pathname: location.pathname, search })
    }
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

  const openCreateJob = () => {
    window.sessionStorage.removeItem('jobfusion.hr.jobFormRefreshView')
    setSelectedJob(null)
    setJobView('create')
    updateHrJobsPath(hrCreateJobPostingPath)
  }

  const openGenerateWithAi = () => {
    setJobView('ai')
    updateHrJobsPath(hrGenerateJobAiPath)
  }

  const openJobDetail = async (job: JobPosting) => {
    setSelectedJob(job)
    setJobDetailTab('overview')
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

  return {
    searchQuery,
    statusFilter,
    employmentTypeFilter,
    jobs,
    setJobs,
    jobStats,
    isLoadingJobs,
    jobListError,
    jobPage,
    setJobPage,
    jobPageCount,
    jobListReloadKey,
    setJobListReloadKey,
    jobView,
    setJobView,
    selectedJob,
    setSelectedJob,
    jobDetailTab,
    setJobDetailTab,
    jobConfirmAction,
    jobConfirmTarget,
    isJobActionSubmitting,

    // Metrics & Pagination
    activeJobCount,
    totalApplicantCount,
    expiringSoonCount,
    jobTotalElements,
    safeJobPage,
    jobPageItems,

    // Handlers
    updateHrJobsPath,
    updateJobDetailTab,
    updateJobSearchQuery,
    updateJobStatusFilter,
    updateJobEmploymentTypeFilter,
    openCreateJob,
    openGenerateWithAi,
    openJobDetail,
    openEditJob,
    requestJobAction,
    closeJobConfirm,
    confirmJobAction,
  }
}
