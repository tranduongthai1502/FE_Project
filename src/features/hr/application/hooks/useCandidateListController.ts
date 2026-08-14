import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getListPageCount, getListTotalElements, type PaginationMeta } from '@/core/utils/pagination'
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
  const [selectedMatchScore, setSelectedMatchScore] = useState('all')
  const [selectedAppliedDate, setSelectedAppliedDate] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filters = useMemo(() => ({
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
  }), [searchQuery])

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

  const candidates = useMemo(() => (candidateQuery.data ?? []).filter((candidate) => {
    if (selectedMatchScore === 'high') return candidate.matchScore >= 90
    if (selectedMatchScore === 'medium') return candidate.matchScore >= 75 && candidate.matchScore < 90
    if (selectedMatchScore === 'low') return candidate.matchScore < 75
    return true
  }), [candidateQuery.data, selectedMatchScore])

  // Array.prototype.filter() returns a new array and drops the pagination
  // metadata attached by the API adapter. Preserve it so records after the
  // first page (for example candidate #6) remain reachable.
  const candidatesWithPagination = Object.assign(candidates, {
    __pagination: (candidateQuery.data as (Candidate[] & { __pagination?: PaginationMeta }) | undefined)?.__pagination,
  })

  const pageCount = getListPageCount(candidatesWithPagination, currentPage, CANDIDATE_PAGE_SIZE)
  const totalElements = getListTotalElements(candidatesWithPagination, candidatesWithPagination.length)
  const avgMatchScore = candidatesWithPagination.length
    ? Math.round(candidatesWithPagination.reduce((sum, candidate) => sum + candidate.matchScore, 0) / candidatesWithPagination.length)
    : 0
  const stats = {
    totalCandidates: totalElements,
    newThisWeek: 0,
    avgMatchScore,
    pendingReview: candidatesWithPagination.filter((candidate) => !candidate.reviewed).length,
  }

  return {
    stats,
    candidates: candidatesWithPagination,
    isLoading: candidateQuery.isLoading,
    isError: candidateQuery.isError,
    searchQuery,
    setSearchQuery,
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
