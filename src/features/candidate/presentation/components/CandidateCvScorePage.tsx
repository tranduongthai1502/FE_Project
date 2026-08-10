import { useEffect, useState, type CSSProperties } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { candidateApplicationApi } from '../../infrastructure/candidateApplicationApi'
import { candidateCompanies, candidateCompanyJobs } from '../../domain/candidateData'
import { useCandidateJobDetail } from '../../application/useCandidateCompanies'

type ResumeAnalysis = {
  fileName?: string
  fileUrl?: string
  matchingScore?: number
  candidateSelfScore?: number
  score?: number
  status?: string
  skillGaps?: Array<{ criterionName?: string; feedback?: string; improvementSteps?: string[] }>
  cvImprovementSuggestions?: {
    overallFeedback?: string
    suggestions?: Array<{ criterionName?: string; feedback?: string; improvementSteps?: string[] }>
  }
  parsedData?: {
    skills?: string[]
  } | null
}

function getScore(data: ResumeAnalysis | null) {
  const score = Number(data?.matchingScore ?? data?.candidateSelfScore ?? data?.score ?? 85)
  return Number.isFinite(score) ? Math.round(score) : 85
}

function getResumePayload(payload: any): ResumeAnalysis {
  return payload?.data?.data || payload?.data || payload?.result || payload
}

function isResumeParsed(data: ResumeAnalysis | null) {
  return Boolean(data?.parsedData)
}

export function CandidateCvScorePage() {
  const navigate = useNavigate()
  const { companyId, jobId } = useParams<{ companyId?: string; jobId?: string }>()
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const company = candidateCompanies.find((item) => item.id === companyId)
  const fallbackJob = candidateCompanyJobs.find((item) => item.id === jobId)
  const jobQuery = useCandidateJobDetail(jobId)
  const job = jobQuery.data || fallbackJob
  const displayCompanyName = company?.name || 'Selected Company'
  const score = getScore(analysis)
  const suggestions = analysis?.skillGaps || analysis?.cvImprovementSuggestions?.suggestions || []
  const skills = analysis?.parsedData?.skills?.slice(0, 4) || ['React', 'TypeScript', 'Front-end', 'CI/CD']

  useEffect(() => {
    if (!jobId) return

    let isMounted = true
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined

    const pollResume = async () => {
      try {
        const data = getResumePayload(await candidateApplicationApi.getResumeByJobId(jobId))
        if (!isMounted) return
        setAnalysis(data)
        setError('')
        setIsLoading(false)

        if (!isResumeParsed(data)) {
          timeoutId = window.setTimeout(pollResume, 4000)
        }
      } catch {
        if (!isMounted) return
        setError('Unable to load CV score. Please try again later.')
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    pollResume()

    return () => {
      isMounted = false
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [jobId])

  if (!companyId || !jobId) return <Navigate to="/candidate/companies" replace />

  return (
    <section className="candidate-cv-score-page">
      <nav className="candidate-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate('/candidate')}>
          <i className="fa-solid fa-house"></i>
          Home
        </button>
        <i className="fa-solid fa-chevron-right"></i>
        <button type="button" onClick={() => navigate('/candidate/companies')}>My Applications</button>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>View CV Score & Suggestions</strong>
      </nav>

      <header className="candidate-cv-score-title">
        <div>
          <h1>{job?.title || (jobQuery.isLoading ? 'Loading job detail...' : 'Job Detail')}</h1>
          <p><i className="fa-solid fa-building"></i> {displayCompanyName} <i className="fa-solid fa-location-dot"></i> {job?.location || 'Remote'} <i className="fa-solid fa-calendar"></i> Applied: Oct 24, 2023</p>
        </div>
        <div>
          <button type="button" onClick={() => navigate(`/candidate/companies/${companyId}/jobs/${jobId}`)}>View Job Description</button>
          <button type="button" onClick={() => navigate(`/candidate/companies/${companyId}/jobs/${jobId}/upload-cv`)}>Update Application</button>
        </div>
      </header>

      {isLoading && <div className="candidate-cv-score-message">Loading CV analysis...</div>}
      {error && <div className="candidate-cv-score-message error">{error}</div>}

      {!isLoading && !error && (
        <div className="candidate-cv-score-layout">
          <main>
            <article className="candidate-application-progress">
              <h2>Application Status</h2>
              <div className="candidate-progress-line">
                <span className="done"><i className="fa-solid fa-check"></i></span>
                <span className="active"><i className="fa-solid fa-circle-dot"></i></span>
                <span><i className="fa-regular fa-message"></i></span>
                <span><i className="fa-regular fa-heart"></i></span>
              </div>
              <div className="candidate-progress-labels">
                <strong>Applied</strong>
                <strong>Screening</strong>
                <strong>Interview</strong>
                <strong>Offer</strong>
              </div>
              <p><i className="fa-regular fa-clock"></i> Your application is currently being reviewed by the hiring team. We typically expect this phase to take 3-5 business days. You&apos;re doing great!</p>
            </article>

            <article className="candidate-ai-resume-insights">
              <h2><i className="fa-solid fa-wand-magic-sparkles"></i> AI Resume Insights</h2>
              <p>Our intelligent system has analyzed your resume against the job description. Here are some constructive suggestions to help your profile stand out even more.</p>
              <section>
                <h3>Missing Keywords:</h3>
                <div>
                  {skills.map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              </section>
              <div className="candidate-insight-grid">
                {(suggestions.length ? suggestions.slice(0, 2) : [
                  { criterionName: 'Impact Metrics', feedback: 'Quantify your impact in the experience section. Adding specific numbers gives your application stronger context.' },
                  { criterionName: 'Design Systems', feedback: 'Consider elaborating on your specific role in building or maintaining the design system mentioned in your previous role.' },
                ]).map((item) => (
                  <section key={item.criterionName || item.feedback}>
                    <h3><i className="fa-solid fa-sparkles"></i>{item.criterionName || 'Suggestion'}</h3>
                    <p>{item.feedback || item.improvementSteps?.join(' ')}</p>
                  </section>
                ))}
              </div>
              <button type="button" onClick={() => navigate(`/candidate/companies/${companyId}/jobs/${jobId}/upload-cv`)}>Update CV <i className="fa-solid fa-upload"></i></button>
            </article>
          </main>

          <aside>
            <article className="candidate-fit-score">
              <h2>Fit Score</h2>
              <div style={{ '--score': `${score * 3.6}deg` } as CSSProperties}>
                <strong>{score}%</strong>
              </div>
              <p>Great match! Your skills in UX Research and Prototyping align perfectly with the core requirements.</p>
            </article>
            <article className="candidate-submitted-documents">
              <h2>Submitted Documents</h2>
              <button type="button"><i className="fa-regular fa-file-pdf"></i>{analysis?.fileName || 'Resume_v4.pdf'}<i className="fa-solid fa-download"></i></button>
              <button type="button"><i className="fa-solid fa-link"></i>Portfolio Link<i className="fa-solid fa-up-right-from-square"></i></button>
            </article>
          </aside>
        </div>
      )}
    </section>
  )
}
