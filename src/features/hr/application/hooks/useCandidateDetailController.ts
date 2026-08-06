import { useMemo, useState } from 'react'
import type { CandidateDetail } from '../../domain/candidate.types'
import { mockCandidates } from './useCandidateListController'

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

export function useCandidateDetailController(candidateId?: string) {
  const [activeTab, setActiveTab] = useState<DetailTab>('extracted')
  const [candidateState, setCandidateState] = useState<Record<string, CandidateDetail>>({})

  const candidate = useMemo(() => {
    const id = candidateId || 'cand-2'
    if (candidateState[id]) return candidateState[id]

    const baseCandidate = mockCandidates.find((c) => c.id === id) || mockCandidates[1]
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
  }, [candidateId, candidateState])

  const handleMarkAsReviewed = () => {
    setCandidateState((prev) => ({
      ...prev,
      [candidate.id]: {
        ...candidate,
        reviewed: true,
      },
    }))
  }

  return {
    candidate,
    activeTab,
    setActiveTab,
    handleMarkAsReviewed,
  }
}
