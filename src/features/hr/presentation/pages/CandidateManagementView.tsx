import { useNavigate } from 'react-router-dom'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { MetricCard } from '@/core/components/MetricCard'
import { SearchInput } from '@/core/components/SearchInput'
import { ScrollableSelect } from '@/core/components/ScrollableSelect'
import { ListTable } from '@/core/components/ListTable'
import { getCompactPageItems } from '@/core/utils/pagination'
import { getHrCandidateDetailPath } from '../../domain/hrRoutePaths'
import { useCandidateListController } from '../../application/hooks/useCandidateListController'
import styles from './candidate.module.css'

export function CandidateManagementView() {
  const navigate = useNavigate()
  const {
    stats,
    candidates,
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
  } = useCandidateListController()

  const pageItems = getCompactPageItems(currentPage, pageCount)

  const columns = ['CANDIDATE NAME', 'TARGET JOB', 'MATCH SCORE', 'RECRUITMENT STAGE', 'DATE APPLIED', 'REVIEWED']

  const getMatchBadgeClass = (score: number) => {
    if (score >= 90) return `${styles.matchBadge} ${styles.matchHigh}`
    if (score >= 75) return `${styles.matchBadge} ${styles.matchMedium}`
    return `${styles.matchBadge} ${styles.matchLow}`
  }

  const getStageDotClass = (stage: string) => {
    const s = stage.toLowerCase()
    if (s.includes('final') || s.includes('interview')) return `${styles.stageDot} ${styles.dotOrange}`
    if (s.includes('tech') || s.includes('hired')) return `${styles.stageDot} ${styles.dotGreen}`
    if (s.includes('pass')) return `${styles.stageDot} ${styles.dotRed}`
    return `${styles.stageDot} ${styles.dotBlue}`
  }

  return (
    <div className={`role-content ${styles.candidateContainer}`}>
      <div className={styles.candidateHeader}>
        <Breadcrumb items={[{ label: 'Home' }, { label: 'Candidates', current: true }]} />
        <h1 className={styles.candidateTitle}>Candidates</h1>
      </div>

      <div className={styles.metricGrid}>
        <MetricCard
          icon="fa-users"
          label="TOTAL CANDIDATES"
          value={stats.totalCandidates.toLocaleString()}
        />
        <MetricCard
          icon="fa-arrow-trend-up"
          label="NEW THIS WEEK"
          value={`+${stats.newThisWeek}`}
          note={`+${stats.newThisWeek}`}
        />
        <MetricCard
          icon="fa-bolt"
          label="AVG MATCH SCORE"
          value={`${stats.avgMatchScore}%`}
        />
        <MetricCard
          icon="fa-clipboard-list"
          label="PENDING REVIEW"
          value={stats.pendingReview}
        />
      </div>

      <div className={styles.filterToolbarSection}>
        <div className={styles.searchInputWrap}>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search job title, or department or..."
            ariaLabel="Search candidates"
          />
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterSelects}>
            <ScrollableSelect
              className="candidate-filter-select"
              icon="fa-solid fa-briefcase"
              value={selectedJob}
              onChange={setSelectedJob}
              options={[
                { value: 'all', label: 'All Jobs' },
                { value: 'Senior Cloud Architect', label: 'Senior Cloud Architect' },
                { value: 'Senior Software Engineer', label: 'Senior Software Engineer' },
                { value: 'Machine Learning Engineer', label: 'Machine Learning Engineer' },
                { value: 'Data Engineer', label: 'Data Engineer' },
                { value: 'Accountant', label: 'Accountant' },
              ]}
            />
            <ScrollableSelect
              className="candidate-filter-select"
              icon="fa-regular fa-star"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: 'all', label: 'Status' },
                { value: 'Final Interview', label: 'Final Interview' },
                { value: 'Technical Test', label: 'Technical Test' },
                { value: 'Pass', label: 'Pass' },
                { value: 'Hired', label: 'Hired' },
              ]}
            />
            <ScrollableSelect
              className="candidate-filter-select"
              icon="fa-solid fa-chart-line"
              value={selectedMatchScore}
              onChange={setSelectedMatchScore}
              options={[
                { value: 'all', label: 'Match Score' },
                { value: 'high', label: '>= 90%' },
                { value: 'medium', label: '75% - 89%' },
                { value: 'low', label: '< 75%' },
              ]}
            />
            <ScrollableSelect
              className="candidate-filter-select"
              icon="fa-regular fa-calendar"
              value={selectedAppliedDate}
              onChange={setSelectedAppliedDate}
              options={[
                { value: 'all', label: 'Applied Date' },
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
              ]}
            />
          </div>
        </div>
      </div>

      <ListTable
        cardClassName="table-card candidate-table-card"
        rowClassName="candidate-table-row"
        headClassName="candidate-table-head"
        stateClassName="table-state"
        columns={columns}
        isLoading={false}
        empty={candidates.length === 0}
        loadingMessage="Loading candidates..."
        emptyMessage="No candidates found."
        pagination={{
          label: `Showing ${candidates.length} of ${totalElements.toLocaleString()} candidates`,
          currentPage,
          pageCount,
          pageItems,
          onPageChange: setCurrentPage,
          ellipsisKeyPrefix: 'candidate-list',
        }}
      >
        {candidates.map((cand) => (
          <div
            className="table-row candidate-table-row"
            key={cand.id}
            onClick={() => navigate(getHrCandidateDetailPath(cand.id))}
            style={{ cursor: 'pointer' }}
          >
            <span>
              <strong>{cand.name}</strong>
            </span>
            <span>{cand.targetJob}</span>
            <span>
              <span className={getMatchBadgeClass(cand.matchScore)}>
                {cand.matchScore}% MATCH
              </span>
            </span>
            <span>
              <span className={styles.stageIndicator}>
                <span className={getStageDotClass(cand.recruitmentStage)}></span>
                {cand.recruitmentStage}
              </span>
            </span>
            <span>{cand.dateApplied}</span>
            <span>
              <span className={styles.reviewedStatus}>
                {cand.reviewed ? (
                  <i className={`fa-solid fa-circle-check ${styles.reviewedIconChecked}`}></i>
                ) : (
                  <i className={`fa-regular fa-circle ${styles.reviewedIconPending}`}></i>
                )}
              </span>
            </span>
          </div>
        ))}
      </ListTable>
    </div>
  )
}
