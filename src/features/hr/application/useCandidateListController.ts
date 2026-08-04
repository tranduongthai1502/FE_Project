import { useMemo, useState } from 'react'
import type { Candidate, CandidateDashboardStats } from '../domain/candidate.types'

export const initialCandidateStats: CandidateDashboardStats = {
  totalCandidates: 1248,
  newThisWeek: 84,
  avgMatchScore: 78,
  pendingReview: 32,
}

export const mockCandidates: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Alex Rivera',
    targetJob: 'Senior Cloud Architect',
    matchScore: 94,
    recruitmentStage: 'Final Interview',
    dateApplied: 'Oct 12, 2023',
    reviewed: true,
  },
  {
    id: 'cand-2',
    name: 'Alex Thompson',
    targetJob: 'Senior Software Engineer',
    matchScore: 86,
    recruitmentStage: 'Technical Test',
    dateApplied: 'Oct 12, 2024',
    reviewed: false,
  },
  {
    id: 'cand-3',
    name: 'Daniel Kang',
    targetJob: 'Machine Learning Engineer',
    matchScore: 43,
    recruitmentStage: 'Pass',
    dateApplied: 'Oct 12, 2023',
    reviewed: true,
  },
  {
    id: 'cand-4',
    name: 'Eliot Huang',
    targetJob: 'Data Engineer',
    matchScore: 99,
    recruitmentStage: 'Hired',
    dateApplied: 'Oct 12, 2023',
    reviewed: true,
  },
  {
    id: 'cand-5',
    name: 'Bam Cong Nui',
    targetJob: 'Accountant',
    matchScore: 85,
    recruitmentStage: 'Final Interview',
    dateApplied: 'Oct 12, 2023',
    reviewed: true,
  },
]

export const CANDIDATE_PAGE_SIZE = 5

export function useCandidateListController() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedMatchScore, setSelectedMatchScore] = useState('all')
  const [selectedAppliedDate, setSelectedAppliedDate] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredCandidates = useMemo(() => {
    return mockCandidates.filter((candidate) => {
      const q = searchQuery.trim().toLowerCase()
      if (q && !candidate.name.toLowerCase().includes(q) && !candidate.targetJob.toLowerCase().includes(q)) {
        return false
      }
      if (selectedJob !== 'all' && candidate.targetJob !== selectedJob) {
        return false
      }
      if (selectedStatus !== 'all' && candidate.recruitmentStage !== selectedStatus) {
        return false
      }
      return true
    })
  }, [searchQuery, selectedJob, selectedStatus])

  const pageCount = 125 // Hardcoded matching mock design (125 pages total)
  const totalElements = 1248

  return {
    stats: initialCandidateStats,
    candidates: filteredCandidates,
    searchQuery,
    setSearchQuery,
    selectedJob,
    setSelectedJob,
    selectedStatus,
    setSelectedStatus,
    selectedMatchScore,
    setSelectedMatchScore,
    selectedAppliedDate,
    setSelectedAppliedDate,
    currentPage,
    setCurrentPage,
    pageCount,
    totalElements,
  }
}
