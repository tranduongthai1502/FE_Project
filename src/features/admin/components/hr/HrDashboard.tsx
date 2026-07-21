import { useEffect, useState } from 'react'
import { getRoleHomeNav, hrNav } from '../../data/adminNavigation'
import type { JobPosting, JobPostingPayload, RoleHomeView } from '../../types/admin.types'
import { ADMIN_LIST_PAGE_SIZE, adminApi } from '../../services/adminApi'
import { isStoredCurrentUserInactive } from '../../utils/adminAccess'
import { getAdminErrorMessage } from '../../utils/adminErrors'
import { getListPageCount } from '../../utils/adminMappers'
import { hasMultipleStaffWorkspaces, switchStaffWorkspace } from '../../utils/staffWorkspace'
import { AccountSettingsView } from '../shared/AccountSettingsView'
import { AdminBreadcrumb } from '../shared/AdminBreadcrumb'
import { AdminSearchInput } from '../shared/AdminSearchInput'
import { DashboardShell } from '../shared/DashboardShell'
import styles from './HrDashboard.module.css'

function HrJobsView({ isActionLocked }: { isActionLocked: boolean }) {
  const emptyJobForm: JobPostingPayload = {
    title: '',
    department: '',
    level: '',
    employmentType: 'FULL_TIME',
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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [jobListError, setJobListError] = useState('')
  const [jobPage, setJobPage] = useState(1)
  const [jobPageCount, setJobPageCount] = useState(1)
  const [jobView, setJobView] = useState<'list' | 'detail' | 'create' | 'edit'>('list')
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [jobForm, setJobForm] = useState<JobPostingPayload>(emptyJobForm)
  const [isSavingJob, setIsSavingJob] = useState(false)
  const activeJobCount = jobs.filter((job) => job.status.toLowerCase() === 'open' || job.status.toLowerCase() === 'active').length
  const totalApplicantCount = jobs.reduce((total, job) => total + job.applicantCount, 0)
  const pendingReviewCount = jobs.filter((job) => job.status.toLowerCase() === 'pending_review' || job.status.toLowerCase() === 'pending review').length
  const displayStart = jobs.length === 0 ? 0 : ((jobPage - 1) * ADMIN_LIST_PAGE_SIZE) + 1
  const displayEnd = displayStart === 0 ? 0 : displayStart + jobs.length - 1

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
  const openCreateJob = () => {
    setJobForm(emptyJobForm)
    setSelectedJob(null)
    setJobView('create')
  }
  const openJobDetail = async (job: JobPosting) => {
    setSelectedJob(job)
    setJobView('detail')
    try {
      setSelectedJob(await adminApi.getJobPostingById(job.id))
    } catch {
      setSelectedJob(job)
    }
  }
  const openEditJob = (job: JobPosting) => {
    setSelectedJob(job)
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
  }
  const saveJob = async () => {
    if (isActionLocked) return
    setIsSavingJob(true)
    try {
      if (jobView === 'edit' && selectedJob) {
        await adminApi.updateJobPosting(selectedJob.id, jobForm)
      } else {
        await adminApi.createJobPosting(jobForm)
      }
      setJobView('list')
      setJobPage(1)
      adminApi.getJobPostings({ sortField: 'createdAt', filters: {}, sortBy: 'DESC', page: 1, size: ADMIN_LIST_PAGE_SIZE })
        .then((items) => setJobs(items))
    } finally {
      setIsSavingJob(false)
    }
  }

  if (jobView === 'detail' && selectedJob) {
    return (
      <div className={`role-content ${styles.jobsContent}`}>
        <AdminBreadcrumb items={[{ label: 'Home' }, { label: 'Jobs', onClick: () => setJobView('list') }, { label: 'Job Detail' }]} />
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

  if (jobView === 'create' || jobView === 'edit') {
    return (
      <div className={`role-content ${styles.jobsContent}`}>
        <AdminBreadcrumb items={[{ label: 'Home' }, { label: 'Jobs', onClick: () => setJobView('list') }, { label: jobView === 'edit' ? 'Edit Job Posting' : 'Create Job Posting' }]} />
        <div className={styles.jobsHeader}>
          <div><h1>{jobView === 'edit' ? 'Edit Job Posting' : 'Create Job Posting'}</h1><p>Manage and update the details of your talent acquisition campaign.</p></div>
        </div>
        <form className={styles.jobForm} onSubmit={(event) => { event.preventDefault(); saveJob() }}>
          <section>
            <h2>General Information</h2>
            <label>Job Title<input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required /></label>
            <label>Department<input value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} required /></label>
            <label>Level<input value={jobForm.level} onChange={(e) => setJobForm({ ...jobForm, level: e.target.value })} /></label>
            <label>Employment Type<select value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })}><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="CONTRACT">Contract</option></select></label>
            <label>Location Type<select value={jobForm.locationType} onChange={(e) => setJobForm({ ...jobForm, locationType: e.target.value })}><option value="OFFICE">Office</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option></select></label>
            <label>Location<input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} /></label>
            <label>Application Deadline<input type="datetime-local" value={jobForm.applicationDeadline.slice(0, 16)} onChange={(e) => setJobForm({ ...jobForm, applicationDeadline: e.target.value ? new Date(e.target.value).toISOString() : '' })} /></label>
            <label>Salary Min<input type="number" min="0" step="0.1" value={jobForm.salaryMin} onChange={(e) => setJobForm({ ...jobForm, salaryMin: Number(e.target.value) })} /></label>
            <label>Salary Max<input type="number" min="0" step="0.1" value={jobForm.salaryMax} onChange={(e) => setJobForm({ ...jobForm, salaryMax: Number(e.target.value) })} /></label>
            <label>Status<select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}><option value="DRAFT">Draft</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option></select></label>
          </section>
          <section>
            <label>Description<textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} /></label>
            <label>Requirements<textarea value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} /></label>
            <label>Benefits<textarea value={jobForm.benefits} onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })} /></label>
          </section>
          <footer>
            <button type="button" onClick={() => setJobView('list')} disabled={isSavingJob}>Cancel</button>
            <button type="submit" disabled={isActionLocked || isSavingJob}>{isSavingJob ? 'Saving...' : jobView === 'edit' ? 'Save Changes' : 'Create Job Posting'}</button>
          </footer>
        </form>
      </div>
    )
  }

  return (
    <div className={`role-content ${styles.jobsContent}`}>
      <AdminBreadcrumb items={[{ label: 'Home' }, { label: 'Jobs' }]} />

      <div className={styles.jobsHeader}>
        <h1>Job Postings</h1>
        <button type="button" disabled={isActionLocked} onClick={openCreateJob}>Create New Job Posting</button>
      </div>

      <div className={styles.jobsMetrics}>
        <section>
          <small>Total Active Postings</small>
          <strong>{isLoadingJobs ? '...' : activeJobCount}</strong>
          <span><i className="fa-solid fa-briefcase"></i></span>
        </section>
        <section>
          <small>Total Applicants</small>
          <strong>{isLoadingJobs ? '...' : totalApplicantCount.toLocaleString()}</strong>
          <span><i className="fa-solid fa-users"></i></span>
        </section>
        <section>
          <small>Pending Review</small>
          <strong>{isLoadingJobs ? '...' : pendingReviewCount}</strong>
          <span><i className="fa-solid fa-clipboard-check"></i></span>
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
        <div className={`${styles.jobsTableState} ${styles.error}`}>{jobListError}</div>
      ) : jobs.length === 0 ? (
        <section className={styles.jobsEmptyState}>
        <div className={styles.jobsEmptyIcon}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <span><i className="fa-solid fa-briefcase"></i></span>
        </div>
        <strong>No job postings found</strong>
        <p>Click 'Create New Job Posting' to get started.</p>
      </section>
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
  const [activeView, setActiveView] = useState<RoleHomeView>('dashboard')
  const navItems = getRoleHomeNav(hrNav, activeView, setActiveView)
  const canSwitchWorkspace = hasMultipleStaffWorkspaces()
  const isActionLocked = isStoredCurrentUserInactive()

  return (
    <DashboardShell navItems={navItems} subtitle="HR" onLogout={onLogout} onChangePassword={() => setActiveView('settings')} showWorkspaceSwitcher={canSwitchWorkspace} onWorkspaceSwitch={() => switchStaffWorkspace('interviewer')}>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => setActiveView('dashboard')} triggerToast={triggerToast} />
      ) : activeView === 'jobs' ? (
        <HrJobsView isActionLocked={isActionLocked} />
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
