import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resolveApiBaseUrl } from '@/core/api/axiosClient'
import type { Candidate, CandidateDetail } from '../../domain/candidate.types'
import { mockCandidates } from './useCandidateListController'
import { hrCandidateApplicationApi } from '../../infrastructure/hrCandidateApplicationApi'

export const mockCandidateDetails: Record<string, CandidateDetail> = {
  'cand-2': {
    ...mockCandidates[1], // Alex Thompson
    email: 'alex.thompson@example.com',
    phone: '+1 (555) 012-3456',
    location: 'San Francisco, CA',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    scoringStatus: 'COMPLETED',
    extractedCv: {
      summary: 'Senior Software Engineer with 6+ years of experience designing scalable microservices, cloud infrastructure (AWS/GCP), and modern React/TypeScript frontend architectures.',
      cvFileName: 'Original_CV_Thompson.pdf',
      cvDownloadUrl: '#',
      experience: [
        {
          title: 'Senior Software Engineer',
          company: 'TechPulse Global',
          duration: 'JAN 2021 - PRESENT',
          bullets: [
            'Led the migration of legacy monolithic architecture to high-performance microservices using Node.js and AWS.',
            'Mentored a team of 5 junior developers in agile best practices and test-driven development methodologies.',
          ],
        },
        {
          title: 'Software Developer',
          company: 'Innovate Soft',
          duration: 'JUNE 2018 - DEC 2020',
          bullets: [
            'Designed and implemented responsive UI components using React and Tailwind CSS, improving user engagement by 22%.',
            'Optimized database queries reducing load times for analytical dashboards by 40% using PostgreSQL indexing strategies.',
          ],
        },
      ],
      education: [
        {
          degree: 'M.S. in Computer Science',
          institution: 'Stanford University',
          year: '2016 - 2018',
          description: 'Focus on Artificial Intelligence and Machine Learning. Thesis on Scalable Microservices.',
        },
      ],
      certifications: [
        { title: 'AWS Solutions Architect', exp: 'AUG 2025' },
        { title: 'Google Cloud Prof Dev', exp: 'DEC 2024' },
      ],
      skills: ['React.js', 'TypeScript', 'Node.js', 'GraphQL', 'Kubernetes', 'AWS', 'Python'],
    },
    componentAnalysis: [
      { category: 'Technical Skills', score: 92, weight: 35, analysis: 'Strong alignment with React, TypeScript, and AWS cloud ecosystem requirements.' },
      { category: 'Relevant Experience', score: 88, weight: 30, analysis: '6+ years in full-stack cloud applications matches senior requirements.' },
      { category: 'Education & Certifications', score: 85, weight: 15, analysis: 'B.S. Computer Science from top tier university.' },
      { category: 'Soft Skills & Leadership', score: 80, weight: 20, analysis: 'Demonstrated team lead experience and technical communication skills.' },
    ],
    aiJustification: [
      'Candidate demonstrates extensive hands-on experience with core technology stack (React, Node.js, AWS).',
      'Proven track record leading architectural decisions and microservices deployment.',
      'Strong problem-solving background evidenced by microservices availability improvements.',
    ],
    keySkillGaps: [
      'Limited explicit exposure to Python / AI pipeline integration mentioned in secondary job requirements.',
      'Needs verification of system security compliance standards (SOC2 / ISO27001).',
    ],
  },
  'cand-1': {
    ...mockCandidates[0], // Alex Rivera
    email: 'alex.rivera@cloudtech.io',
    phone: '+1 (555) 987-6543',
    location: 'Austin, TX',
    scoringStatus: 'COMPLETED',
    extractedCv: {
      summary: 'Senior Cloud Architect specializing in multi-cloud enterprise deployments, Terraform infrastructure as code, and AI model serving infrastructure.',
      cvFileName: 'Original_CV_Rivera.pdf',
      cvDownloadUrl: '#',
      experience: [
        {
          title: 'Lead Cloud Architect',
          company: 'CloudScale Inc',
          duration: '2020 - PRESENT',
          bullets: [
            'Designed enterprise cloud platform serving over 50M daily active users across AWS and GCP.',
            'Architected multi-region Kubernetes clusters with automated Terraform deployment pipelines.',
          ],
        },
      ],
      education: [
        {
          degree: 'M.S. Computer Engineering',
          institution: 'UT Austin',
          year: '2016 - 2018',
          description: 'Specialization in Cloud Computing and Distributed Systems.',
        },
      ],
      certifications: [
        { title: 'AWS Certified Solutions Architect Professional', exp: 'OCT 2026' },
        { title: 'CKA Certified Kubernetes Administrator', exp: 'JAN 2025' },
      ],
      skills: ['Terraform', 'AWS', 'GCP', 'Kubernetes', 'Python', 'Go', 'System Architecture'],
    },
    componentAnalysis: [
      { category: 'Technical Skills', score: 96, weight: 40, analysis: 'Expert level Terraform and Cloud Infrastructure capabilities.' },
      { category: 'System Design', score: 94, weight: 35, analysis: 'Proven large scale distributed system architecture.' },
      { category: 'Leadership', score: 90, weight: 25, analysis: 'Led enterprise architectural governance team.' },
    ],
    aiJustification: [
      'Exceptional architectural match for Cloud Architect role with 94% overall suitability score.',
      'Deep expertise in enterprise cloud migrations and cost optimization.',
    ],
    keySkillGaps: [
      'Minor gap in frontend web development frameworks (not critical for Cloud Architect).',
    ],
  },
}

export type DetailTab = 'extracted' | 'scoring'

const emptyExtractedCv = {
  summary: '',
  experience: [],
  education: [],
  certifications: [],
  skills: [],
  cvFileName: '',
  cvDownloadUrl: '',
}

function getResumePayload(payload: any) {
  return payload?.data?.data || payload?.data || payload?.result || payload?.resume || payload
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function firstArray(...values: unknown[]) {
  return values.find((value) => Array.isArray(value)) as any[] | undefined
}

function toText(value: unknown, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

function toUrlText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCvUrl(value: unknown) {
  const url = toUrlText(value)
  if (!url || url === '#' || url.toLowerCase() === 'null' || url.toLowerCase() === 'undefined') return ''
  if (/^(https?:|blob:|data:)/i.test(url)) return url
  if (url.startsWith('/')) return `${resolveApiBaseUrl()}${url}`
  return url
}

function withPdfCacheKey(url: string, cacheKey?: unknown) {
  const normalizedUrl = normalizeCvUrl(url)
  if (!normalizedUrl || /^(blob:|data:)/i.test(normalizedUrl)) return normalizedUrl

  const key = toUrlText(cacheKey)
  if (!key) return normalizedUrl

  try {
    const nextUrl = new URL(normalizedUrl)
    nextUrl.searchParams.set('cv_cache_key', key)
    return nextUrl.toString()
  } catch {
    const separator = normalizedUrl.includes('?') ? '&' : '?'
    return `${normalizedUrl}${separator}cv_cache_key=${encodeURIComponent(key)}`
  }
}

function toCandidateSummary(candidate: any, fallbackId: string): Candidate {
  return {
    id: String(candidate?.id || fallbackId),
    candidateId: candidate?.candidateId ? String(candidate.candidateId) : undefined,
    jobId: candidate?.jobId ? String(candidate.jobId) : undefined,
    name: toText(candidate?.name, 'Candidate'),
    targetJob: toText(candidate?.targetJob, '-'),
    matchScore: Number(candidate?.matchScore) || 0,
    recruitmentStage: toText(candidate?.recruitmentStage, 'Screening'),
    dateApplied: toText(candidate?.dateApplied, '-'),
    reviewed: Boolean(candidate?.reviewed),
  }
}

function normalizeComponentAnalysisItem(item: any) {
  return {
    category: toText(item?.category || item?.criteriaCategory || item?.criteria_category),
    score: Number(item?.score ?? item?.matchingScore ?? item?.matching_score ?? item?.value ?? 0) || 0,
    weight: Number(item?.weight ?? item?.weightPercent ?? item?.weight_percent ?? item?.maxScore ?? item?.max_score ?? 0) || 0,
    analysis: toText(item?.criterionName || item?.criterion_name || item?.critionName || item?.crition_name),
  }
}

function isWeightedComponentAnalysisItem(item: any) {
  return Boolean(
    item &&
    typeof item === 'object' &&
    (item.category || item.criteriaCategory || item.criteria_category || item.criterionName || item.criterion_name || item.critionName || item.crition_name) &&
    (item.weight !== undefined || item.weightPercent !== undefined || item.weight_percent !== undefined || item.maxScore !== undefined || item.max_score !== undefined)
  )
}

function hasScoreAndCriterion(item: any) {
  return Boolean(
    item &&
    typeof item === 'object' &&
    (item.score !== undefined || item.matchingScore !== undefined || item.matching_score !== undefined) &&
    (item.category || item.criteriaCategory || item.criteria_category || item.criterionName || item.criterion_name || item.critionName || item.crition_name)
  )
}

function mapResumeDetailToCandidateDetail(base: CandidateDetail, payload: any): CandidateDetail {
  const resume = getResumePayload(payload)
  const parsedData = resume?.parsedData || resume?.parsed_data || resume?.extractedCv || resume?.extracted_cv || {}
  const hasParsedData = Boolean(resume?.parsedData || resume?.parsed_data || resume?.extractedCv || resume?.extracted_cv)
  const profile = parsedData?.profile || parsedData?.personalInfo || parsedData?.personal_info || parsedData?.candidate || {}
  const score = Number(resume?.matchingScore ?? resume?.candidateSelfScore ?? resume?.score ?? 0)
  const suggestions = resume?.cvImprovementSuggestions || resume?.cv_improvement_suggestions || resume?.reasoning || {}
  const rawSuggestionItems = asArray(firstArray(
    suggestions,
    suggestions?.suggestions,
    suggestions?.items,
    suggestions?.data,
    suggestions?.criteria,
    suggestions?.components,
    resume?.skillGaps,
    resume?.skill_gaps,
  ))
  const suggestionItems = rawSuggestionItems.filter((item) => !isWeightedComponentAnalysisItem(item) && !hasScoreAndCriterion(item))
  const experience = asArray(parsedData?.experience || parsedData?.workExperience || parsedData?.work_experience).map((item) => ({
    title: toText(item?.title || item?.position || item?.role),
    company: toText(item?.company || item?.companyName || item?.company_name),
    duration: toText(item?.duration || item?.period || item?.dateRange || item?.date_range),
    description: toText(item?.description),
    bullets: asArray(item?.bullets || item?.responsibilities || item?.achievements).map((bullet) => toText(bullet)).filter(Boolean),
  }))
  const education = asArray(parsedData?.education).map((item) => ({
    degree: toText(item?.degree || item?.major),
    institution: toText(item?.institution || item?.school || item?.university),
    year: toText(item?.year || item?.graduationYear || item?.graduation_year || item?.duration || item?.dateRange || item?.date_range),
    description: toText(item?.description),
  }))
  const certifications = asArray(parsedData?.certifications || parsedData?.certificates).map((item) => ({
    title: toText(item?.title || item?.name),
    exp: toText(item?.exp || item?.expiresAt || item?.expires_at || item?.year),
  }))
  const skills = asArray(parsedData?.skills).map((skill) => toText(skill)).filter(Boolean)
  const rawComponentAnalysis = asArray(firstArray(
    resume?.componentAnalysis,
    resume?.component_analysis,
    resume?.componentScores,
    resume?.component_scores,
    resume?.scoringBreakdown,
    resume?.scoring_breakdown,
    resume?.scoreBreakdown,
    resume?.score_breakdown,
    resume?.criteriaScores,
    resume?.criteria_scores,
    parsedData?.componentAnalysis,
    parsedData?.component_analysis,
    parsedData?.scoringBreakdown,
    parsedData?.scoring_breakdown,
    suggestions,
    suggestions?.suggestions,
    suggestions?.criteria,
    suggestions?.components,
  ))
  const weightedSuggestionComponents = rawSuggestionItems.filter((item) => isWeightedComponentAnalysisItem(item) || hasScoreAndCriterion(item))
  const componentSource = rawComponentAnalysis.length > 0
    ? rawComponentAnalysis
    : weightedSuggestionComponents
  const componentAnalysis = componentSource
    .map(normalizeComponentAnalysisItem)
    .filter((item) => item.category || item.score || item.weight || item.analysis)
  const suggestionComponentAnalysis = suggestionItems.map((item) => {
    const scoreOutOfTen = Number(item?.score ?? 0) || 0
    return {
      category: '',
      score: Math.max(0, Math.min(100, scoreOutOfTen * 10)),
      weight: 10,
      analysis: toText(item?.criterionName || item?.criterion_name),
    }
  })
  const aiJustification = asArray(resume?.aiJustification || resume?.ai_justification || suggestions?.strengths || (suggestions?.overallFeedback ? [suggestions.overallFeedback] : []))
    .map((item) => toText(item))
    .filter(Boolean)
  const keySkillGaps = rawSuggestionItems
    .map((item) => toText(item?.feedback || item))
    .filter(Boolean)

  return {
    ...base,
    candidateId: toText(resume?.candidateId || resume?.candidate_id || resume?.userId || resume?.user_id, base.candidateId),
    name: toText(profile?.fullName || profile?.full_name || profile?.name || parsedData?.fullName || parsedData?.full_name || resume?.candidateName || resume?.candidate_name, base.name),
    email: toText(profile?.email || parsedData?.email || resume?.email, base.email),
    phone: toText(profile?.phone || profile?.phoneNumber || profile?.phone_number || parsedData?.phone || resume?.phone, base.phone),
    location: toText(profile?.location || profile?.address || parsedData?.location || parsedData?.address || resume?.location, base.location),
    targetJob: toText(resume?.jobTitle || resume?.job_title, base.targetJob),
    avatarUrl: '',
    matchScore: Number.isFinite(score) ? Math.round(score) : 0,
    scoringStatus: hasParsedData ? 'COMPLETED' : base.scoringStatus,
    extractedCv: {
      summary: toText(parsedData?.summary || parsedData?.professionalSummary || parsedData?.professional_summary),
      cvFileName: toText(resume?.fileName || resume?.file_name || resume?.originalFileName || resume?.original_file_name),
      cvDownloadUrl: withPdfCacheKey(
        resume?.fileUrl || resume?.file_url || resume?.cvDownloadUrl || resume?.cv_download_url,
        resume?.updatedAt || resume?.updated_at || resume?.id,
      ),
      experience,
      education,
      certifications,
      skills,
    },
    componentAnalysis: componentAnalysis.length ? componentAnalysis : suggestionComponentAnalysis,
    aiJustification,
    keySkillGaps,
  }
}

export function useCandidateDetailController(
  candidateId?: string,
  triggerToast?: (message: string, type?: 'success' | 'error') => void,
) {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<DetailTab>('extracted')
  const [candidateState, setCandidateState] = useState<Record<string, CandidateDetail>>({})
  const queryClient = useQueryClient()
  const resumeJobId = searchParams.get('jobId') || ''
  const resumeCandidateId = searchParams.get('candidateId') || ''

  const baseCandidate = useMemo(() => {
    const id = candidateId || 'cand-2'
    if (candidateState[id]) return candidateState[id]

    const mockCandidate = mockCandidates.find((c) => c.id === id)
    const baseCandidate = toCandidateSummary(mockCandidate || { id, name: 'Candidate' }, id)
    baseCandidate.jobId = resumeJobId || baseCandidate.jobId
    baseCandidate.candidateId = resumeCandidateId || baseCandidate.candidateId
    const details = mockCandidateDetails[id]
    const useMockCv = !baseCandidate.jobId || !baseCandidate.candidateId

    return {
      ...baseCandidate,
      id,
      email: useMockCv ? details?.email || '' : '',
      phone: useMockCv ? details?.phone || '' : '',
      location: useMockCv ? details?.location || '' : '',
      avatarUrl: useMockCv ? details?.avatarUrl : '',
      scoringStatus: useMockCv && details ? details.scoringStatus || 'COMPLETED' : 'PENDING',
      extractedCv: useMockCv && details ? {
        ...details.extractedCv,
        cvDownloadUrl: normalizeCvUrl(details.extractedCv?.cvDownloadUrl),
      } : emptyExtractedCv,
      componentAnalysis: useMockCv && details ? details.componentAnalysis || [] : [],
      aiJustification: useMockCv && details ? details.aiJustification || [] : [],
      keySkillGaps: useMockCv && details ? details.keySkillGaps || [] : [],
    } as CandidateDetail
  }, [candidateId, candidateState, resumeCandidateId, resumeJobId])

  const resumeQuery = useQuery({
    queryKey: ['hr', 'candidate-resume', baseCandidate.jobId, baseCandidate.candidateId],
    enabled: Boolean(baseCandidate.jobId && baseCandidate.candidateId),
    queryFn: () => hrCandidateApplicationApi.getCandidateResumeByJobAndCandidate(
      baseCandidate.jobId || '',
      baseCandidate.candidateId || '',
    ),
  })

  const applicationDetailQuery = useQuery({
    queryKey: ['hr', 'candidate-application-detail', baseCandidate.id],
    enabled: Boolean(baseCandidate.id),
    queryFn: () => hrCandidateApplicationApi.getCandidateApplicationById(baseCandidate.id),
  })

  const candidate = useMemo(() => (
    {
      ...(resumeQuery.data ? mapResumeDetailToCandidateDetail(baseCandidate, resumeQuery.data) : baseCandidate),
      reviewed: applicationDetailQuery.data?.reviewed ?? baseCandidate.reviewed,
    }
  ), [applicationDetailQuery.data?.reviewed, baseCandidate, resumeQuery.data])

  const markReviewedMutation = useMutation({
    mutationFn: (id: string) => hrCandidateApplicationApi.markAsReviewed(id),
    onSuccess: () => {
      setCandidateState((prev) => ({
        ...prev,
        [candidate.id]: {
          ...candidate,
          reviewed: true,
        },
      }))
      queryClient.invalidateQueries({ queryKey: ['hr', 'candidate-applications'] })
      queryClient.invalidateQueries({ queryKey: ['hr', 'candidate-application-detail', candidate.id] })
      triggerToast?.('Candidate marked as reviewed.', 'success')
    },
    onError: () => {
      triggerToast?.('Unable to mark candidate as reviewed.', 'error')
    },
  })

  const handleMarkAsReviewed = () => {
    markReviewedMutation.mutate(candidate.id)
  }

  return {
    candidate,
    activeTab,
    setActiveTab,
    handleMarkAsReviewed,
    isMarkingReviewed: markReviewedMutation.isPending,
    isLoadingResume: resumeQuery.isLoading || resumeQuery.isFetching,
    isLoadingApplicationDetail: applicationDetailQuery.isLoading || applicationDetailQuery.isFetching,
    resumeError: resumeQuery.error,
  }
}
