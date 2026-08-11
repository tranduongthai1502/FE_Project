import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CandidateDetail } from '../../domain/candidate.types'
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

function getResumePayload(payload: any) {
  return payload?.data?.data || payload?.data || payload?.result || payload?.resume || payload
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function toText(value: unknown, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

function mapResumeDetailToCandidateDetail(base: CandidateDetail, payload: any): CandidateDetail {
  const resume = getResumePayload(payload)
  const parsedData = resume?.parsedData || resume?.parsed_data || resume?.extractedCv || resume?.extracted_cv || {}
  const profile = parsedData?.profile || parsedData?.personalInfo || parsedData?.personal_info || parsedData?.candidate || {}
  const score = Number(resume?.matchingScore ?? resume?.candidateSelfScore ?? resume?.score ?? 0)
  const suggestions = resume?.cvImprovementSuggestions || resume?.cv_improvement_suggestions || resume?.reasoning || {}
  const suggestionItems = asArray(suggestions?.suggestions || resume?.skillGaps || resume?.skill_gaps)
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
  const componentAnalysis = asArray(resume?.componentAnalysis || resume?.component_analysis || resume?.scoringBreakdown || resume?.scoring_breakdown)
    .map((item) => ({
      category: toText(item?.category || item?.criterionName || item?.criterion_name),
      score: Number(item?.score ?? item?.matchingScore ?? 0) || 0,
      weight: Number(item?.weight ?? item?.weightPercent ?? 0) || 0,
      analysis: toText(item?.analysis || item?.feedback || item?.reason),
    }))
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
  const keySkillGaps = suggestionItems
    .map((item) => toText(item?.feedback || item?.criterionName || item?.criterion_name || item))
    .filter(Boolean)

  return {
    ...base,
    name: toText(profile?.fullName || profile?.full_name || profile?.name || parsedData?.fullName || parsedData?.full_name || resume?.candidateName || resume?.candidate_name),
    email: toText(profile?.email || parsedData?.email || resume?.email),
    phone: toText(profile?.phone || profile?.phoneNumber || profile?.phone_number || parsedData?.phone || resume?.phone),
    location: toText(profile?.location || profile?.address || parsedData?.location || parsedData?.address || resume?.location),
    targetJob: toText(resume?.jobTitle || resume?.job_title),
    avatarUrl: '',
    matchScore: Number.isFinite(score) ? Math.round(score) : 0,
    scoringStatus: parsedData ? 'COMPLETED' : base.scoringStatus,
    extractedCv: {
      summary: toText(parsedData?.summary || parsedData?.professionalSummary || parsedData?.professional_summary),
      cvFileName: toText(resume?.fileName || resume?.file_name || resume?.originalFileName || resume?.original_file_name),
      cvDownloadUrl: toText(resume?.fileUrl || resume?.file_url || resume?.cvDownloadUrl || resume?.cv_download_url),
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

export function useCandidateDetailController(candidateId?: string) {
  const [activeTab, setActiveTab] = useState<DetailTab>('extracted')
  const [candidateState, setCandidateState] = useState<Record<string, CandidateDetail>>({})
  const queryClient = useQueryClient()

  const cachedCandidate = useMemo(() => {
    const listQueries = queryClient.getQueriesData({ queryKey: ['hr', 'candidate-applications'] })

    for (const [, data] of listQueries) {
      const candidates = Array.isArray(data) ? data : []
      const match = candidates.find((item: any) => item?.id === candidateId)
      if (match) return match
    }

    return null
  }, [candidateId, queryClient])

  const baseCandidate = useMemo(() => {
    const id = candidateId || 'cand-2'
    if (candidateState[id]) return candidateState[id]

    const baseCandidate = cachedCandidate || mockCandidates.find((c) => c.id === id) || mockCandidates[1]
    const details = mockCandidateDetails[id] || mockCandidateDetails['cand-2']

    return {
      ...details,
      ...baseCandidate,
      id,
      email: details?.email || `${baseCandidate.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: details?.phone || '+1 (555) 012-3456',
      location: details?.location || 'San Francisco, CA',
      scoringStatus: details?.scoringStatus || 'COMPLETED',
      extractedCv: details?.extractedCv || mockCandidateDetails['cand-2'].extractedCv,
      componentAnalysis: details?.componentAnalysis || mockCandidateDetails['cand-2'].componentAnalysis,
      aiJustification: details?.aiJustification || mockCandidateDetails['cand-2'].aiJustification,
      keySkillGaps: details?.keySkillGaps || mockCandidateDetails['cand-2'].keySkillGaps,
    } as CandidateDetail
  }, [cachedCandidate, candidateId, candidateState])

  const resumeQuery = useQuery({
    queryKey: ['hr', 'candidate-resume', baseCandidate.jobId, baseCandidate.candidateId],
    enabled: Boolean(baseCandidate.jobId && baseCandidate.candidateId),
    queryFn: () => hrCandidateApplicationApi.getCandidateResumeByJobAndCandidate(
      baseCandidate.jobId || '',
      baseCandidate.candidateId || '',
    ),
  })

  const candidate = useMemo(() => (
    resumeQuery.data ? mapResumeDetailToCandidateDetail(baseCandidate, resumeQuery.data) : baseCandidate
  ), [baseCandidate, resumeQuery.data])

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
    resumeError: resumeQuery.error,
  }
}
