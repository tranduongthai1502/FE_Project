import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/core/components/Breadcrumb'

import { candidateApplicationApi } from '../../infrastructure/candidateApplicationApi'
import { candidateCompanies, candidateCompanyJobs } from '../../domain/candidateData'
import { truncateCandidateText } from '../../application/candidateText'
import { useCandidateJobDetail } from '../../application/useCandidateCompanies'
import { useCandidateCompanyDetail } from '../../application/useCandidateCompanies'
import { getCurrentCandidateId, getSavedResumeCandidateId } from '../../application/candidateResumeSession'

const requirements = [
  '5+ years of experience in ML or Backend systems.',
  'Proficiency in PyTorch, JAX, or TensorFlow.',
  'Strong understanding of Transformer architectures.',
  'Experience with RAG and vector databases.',
  'PhD or Masters in CS, Math, or Physics preferred.',
]

function stripHtmlTags(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim()
}

function sanitizeHtml(value?: string) {
  const source = String(value || '').trim()
  if (!source) return ''
  if (typeof window === 'undefined' || typeof document === 'undefined') return stripHtmlTags(source)

  const template = document.createElement('template')
  template.innerHTML = source

  template.content.querySelectorAll('script, style, iframe, object, embed, link, meta, base').forEach((node) => {
    node.remove()
  })

  template.content.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()
      const isEventHandler = name.startsWith('on')
      const isUnsafeUrl = ['href', 'src', 'xlink:href', 'formaction'].includes(name)
        && (/^(javascript|vbscript|data):/.test(value) || value.includes('javascript:'))

      if (isEventHandler || isUnsafeUrl || name === 'srcdoc') {
        element.removeAttribute(attribute.name)
      }
    })
  })

  return template.innerHTML.trim()
}

function formatApplicationDeadline(value?: string) {
  const source = String(value || '').trim()
  if (!source) return 'No deadline provided'

  const isoDateMatch = source.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    const isValidDate = (
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    )

    if (isValidDate) return `${day}/${month}/${year}`
  }

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return 'Invalid deadline'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getRequirementItems(value?: string) {
  const source = String(value || '').trim()
  if (!source) return requirements

  const listItems = Array.from(source.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => stripHtmlTags(match[1]))
    .filter(Boolean)

  if (listItems.length > 0) return listItems

  const plainItems = stripHtmlTags(source)
    .split(/\r?\n|[•▪]/)
    .map((item) => item.trim())
    .filter(Boolean)

  return plainItems.length > 0 ? plainItems : requirements
}

export function CandidateJobDetailPage() {
  const navigate = useNavigate()
  const { companyId, jobId } = useParams<{ companyId?: string; jobId?: string }>()
  const [viewApplicationError, setViewApplicationError] = useState('')
  const [isLoadingApplication, setIsLoadingApplication] = useState(false)
  const company = candidateCompanies.find((item) => item.id === companyId)
  const companyQuery = useCandidateCompanyDetail(companyId)
  const fallbackJob = candidateCompanyJobs.find((item) => item.id === jobId)
  const jobQuery = useCandidateJobDetail(jobId)
  const job = jobQuery.data || fallbackJob
  const hasExistingApplication = job?.flag === true
  const displayCompanyName = companyQuery.data?.name || company?.name || 'Selected Company'
  const safeJobDescriptionHtml = sanitizeHtml(job?.description)
  const safeBenefitsHtml = sanitizeHtml(job?.benefits)
  const applicationDeadline = formatApplicationDeadline(job?.applicationDeadline)
  const requirementItems = getRequirementItems(job?.requirements)

  const handleApplicationAction = async () => {
    if (!companyId || !jobId) return

    if (!hasExistingApplication) {
      navigate(`/candidate/companies/${companyId}/jobs/${jobId}/upload-cv`)
      return
    }

    const candidateId = getSavedResumeCandidateId(jobId) || getCurrentCandidateId()
    if (!candidateId) {
      setViewApplicationError('Unable to load your application because candidate information is missing.')
      return
    }

    setIsLoadingApplication(true)
    setViewApplicationError('')
    try {
      await candidateApplicationApi.getResumeByJobAndCandidate(jobId, candidateId)
      navigate(`/candidate/companies/${companyId}/jobs/${jobId}/cv-score`)
    } catch {
      setViewApplicationError('Unable to load your application. Please try again later.')
    } finally {
      setIsLoadingApplication(false)
    }
  }

  if (!companyId || !jobId) return <Navigate to="/candidate/companies" replace />

  return (
    <section className="candidate-job-detail-page">
      <Breadcrumb
        className="candidate-breadcrumb"
        items={[
          { label: 'Home', onClick: () => navigate('/candidate') },
          { label: 'Companies', onClick: () => navigate('/candidate/companies') },
          { label: truncateCandidateText(displayCompanyName), onClick: () => navigate(`/candidate/companies/${companyId}`) },
          { label: 'Job Detail' },
        ]}
      />

      <h1>{job?.title || (jobQuery.isLoading ? 'Loading job detail...' : 'Job Detail')}</h1>

      {jobQuery.error && (
        <div className="candidate-company-list-state error">Unable to load the latest job detail. Showing available information.</div>
      )}

      {job && <div className="candidate-job-detail-layout">
        <div className="candidate-job-detail-main">
          <article className="candidate-job-panel">
            <h2>General Information</h2>
            <div className="candidate-job-info-grid">
              <div>
                <span>Department</span>
                <strong>{job.department}</strong>
              </div>
              <div>
                <span>Employment Type</span>
                <strong>{job.employmentType || 'Part-time'}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{job.location || 'Office - Vietnam'}</strong>
              </div>
              <div>
                <span>Application Deadline</span>
                <strong>{applicationDeadline}</strong>
              </div>
              <div>
                <span>Salary Range</span>
                <strong>{job.salaryMin !== undefined || job.salaryMax !== undefined ? `$${job.salaryMin ?? 0} - $${job.salaryMax ?? 0}` : ('salaryRange' in job ? job.salaryRange : '$1,000 - $1,500')}</strong>
              </div>
            </div>
          </article>

          <article className="candidate-job-panel">
            <h2>Technical Overview</h2>
            <section>
              <h3>Job Description</h3>
              {safeJobDescriptionHtml ? (
                <div className="candidate-job-rich-html" dangerouslySetInnerHTML={{ __html: safeJobDescriptionHtml }} />
              ) : (
                <p>No description provided.</p>
              )}
            </section>

            <section>
              <h3>Key Requirements</h3>
              <div className="candidate-job-requirements">
                {requirementItems.map((item) => (
                  <span key={item}>
                    <i className="fa-regular fa-circle-check"></i>
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="candidate-job-benefits">
              <h3>Company Benefits</h3>
              {safeBenefitsHtml ? (
                <div className="candidate-job-rich-html" dangerouslySetInnerHTML={{ __html: safeBenefitsHtml }} />
              ) : (
                <p>No benefits provided.</p>
              )}
            </section>
          </article>
        </div>

        <aside className="candidate-application-status">
          <h2>Application Status</h2>
          <p>Review current pipeline or apply directly.</p>
          <button type="button" disabled={isLoadingApplication} onClick={handleApplicationAction}>
            {isLoadingApplication ? 'Loading...' : hasExistingApplication ? 'View Application' : 'Apply Now'}
          </button>
          {viewApplicationError && <small>{viewApplicationError}</small>}
        </aside>
      </div>}
    </section>
  )
}
