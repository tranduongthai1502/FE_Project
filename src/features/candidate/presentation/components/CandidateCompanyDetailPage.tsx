import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getCompactPageItems, getListPageCount, getListTotalElements } from '@/core/utils/pagination'

import { candidateCompanies } from '../../domain/candidateData'
import { useCandidateCompanyDetail, useCandidateCompanyJobs } from '../../application/useCandidateCompanies'
import { truncateCandidateText } from '../../application/candidateText'

function formatEmploymentType(value?: string) {
  return String(value || 'Full-time').replace(/_/g, '-').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatSalaryRange(job: { salaryMin?: number; salaryMax?: number }) {
  const hasMin = Number.isFinite(job.salaryMin)
  const hasMax = Number.isFinite(job.salaryMax)
  if (hasMin && hasMax) return `$${job.salaryMin} - $${job.salaryMax}`
  if (hasMin) return `From $${job.salaryMin}`
  if (hasMax) return `Up to $${job.salaryMax}`
  return 'Salary negotiable'
}

function formatDate(value?: string) {
  if (!value) return 'No deadline'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

export function CandidateCompanyDetailPage() {
  const navigate = useNavigate()
  const { companyId } = useParams<{ companyId?: string }>()
  const [jobPage, setJobPage] = useState(1)
  const jobPageSize = 6
  const fallbackCompany = candidateCompanies.find((item) => item.id === companyId)
  const companyQuery = useCandidateCompanyDetail(companyId)
  const jobsQuery = useCandidateCompanyJobs(companyId, { page: jobPage, size: jobPageSize })
  const company = companyQuery.data
  const jobs = jobsQuery.data ?? []
  const totalJobs = getListTotalElements(jobs, jobs.length)
  const jobPageCount = getListPageCount(jobs, jobPage, jobPageSize)
  const jobPageItems = getCompactPageItems(jobPage, jobPageCount)
  const firstJobItem = totalJobs > 0 ? ((jobPage - 1) * jobPageSize) + 1 : 0
  const lastJobItem = Math.min(jobPage * jobPageSize, totalJobs)
  const displayName = company?.name || fallbackCompany?.name || 'Selected Company'
  const displayDescription = company?.industry
    ? `${company.industry}${company.region ? ` opportunities in ${company.region}` : ' career opportunities'}`
    : 'Join us in building the future of technology. We are looking for passionate individuals to shape the next generation of enterprise software.'

  const goToJobPage = (nextPage: number) => {
    const normalizedPage = Math.min(Math.max(1, nextPage), jobPageCount)
    if (normalizedPage !== jobPage) setJobPage(normalizedPage)
  }

  if (!companyId) return <Navigate to="/candidate/companies" replace />

  return (
    <section className="candidate-company-detail-page">
      <nav className="candidate-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate('/candidate')}>
          <i className="fa-solid fa-house"></i>
          Home
        </button>
        <i className="fa-solid fa-chevron-right"></i>
        <button type="button" onClick={() => navigate('/candidate/companies')}>Companies</button>
        <i className="fa-solid fa-chevron-right"></i>
        <strong title={displayName}>{truncateCandidateText(displayName)}</strong>
      </nav>

      <header className="candidate-company-career-hero">
        <span>Join Our Team</span>
        <h1>Careers at {displayName}</h1>
        <p>{companyQuery.isLoading ? 'Loading company information...' : displayDescription}</p>
        <div>
          <button type="button">Browse Openings</button>
          <button type="button">Learn About Us</button>
        </div>
      </header>

      {companyQuery.error && (
        <div className="candidate-company-list-state error">Unable to load the latest company detail. Showing available information.</div>
      )}

      <div className="candidate-company-job-toolbar">
        <label>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input type="search" placeholder="Search job title, or department..." />
        </label>
        <div>
          <button type="button">Department: All <i className="fa-solid fa-chevron-down"></i></button>
          <button type="button">Work type: All <i className="fa-solid fa-chevron-down"></i></button>
        </div>
      </div>

      <section className="candidate-company-open-position">
        <h2>Open Positions <span>({totalJobs})</span></h2>
        {jobsQuery.isLoading && <div className="candidate-company-list-state">Loading open positions...</div>}
        {jobsQuery.error && <div className="candidate-company-list-state error">Unable to load open positions. Please try again.</div>}
        {!jobsQuery.isLoading && !jobsQuery.error && jobs.length === 0 && (
          <div className="candidate-company-list-state">No open positions found for this company.</div>
        )}
        {!jobsQuery.isLoading && !jobsQuery.error && jobs.length > 0 && <div className="candidate-company-job-grid">
          {jobs.map((job) => (
            <article
              className="candidate-company-job-card"
              key={job.id}
              onClick={() => navigate(`/candidate/companies/${companyId}/jobs/${job.id}`)}
            >
              <header>
                <span className={job.employmentType === 'CONTRACT' ? 'contract' : ''}>
                  <i className="fa-solid fa-circle"></i>
                  {formatEmploymentType(job.employmentType)}
                </span>
                <button type="button" aria-label={`Open ${job.title}`}>
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
              </header>
              <h3>{job.title}</h3>
              <strong>{job.department || 'General'}</strong>
              <div className="candidate-company-job-meta">
                <span><i className="fa-solid fa-layer-group"></i>{'level' in job && job.level ? job.level : 'Any level'}</span>
                <span><i className="fa-solid fa-money-bill-wave"></i>{formatSalaryRange(job)}</span>
                <span><i className="fa-solid fa-calendar-days"></i>{formatDate(job.applicationDeadline)}</span>
                <span><i className="fa-solid fa-users"></i>{'applicantCount' in job ? `${job.applicantCount} applicants` : 'Open applications'}</span>
              </div>
              <footer>
                <span><i className="fa-solid fa-location-dot"></i>{job.location || 'Remote'}</span>
                <span><i className="fa-solid fa-building"></i>{'locationType' in job && job.locationType ? formatEmploymentType(job.locationType) : 'Flexible'}</span>
              </footer>
            </article>
          ))}
        </div>}
        <footer className="candidate-company-job-footer">
          <span>Showing {firstJobItem} to {lastJobItem} of {totalJobs} positions</span>
          <div className="candidate-company-pagination">
            <button
              type="button"
              aria-label="Previous jobs page"
              disabled={jobPage <= 1 || jobsQuery.isFetching || !jobsQuery.data}
              onClick={() => goToJobPage(jobPage - 1)}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            {jobPageItems.map((item, index) => item === 'ellipsis'
              ? <span key={`job-ellipsis-${index}`}>...</span>
              : (
                <button
                  type="button"
                  className={item === jobPage ? 'active' : ''}
                  disabled={jobsQuery.isFetching || !jobsQuery.data}
                  key={item}
                  onClick={() => goToJobPage(item)}
                >
                  {item}
                </button>
              ))}
            <button
              type="button"
              aria-label="Next jobs page"
              disabled={jobPage >= jobPageCount || jobsQuery.isFetching || !jobsQuery.data}
              onClick={() => goToJobPage(jobPage + 1)}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </footer>
      </section>
    </section>
  )
}
