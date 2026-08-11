import { useEffect, useState, type CSSProperties } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/core/components/Breadcrumb'

import { candidateApplicationApi } from '../../infrastructure/candidateApplicationApi'
import { candidateCompanies, candidateCompanyJobs } from '../../domain/candidateData'
import { useCandidateJobDetail } from '../../application/useCandidateCompanies'
import { getCurrentCandidateId, getSavedResumeCandidateId } from '../../application/candidateResumeSession'

type ResumeAnalysis = {
  fileName?: string
  fileUrl?: string
  matchingScore?: number
  candidateSelfScore?: number
  score?: number
  status?: string
  appliedAt?: string
  createdAt?: string
  cvImprovementSuggestions?: {
    overallFeedback?: string
    suggestions?: Array<{ criterionName?: string; feedback?: string; improvementSteps?: string[] }>
  }
  parsedData?: {
    skills?: string[]
  } | null
}

function getScore(data: ResumeAnalysis | null) {
  const score = Number(data?.matchingScore ?? data?.candidateSelfScore ?? data?.score)
  return Number.isFinite(score) ? Math.round(score) : undefined
}

function getResumePayload(payload: any): ResumeAnalysis {
  return payload?.data?.data || payload?.data || payload?.result || payload
}

function isResumeParsed(data: ResumeAnalysis | null) {
  return Boolean(data?.parsedData)
}

function formatAppliedDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
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
  const displayCompanyName = company?.name || ''
  const score = getScore(analysis)
  const suggestions = analysis?.cvImprovementSuggestions?.suggestions || []
  const skills = analysis?.parsedData?.skills?.slice(0, 4) || []
  const appliedDate = formatAppliedDate(analysis?.appliedAt || analysis?.createdAt)

  useEffect(() => {
    if (!jobId) return
    const candidateId = getSavedResumeCandidateId(jobId) || getCurrentCandidateId()

    if (!candidateId) {
      setError('Unable to load CV score because candidate information is missing.')
      setIsLoading(false)
      return
    }

    let isMounted = true
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined

    const pollResume = async () => {
      try {
        const data = getResumePayload(await candidateApplicationApi.getResumeByJobAndCandidate(jobId, candidateId))
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
      <Breadcrumb
        className="candidate-breadcrumb"
        items={[
          { label: 'Home', onClick: () => navigate('/candidate') },
          { label: 'Companies', onClick: () => navigate('/candidate/companies') },
          { label: 'View CV Score & Suggestions' },
        ]}
      />

      <header className="candidate-cv-score-title">
        <div>
          <h1>{job?.title || (jobQuery.isLoading ? 'Loading job detail...' : 'Job Detail')}</h1>
          <p>
            {displayCompanyName && <><i className="fa-solid fa-building"></i> {displayCompanyName}</>}
            {job?.location && <><i className="fa-solid fa-location-dot"></i> {job.location}</>}
            {appliedDate && <><i className="fa-solid fa-calendar"></i> Applied: {appliedDate}</>}
          </p>
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
            </article>

            <article className="candidate-ai-resume-insights">
              <h2><i className="fa-solid fa-wand-magic-sparkles"></i> AI Resume Insights</h2>
              {analysis?.cvImprovementSuggestions?.overallFeedback && <p>{analysis.cvImprovementSuggestions.overallFeedback}</p>}
              {skills.length > 0 && (
                <section>
                  <h3>Skills:</h3>
                  <div>
                    {skills.map((skill) => <span key={skill}>{skill}</span>)}
                  </div>
                </section>
              )}
              <div className="candidate-insight-grid">
                {suggestions.map((item) => (
                  <section key={item.criterionName || item.feedback}>
                    {item.criterionName && <h3><i className="fa-solid fa-sparkles"></i>{item.criterionName}</h3>}
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
              {score !== undefined && (
                <div style={{ '--score': `${score * 3.6}deg` } as CSSProperties}>
                  <strong>{score}%</strong>
                </div>
              )}
            </article>
            <article className="candidate-submitted-documents">
              <h2>Submitted Documents</h2>
              {analysis?.fileName && <button type="button"><i className="fa-regular fa-file-pdf"></i>{analysis.fileName}<i className="fa-solid fa-download"></i></button>}
            </article>
          </aside>
        </div>
      )}
    </section>
  )
}
