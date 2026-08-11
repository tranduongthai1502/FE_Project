import { Breadcrumb } from '@/core/components/Breadcrumb'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { TrashIcon } from '@/core/components/Icons'
import { formatCurrencyInput } from '@/core/utils/currencyFormat'
import { hrJobsPath } from '@/features/hr/domain/hrRoutePaths'
import { formatLocationDisplay, formatRevisionMeta, formatRevisionTitle } from '@/features/hr/application/helpers/hrDashboardHelpers'
import { criteriaCategories, formatEmploymentType, formatJobDate, formatJobStatus, getDaysOpen, getDaysUntilDeadline, getJobActionConfirmMessage, isClosedJobStatus, isDraftJobStatus, isOpenJobStatus, maxCriteriaCount } from '@/features/hr/infrastructure/hrJobLogic'
import styles from '@/features/hr/presentation/pages/HrDashboard.module.css'
import { RequirementsDisplay, RichTextDisplay } from '../HrRichTextEditor'
import { CloseJobIcon } from './JobListSection'

export function RevisionHistoryOpenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7.5 3H4.5C4.10218 3 3.72064 3.15804 3.43934 3.43934C3.15804 3.72064 3 4.10218 3 4.5V13.5C3 13.8978 3.15804 14.2794 3.43934 14.5607C3.72064 14.842 4.10218 15 4.5 15H13.5C13.8978 15 14.2794 14.842 14.5607 14.5607C14.842 14.2794 15 13.8978 15 13.5V10.5M9 9L15 3M11.25 3H15V6.75" stroke="#0B1C30" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RevisionHistoryUpdateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9 15.75C8.0625 15.75 7.1845 15.572 6.366 15.216C5.5475 14.86 4.835 14.3788 4.2285 13.7723C3.622 13.1658 3.14075 12.4532 2.78475 11.6347C2.42875 10.8162 2.2505 9.938 2.25 9C2.2495 8.062 2.42775 7.184 2.78475 6.366C3.14175 5.548 3.62275 4.8355 4.22775 4.2285C4.83275 3.6215 5.54525 3.14025 6.36525 2.78475C7.18525 2.42925 8.0635 2.251 9 2.25C10.025 2.25 10.997 2.46875 11.916 2.90625C12.835 3.34375 13.613 3.9625 14.25 4.7625V3.75C14.25 3.5375 14.322 3.3595 14.466 3.216C14.61 3.0725 14.788 3.0005 15 3C15.212 2.9995 15.3903 3.0715 15.5348 3.216C15.6793 3.3605 15.751 3.5385 15.75 3.75V6.75C15.75 6.9625 15.678 7.14075 15.534 7.28475C15.39 7.42875 15.212 7.5005 15 7.5H12C11.7875 7.5 11.6095 7.428 11.466 7.284C11.3225 7.14 11.2505 6.962 11.25 6.75C11.2495 6.538 11.3215 6.36 11.466 6.216C11.6105 6.072 11.7885 6 12 6H13.3125C12.8 5.3 12.1688 4.75 11.4188 4.35C10.6688 3.95 9.8625 3.75 9 3.75C7.5375 3.75 6.297 4.2595 5.2785 5.2785C4.26 6.2975 3.7505 7.538 3.75 9C3.7495 10.462 4.259 11.7027 5.2785 12.7222C6.298 13.7417 7.5385 14.251 9 14.25C10.1875 14.25 11.25 13.8938 12.1875 13.1813C13.125 12.4688 13.7438 11.55 14.0438 10.425C14.1063 10.225 14.2188 10.075 14.3813 9.975C14.5438 9.875 14.725 9.8375 14.925 9.8625C15.1375 9.8875 15.3063 9.978 15.4313 10.134C15.5563 10.29 15.5938 10.462 15.5438 10.65C15.1813 12.1375 14.3938 13.3595 13.1813 14.316C11.9688 15.2725 10.575 15.7505 9 15.75ZM9.75 8.7L11.625 10.575C11.7625 10.7125 11.8313 10.8875 11.8313 11.1C11.8313 11.3125 11.7625 11.4875 11.625 11.625C11.4875 11.7625 11.3125 11.8312 11.1 11.8312C10.8875 11.8312 10.7125 11.7625 10.575 11.625L8.475 9.525C8.4 9.45 8.34375 9.36575 8.30625 9.27225C8.26875 9.17875 8.25 9.08175 8.25 8.98125V6C8.25 5.7875 8.322 5.6095 8.466 5.466C8.61 5.3225 8.788 5.2505 9 5.25C9.212 5.2495 9.39025 5.3215 9.53475 5.466C9.67925 5.6105 9.751 5.7885 9.75 6V8.7Z" fill="#0B1C30" fillOpacity="0.8" />
    </svg>
  )
}

export function RevisionHistoryCreateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M15.75 10.5V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H7.5V3.75H3.75V14.25H14.25V10.5H15.75Z" fill="#0B1C30" fillOpacity="0.7" />
      <path d="M15.75 5.25H12.75V2.25H11.25V5.25H8.25V6.75H11.25V9.75H12.75V6.75H15.75V5.25Z" fill="#0B1C30" fillOpacity="0.7" />
    </svg>
  )
}

export function getRevisionHistoryIcon(action: string) {
  const normalizedAction = action.trim().toLowerCase()

  if (normalizedAction.includes('close')) return <CloseJobIcon />
  if (normalizedAction.includes('open')) return <RevisionHistoryOpenIcon />
  if (normalizedAction.includes('update') || normalizedAction.includes('edit')) return <RevisionHistoryUpdateIcon />
  if (normalizedAction.includes('create')) return <RevisionHistoryCreateIcon />

  return <RevisionHistoryUpdateIcon />
}

export function buildRevisionHistoryItems(history: any[] | undefined, jobTitle: string) {
  return (history || []).slice(0, 4).map((item, index) => ({
    id: item.id || `${item.action}-${item.createdAt || index}`,
    icon: getRevisionHistoryIcon(item.action),
    title: formatRevisionTitle(item.action, jobTitle),
    meta: formatRevisionMeta(item.actorName, item.createdAt),
  }))
}

export function CriteriaAiSuggestIcon() {
  return (
    <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M6 8.38125L6.75 6.75L8.38125 6L6.75 5.25L6 3.61875L5.25 5.25L3.61875 6L5.25 6.75L6 8.38125ZM6 12L4.125 7.875L0 6L4.125 4.125L6 0L7.875 4.125L12 6L7.875 7.875L6 12ZM12 13.5L11.0625 11.4375L9 10.5L11.0625 9.5625L12 7.5L12.9375 11.4375L12 13.5Z" fill="#5B4039" />
    </svg>
  )
}

export function JobDetailSection({
  isActionLocked,
  onHome,
  jobsCtrl,
  criteriaCtrl,
}: {
  isActionLocked: boolean
  onHome: () => void
  jobsCtrl: any
  criteriaCtrl: any
}) {
  const selectedJob = jobsCtrl.selectedJob
  if (!selectedJob) return null

  const selectedJobIsDraft = isDraftJobStatus(selectedJob.status)
  const selectedJobIsClosed = isClosedJobStatus(selectedJob.status)
  const selectedJobIsOpen = isOpenJobStatus(selectedJob.status)
  const daysUntilDeadline = getDaysUntilDeadline(selectedJob.applicationDeadline)
  const totalCriteriaWeight = criteriaCtrl.jobCriteria.reduce((total: number, item: any) => total + (Number(item.weight) || 0), 0)
  const normalizedCriteriaWeight = Math.round(totalCriteriaWeight * 10) / 10
  const isCriteriaReadOnly = selectedJobIsClosed || isActionLocked || criteriaCtrl.isSavingCriteria
  const projectedCriteriaWeight = Math.round(criteriaCtrl.getCriteriaTotalWithForm() * 10) / 10
  const isCriterionSaveDisabled = isCriteriaReadOnly || !criteriaCtrl.isEditingCriteria || criteriaCtrl.criteriaForms.length === 0 || projectedCriteriaWeight !== 100
  const jobStatusStat = selectedJobIsClosed
    ? { label: '', value: 'CLOSED', helper: 'Position Filled' }
    : selectedJobIsDraft
      ? { label: '', value: 'NOT YET PUBLISH', helper: '' }
      : { label: 'Days Open', value: String(getDaysOpen(selectedJob.createdAt)), helper: daysUntilDeadline === null ? 'No deadline' : `Exp: ${daysUntilDeadline} days left` }
  const revisionHistoryItems = buildRevisionHistoryItems(selectedJob.revisionHistory, selectedJob.title)

  return (
    <div className={`role-content ${styles.jobsContent}`}>
      <Breadcrumb items={[
        { label: 'Home', onClick: () => criteriaCtrl.requestCriteriaCancel(onHome) },
        { label: 'Jobs', onClick: () => criteriaCtrl.requestCriteriaCancel(() => { jobsCtrl.setJobView('list'); jobsCtrl.updateHrJobsPath(hrJobsPath) }) },
        { label: 'Job Detail', onClick: () => criteriaCtrl.requestCriteriaCancel(() => jobsCtrl.updateJobDetailTab('overview')) },
        ...(jobsCtrl.jobDetailTab === 'criteria' ? [{ label: 'Job Criteria Setup' }] : []),
      ]} />
      <div className={styles.jobsHeader}>
        <h1>{selectedJob.title} <em className={`${styles.jobStatusBadge} ${selectedJob.status.toLowerCase()}`}>{formatJobStatus(selectedJob.status)}</em></h1>
        {jobsCtrl.jobDetailTab === 'overview' && (
          <div>
            <button type="button" className={styles.secondaryJobButton} disabled={isActionLocked || jobsCtrl.isJobActionSubmitting} onClick={() => jobsCtrl.requestJobAction('delete', selectedJob)}>Delete</button>
            {(selectedJobIsDraft || selectedJobIsClosed) && (
              <button type="button" className={styles.secondaryJobButton} disabled={isActionLocked || jobsCtrl.isJobActionSubmitting} onClick={() => jobsCtrl.requestJobAction('open', selectedJob)}>Open</button>
            )}
            {selectedJobIsOpen && (
              <button type="button" className={styles.secondaryJobButton} disabled={isActionLocked || jobsCtrl.isJobActionSubmitting} onClick={() => jobsCtrl.requestJobAction('close', selectedJob)}>Close</button>
            )}
            <button type="button" className={styles.secondaryJobButton} disabled={isActionLocked || jobsCtrl.isJobActionSubmitting} onClick={() => jobsCtrl.openJobKanban(selectedJob)}>Kanban Board</button>
            <button type="button" disabled={isActionLocked || jobsCtrl.isJobActionSubmitting} onClick={() => jobsCtrl.openEditJob(selectedJob)}>Edit</button>
          </div>
        )}
      </div>
      <div className={styles.jobDetailTabs}>
        <button type="button" className={jobsCtrl.jobDetailTab === 'overview' ? styles.activeJobDetailTab : undefined} onClick={() => criteriaCtrl.requestCriteriaCancel(() => jobsCtrl.updateJobDetailTab('overview'))}>Job Overview</button>
        <button type="button" className={jobsCtrl.jobDetailTab === 'criteria' ? styles.activeJobDetailTab : undefined} onClick={() => criteriaCtrl.requestCriteriaCancel(() => jobsCtrl.updateJobDetailTab('criteria'))}>Criteria Set</button>
      </div>
      {jobsCtrl.jobDetailTab === 'overview' ? (
        <section className={styles.jobDetailGrid}>
          <div className={styles.jobDetailMain}>
            <article className={styles.jobGeneralInfoCard}>
              <h2>General Information</h2>
              <div className={styles.jobGeneralInfoGrid}>
                <div>
                  <strong>Department</strong>
                  <span>{selectedJob.department || 'N/A'}</span>
                </div>
                <div>
                  <strong>Employment type</strong>
                  <span>{formatEmploymentType(selectedJob.employmentType)}</span>
                </div>
                <div>
                  <strong>Location</strong>
                  <span>{formatLocationDisplay(selectedJob.locationType, selectedJob.location)}</span>
                </div>
                <div>
                  <strong>Application Deadline</strong>
                  <span>{formatJobDate(selectedJob.applicationDeadline) || 'N/A'}</span>
                </div>
                <div>
                  <strong>Salary Range</strong>
                  <span>
                    {selectedJob.salaryMin || selectedJob.salaryMax
                      ? `$${formatCurrencyInput(String(selectedJob.salaryMin || 0))} - $${formatCurrencyInput(String(selectedJob.salaryMax || 0))}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </article>
            <article className={styles.jobDetailCard}>
              <h2>Technical Overview</h2>
              <strong>Job Description</strong>
              <RichTextDisplay value={selectedJob.description} fallback="No description provided." />
              <strong>Key Requirements</strong>
              <RequirementsDisplay value={selectedJob.requirements} fallback="No requirements provided." />
              <div className={styles.jobBenefitsBox}>
                <strong>Company Benefits</strong>
                <RichTextDisplay value={selectedJob.benefits} fallback="No benefits provided." />
              </div>
            </article>
            {!selectedJobIsDraft && (
              <article className={styles.recentActivityCard}>
                <header><strong>Recent Applicants</strong><button type="button">View All Candidates</button></header>
                <section><span>KS</span><div><strong>Kasper Schmidt</strong><small>Applied 2 hours ago - 98% Match</small></div><i className="fa-solid fa-ellipsis-vertical"></i></section>
                <section><span>ML</span><div><strong>Maria Lopez</strong><small>Applied 5 hours ago - 92% Match</small></div><i className="fa-solid fa-ellipsis-vertical"></i></section>
              </article>
            )}
          </div>
          <aside className={styles.jobSidePanel}>
            <div className={styles.jobStatsRow}>
              <section><small>Applicants</small><strong>{selectedJob.applicantCount}</strong><span>+0 this week</span></section>
              <section>
                {jobStatusStat.label && <small>{jobStatusStat.label}</small>}
                <strong className={!selectedJobIsOpen ? styles.jobStatusStatValue : undefined}>{jobStatusStat.value}</strong>
                {jobStatusStat.helper && <span>{jobStatusStat.helper}</span>}
              </section>
            </div>
            {!selectedJobIsDraft && (
              <section className={styles.funnelHealthCard}>
                <h3><i className="fa-solid fa-square-poll-vertical"></i> Funnel Health</h3>
                <label><span>Candidate Fit Quality</span><b>High (84%)</b></label>
                <div><span style={{ width: '84%' }}></span></div>
                <label><span>Sourcing Velocity</span><b>Medium (62%)</b></label>
                <div><span style={{ width: '62%' }}></span></div>
              </section>
            )}
            <section className={styles.revisionHistoryCard}>
              <h3>Revision History</h3>
              <div className={styles.revisionHistoryList}>
                {revisionHistoryItems.length > 0 ? (
                  revisionHistoryItems.map((item) => (
                    <div className={styles.revisionHistoryItem} key={item.id}>
                      <span className={styles.revisionHistoryIcon}>{item.icon}</span>
                      <div className={styles.revisionHistoryText}>
                        <strong>{item.title}</strong>
                        <small>{item.meta}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <small>No revision history yet.</small>
                )}
              </div>
            </section>
          </aside>
        </section>
      ) : (
        <section className={styles.criteriaSetup}>
          <article className={styles.criteriaTableCard}>
            <header>
              <span>Evaluation Criteria</span>
            </header>
            <div className={`${styles.criteriaTableRow} ${styles.criteriaTableHead} ${!criteriaCtrl.isEditingCriteria ? styles.criteriaTableRowNoAction : ''}`}>
              <span>Criterion Name</span><span>Description</span><span>Category</span><span>Weightage (%)</span>{criteriaCtrl.isEditingCriteria && <span>Actions</span>}
            </div>
            {criteriaCtrl.isLoadingCriteria ? (
              <div className={styles.criteriaSkeletonTable}>
                {Array.from({ length: 4 }).map((_, index) => <span key={index}></span>)}
              </div>
            ) : !criteriaCtrl.isEditingCriteria && criteriaCtrl.jobCriteria.length > 0 ? (
              criteriaCtrl.jobCriteria.map((item: any) => (
                <div className={`${styles.criteriaTableRow} ${styles.criteriaTableRowNoAction} ${styles.criteriaEditableRow}`} key={item.id} onClick={criteriaCtrl.startEditCriteria} role="button" tabIndex={0} onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') criteriaCtrl.startEditCriteria()
                }}>
                  <span>{item.name}</span>
                  <span>{item.description || '-'}</span>
                  <span>{item.category || '-'}</span>
                  <span>{item.weight ?? 0}%</span>
                </div>
              ))
            ) : null}
            {criteriaCtrl.criteriaForms.map((form: any) => {
              const rowErrors = criteriaCtrl.criteriaFieldErrors[form.clientId] || {}

              return (
                <div className={styles.criteriaFormRow} key={form.clientId}>
                  <label>
                    <span>Criterion Name *</span>
                    <input value={form.name} disabled={isCriteriaReadOnly} onChange={(event) => criteriaCtrl.updateCriterionForm(form.clientId, 'name', event.target.value)} placeholder="System Architecture" />
                    <small aria-hidden={!rowErrors.name}>{rowErrors.name || 'Criterion name error'}</small>
                  </label>
                  <label>
                    <span>Description *</span>
                    <textarea value={form.description} disabled={isCriteriaReadOnly} onChange={(event) => criteriaCtrl.updateCriterionForm(form.clientId, 'description', event.target.value)} placeholder="Describe what this criterion evaluates" />
                    <small aria-hidden={!rowErrors.description}>{rowErrors.description || 'Description error'}</small>
                  </label>
                  <label>
                    <span>Category</span>
                    <select value={form.category || criteriaCategories[0]} disabled={isCriteriaReadOnly} onChange={(event) => criteriaCtrl.updateCriterionForm(form.clientId, 'category', event.target.value)}>
                      {criteriaCategories.map((category) => <option value={category} key={category}>{category}</option>)}
                    </select>
                    <small aria-hidden={!rowErrors.category}>{rowErrors.category || 'Category error'}</small>
                  </label>
                  <label>
                    <span>Weight</span>
                    <input value={form.weight} inputMode="decimal" disabled={isCriteriaReadOnly} onChange={(event) => criteriaCtrl.updateCriterionForm(form.clientId, 'weight', event.target.value)} placeholder="40" />
                    <small aria-hidden={!rowErrors.weight}>{rowErrors.weight || 'Weight error'}</small>
                  </label>
                  <span className={styles.criteriaRowActions}>
                    <button type="button" className={styles.criteriaDeleteButton} disabled={isCriteriaReadOnly} onClick={() => criteriaCtrl.removeDraftCriterion(form.clientId)} aria-label="Remove draft criterion">
                      <TrashIcon />
                    </button>
                  </span>
                </div>
              )
            })}
            {!criteriaCtrl.isLoadingCriteria && ((criteriaCtrl.isEditingCriteria && criteriaCtrl.criteriaForms.length === 0) || (!criteriaCtrl.isEditingCriteria && criteriaCtrl.jobCriteria.length === 0)) && (
              <div className={styles.criteriaTableState}>
                No criteria yet. Add at least one criterion or use Auto-suggest with AI
              </div>
            )}
            <footer title={criteriaCtrl.isEditingCriteria && projectedCriteriaWeight !== 100 ? 'Total weight must equal 100% before candidates are evaluated.' : undefined}>
              <div>
                {criteriaCtrl.isEditingCriteria ? (
                  <button type="button" disabled={isCriteriaReadOnly || criteriaCtrl.criteriaForms.length >= maxCriteriaCount} onClick={criteriaCtrl.addCriterionRow}>+ Add Criterion</button>
                ) : (
                  <button type="button" disabled={isCriteriaReadOnly} onClick={criteriaCtrl.startEditCriteria}>Edit Criterion</button>
                )}
                <button type="button" disabled={isCriteriaReadOnly} onClick={criteriaCtrl.isEditingCriteria ? criteriaCtrl.addCriterionRow : criteriaCtrl.startEditCriteria}><CriteriaAiSuggestIcon /> Re-suggest with AI</button>
                {criteriaCtrl.isEditingCriteria && (
                  <button type="button" disabled={isCriteriaReadOnly || criteriaCtrl.criteriaForms.length === 0} onClick={criteriaCtrl.clearAllCriteria}>Clear All</button>
                )}
              </div>
              <strong className={(criteriaCtrl.isEditingCriteria ? projectedCriteriaWeight : normalizedCriteriaWeight) === 100 ? styles.criteriaWeightComplete : styles.criteriaWeightInvalid}>
                Total Weightage: <span>{criteriaCtrl.isEditingCriteria ? projectedCriteriaWeight : normalizedCriteriaWeight}%</span>
              </strong>
            </footer>
            {(criteriaCtrl.isEditingCriteria ? projectedCriteriaWeight !== 100 && criteriaCtrl.criteriaForms.length > 0 : normalizedCriteriaWeight !== 100 && criteriaCtrl.jobCriteria.length > 0) && (
              <p className={styles.criteriaTableError}>All criteria must have a total weight of 100%.</p>
            )}
          </article>
          {criteriaCtrl.isEditingCriteria && (
            <div className={styles.criteriaSaveBar}>
              <button type="button" disabled={criteriaCtrl.isSavingCriteria} onClick={criteriaCtrl.cancelCriterionForm}>Cancel</button>
              <button type="button" disabled={isCriterionSaveDisabled} onClick={criteriaCtrl.saveCriteria}>{criteriaCtrl.isSavingCriteria ? 'Saving...' : 'Save Criteria'}</button>
            </div>
          )}
        </section>
      )}
      {criteriaCtrl.pendingCriteriaCancelAction !== null && (
        <ConfirmActionModal
          isSubmitting={criteriaCtrl.isSavingCriteria}
          title="Confirm Action"
          message="Are you sure you want to cancel? Your changes will not be saved."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => criteriaCtrl.setPendingCriteriaCancelAction(null)}
          onConfirm={criteriaCtrl.confirmCriteriaCancel}
        />
      )}
      {jobsCtrl.jobConfirmAction && jobsCtrl.jobConfirmTarget && (
        <ConfirmActionModal
          isSubmitting={jobsCtrl.isJobActionSubmitting}
          title="Confirm Action"
          message={getJobActionConfirmMessage(jobsCtrl.jobConfirmAction, jobsCtrl.jobConfirmTarget)}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={jobsCtrl.closeJobConfirm}
          onConfirm={jobsCtrl.confirmJobAction}
        />
      )}
    </div>
  )
}
