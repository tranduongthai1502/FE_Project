import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { candidateCompanies, candidateCompanyJobs } from '../../domain/candidateData'
import { truncateCandidateText } from '../../application/candidateText'
import { useCandidateJobDetail } from '../../application/useCandidateCompanies'
import { hasUploadedResume } from '../../application/candidateResumeSession'

const requirements = [
  '5+ years of experience in ML or Backend systems.',
  'Proficiency in PyTorch, JAX, or TensorFlow.',
  'Strong understanding of Transformer architectures.',
  'Experience with RAG and vector databases.',
  'PhD or Masters in CS, Math, or Physics preferred.',
]

const benefits = ['Remote First', 'Equity Package', 'Premium Health']

export function CandidateJobDetailPage() {
  const navigate = useNavigate()
  const { companyId, jobId } = useParams<{ companyId?: string; jobId?: string }>()
  const company = candidateCompanies.find((item) => item.id === companyId)
  const fallbackJob = candidateCompanyJobs.find((item) => item.id === jobId)
  const jobQuery = useCandidateJobDetail(jobId)
  const job = jobQuery.data || fallbackJob
  const displayCompanyName = company?.name || 'Selected Company'

  useEffect(() => {
    if (!companyId || !jobId) return
    if (hasUploadedResume(jobId)) {
      navigate(`/candidate/companies/${companyId}/jobs/${jobId}/cv-score`, { replace: true })
    }
  }, [companyId, jobId, navigate])

  if (!companyId || !jobId) return <Navigate to="/candidate/companies" replace />

  return (
    <section className="candidate-job-detail-page">
      <nav className="candidate-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate('/candidate')}>
          <i className="fa-solid fa-house"></i>
          Home
        </button>
        <i className="fa-solid fa-chevron-right"></i>
        <button type="button" title={displayCompanyName} onClick={() => navigate(`/candidate/companies/${companyId}`)}>
          {truncateCandidateText(displayCompanyName)}
        </button>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Job Detail</strong>
      </nav>

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
              <p>
                {job.description || 'We are seeking a world-class Senior AI Engineer to spearhead our JobFusion Core R&D team. You will be responsible for architecting and deploying Large Language Models, RAGs, that power our intelligent talent-matching ecosystem. This role sits at the intersection of production-grade engineering and cutting-edge machine learning research.'}
              </p>
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
              <p>&quot;We invest in the people who build the future.&quot;</p>
              <div>
                {benefits.map((item) => (
                  <span key={item}><i className="fa-solid fa-briefcase"></i>{item}</span>
                ))}
              </div>
            </section>
          </article>
        </div>

        <aside className="candidate-application-status">
          <h2>Application Status</h2>
          <p>Review current pipeline or apply directly.</p>
          <button type="button" onClick={() => navigate(`/candidate/companies/${companyId}/jobs/${jobId}/upload-cv`)}>Apply Now</button>
        </aside>
      </div>}
    </section>
  )
}
