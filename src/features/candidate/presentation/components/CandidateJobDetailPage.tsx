import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/core/components/Breadcrumb'

import { candidateApplicationApi } from '../../infrastructure/candidateApplicationApi'
import { candidateCompanies, candidateCompanyJobs } from '../../domain/candidateData'
import { truncateCandidateText } from '../../application/candidateText'
import { useCandidateJobDetail } from '../../application/useCandidateCompanies'
import { getCurrentCandidateId, getSavedResumeCandidateId } from '../../application/candidateResumeSession'

const requirements = [
  '5+ years of experience in ML or Backend systems.',
  'Proficiency in PyTorch, JAX, or TensorFlow.',
  'Strong understanding of Transformer architectures.',
  'Experience with RAG and vector databases.',
  'PhD or Masters in CS, Math, or Physics preferred.',
]

function stripParagraphTags(value?: string) {
  return String(value || '')
    .replace(/<\/?p[^>]*>/gi, '')
    .trim()
}

function getBenefitItems(value?: string) {
  const normalized = stripParagraphTags(value)
  if (!normalized) return []

  return normalized
    .split(/\r?\n|<br\s*\/?>|[,;]+/gi)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function CandidateJobDetailPage() {
  const navigate = useNavigate()
  const { companyId, jobId } = useParams<{ companyId?: string; jobId?: string }>()
  const [viewApplicationError, setViewApplicationError] = useState('')
  const [isLoadingApplication, setIsLoadingApplication] = useState(false)
  const company = candidateCompanies.find((item) => item.id === companyId)
  const fallbackJob = candidateCompanyJobs.find((item) => item.id === jobId)
  const jobQuery = useCandidateJobDetail(jobId)
  const job = jobQuery.data || fallbackJob
  const displayCompanyName = company?.name || 'Selected Company'
  const jobDescription = stripParagraphTags(job?.description)
  const benefitItems = getBenefitItems(job?.benefits)
  const hasExistingApplication = Boolean(job && 'flag' in job && job.flag)

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
                <strong>{job.applicationDeadline || '12/08/2026'}</strong>
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
              <p>{jobDescription}</p>
            </section>

            <section>
              <h3>Key Requirements</h3>
              <div className="candidate-job-requirements">
                {requirements.map((item) => (
                  <span key={item}>
                    <i className="fa-regular fa-circle-check"></i>
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="candidate-job-benefits">
              <h3>Company Benefits</h3>
              <div>
                {benefitItems.map((item) => (
                  <span key={item}><i className="fa-solid fa-briefcase"></i>{item}</span>
                ))}
              </div>
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
