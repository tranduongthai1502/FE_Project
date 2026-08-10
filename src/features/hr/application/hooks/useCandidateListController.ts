import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getListPageCount, getListTotalElements } from '@/core/utils/pagination'
import type { Candidate, CandidateDashboardStats } from '../../domain/candidate.types'
import { hrCandidateApplicationApi } from '../../infrastructure/hrCandidateApplicationApi'

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

  const filters = useMemo(() => ({
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    ...(selectedJob !== 'all' ? { title: selectedJob } : {}),
    ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
  }), [searchQuery, selectedJob, selectedStatus])

  const candidateQuery = useQuery({
    queryKey: ['hr', 'candidate-applications', { page: currentPage, filters, selectedAppliedDate, selectedMatchScore }],
    queryFn: () => hrCandidateApplicationApi.getCandidateApplications({
      page: currentPage,
      size: CANDIDATE_PAGE_SIZE,
      sortField: selectedAppliedDate === 'oldest' ? 'createdAt' : 'createdAt',
      sortBy: selectedAppliedDate === 'oldest' ? 'ASC' : 'DESC',
      filters,
    }),
  })

  const candidates = candidateQuery.data ?? []

  const pageCount = getListPageCount(candidates, currentPage, CANDIDATE_PAGE_SIZE)
  const totalElements = getListTotalElements(candidates, candidates.length)
  const avgMatchScore = candidates.length
    ? Math.round(candidates.reduce((sum, candidate) => sum + candidate.matchScore, 0) / candidates.length)
    : 0
  const stats = {
    totalCandidates: totalElements,
    newThisWeek: 0,
    avgMatchScore,
    pendingReview: candidates.filter((candidate) => !candidate.reviewed).length,
  }

  return {
    stats,
    candidates,
    isLoading: candidateQuery.isLoading,
    isError: candidateQuery.isError,
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
