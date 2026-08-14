import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getHttpErrorToastMessage } from '@/core/api/axiosErrorHandler'
import { Breadcrumb } from '@/core/components/Breadcrumb'

import { candidateApplicationApi } from '../../infrastructure/candidateApplicationApi'
import { candidateCompanies, candidateCompanyJobs } from '../../domain/candidateData'
import { truncateCandidateText } from '../../application/candidateText'
import { useCandidateCompanyDetail, useCandidateJobDetail } from '../../application/useCandidateCompanies'
import { markResumeUploaded, readCandidateIdFromPayload, saveResumeCandidateId, getCurrentCandidateId, getSavedResumeCandidateId } from '../../application/candidateResumeSession'

const allowedCvExtensions = ['pdf', 'doc', 'docx']
const maxCvFileSize = 5 * 1024 * 1024
const resumePollingIntervalMs = 5000
const maxResumePollingAttempts = 5
const resumePollingTimeoutMessage = 'Token limit reached. Please try again later.'

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
    suggestions?: unknown
    skillGaps?: unknown
  }
  skillGaps?: unknown
  parsedData?: {
    skills?: unknown
    technicalSkills?: unknown
    softSkills?: unknown
  } | Record<string, unknown> | null
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

function toTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
  }

  return []
}

function getParsedSkills(data: ResumeAnalysis | null): string[] {
  const parsedData = data?.parsedData
  if (!parsedData || typeof parsedData !== 'object') return []

  return Array.from(new Set([
    ...toTextList(parsedData.skills),
    ...toTextList(parsedData.technicalSkills),
    ...toTextList(parsedData.softSkills),
  ]))
}

function getSuggestions(data: ResumeAnalysis | null): Array<{ criterionName?: string; feedback?: string; improvementSteps?: unknown }> {
  const suggestions = data?.cvImprovementSuggestions?.suggestions
  return Array.isArray(suggestions) ? suggestions : []
}

function formatAppliedDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function getFileExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || ''
}

export function CandidateCvScorePage({
  triggerToast,
}: {
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const navigate = useNavigate()
  const { companyId, jobId } = useParams<{ companyId?: string; jobId?: string }>()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingCv, setIsUploadingCv] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState('')
  const company = candidateCompanies.find((item) => item.id === companyId)
  const companyQuery = useCandidateCompanyDetail(companyId)
  const fallbackJob = candidateCompanyJobs.find((item) => item.id === jobId)
  const jobQuery = useCandidateJobDetail(jobId)
  const job = jobQuery.data || fallbackJob
  const displayCompanyName = companyQuery.data?.name || company?.name || ''
  const breadcrumbCompanyName = displayCompanyName || 'Company Detail'
  const displayJobTitle = job?.title || 'Job Detail'
  const score = getScore(analysis)
  const suggestions = getSuggestions(analysis)
  const skillGaps = toTextList(analysis?.cvImprovementSuggestions?.skillGaps || analysis?.skillGaps)
  const skills = getParsedSkills(analysis)
  const appliedDate = formatAppliedDate(analysis?.appliedAt || analysis?.createdAt)

  const handleUpdateCvFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !jobId) return

    const extension = getFileExtension(file)
    if (!allowedCvExtensions.includes(extension)) {
      setError('Please upload a PDF, DOC, or DOCX file.')
      return
    }

    if (file.size > maxCvFileSize) {
      setError('Maximum file size is 5MB.')
      return
    }

    setIsUploadingCv(true)
    setError('')
    try {
      const uploadResult = await candidateApplicationApi.uploadCvForJob(jobId, file)
      const candidateId = readCandidateIdFromPayload(uploadResult)
      if (candidateId) saveResumeCandidateId(jobId, candidateId)
      markResumeUploaded(jobId)
      setAnalysis(getResumePayload(uploadResult))
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (uploadError) {
      setError(getHttpErrorToastMessage(uploadError, { fallbackMessage: 'Upload failed. Please try again.' }))
    } finally {
      setIsUploadingCv(false)
    }
  }

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
    let pollingAttempts = 0

    const stopPollingWithTokenError = () => {
      setError(resumePollingTimeoutMessage)
      setIsLoading(false)
      triggerToast?.(resumePollingTimeoutMessage, 'error')
    }

    const pollResume = async () => {
      try {
        pollingAttempts += 1
        const data = getResumePayload(await candidateApplicationApi.getResumeByJobAndCandidate(jobId, candidateId))
        if (!isMounted) return
        setAnalysis(data)
        setError('')

        if (!isResumeParsed(data)) {
          if (pollingAttempts >= maxResumePollingAttempts) {
            stopPollingWithTokenError()
            return
          }

          timeoutId = window.setTimeout(pollResume, resumePollingIntervalMs)
          return
        }

        setIsLoading(false)
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
  }, [jobId, reloadKey, triggerToast])

  if (!companyId || !jobId) return <Navigate to="/candidate/companies" replace />

  return (
    <section className="candidate-cv-score-page">
      <Breadcrumb
        className="candidate-breadcrumb"
        items={[
          { label: 'Home', onClick: () => navigate('/candidate') },
          { label: 'Companies', onClick: () => navigate('/candidate/companies') },
          {
            label: truncateCandidateText(breadcrumbCompanyName),
            onClick: () => navigate(`/candidate/companies/${companyId}`),
          },
          {
            label: truncateCandidateText(displayJobTitle),
            onClick: () => navigate(`/candidate/companies/${companyId}/jobs/${jobId}`),
          },
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
          <button type="button" disabled={isUploadingCv} onClick={() => inputRef.current?.click()}>
            {isUploadingCv ? 'Uploading...' : 'Update Application'}
          </button>
        </div>
      </header>
      <input
        ref={inputRef}
        className="candidate-cv-hidden-input"
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleUpdateCvFile}
      />

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
                    <p>{item.feedback || toTextList(item.improvementSteps).join(' ')}</p>
                  </section>
                ))}
              </div>
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
