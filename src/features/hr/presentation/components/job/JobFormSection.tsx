import { useRef } from 'react'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'
import { hrJobsPath } from '@/features/hr/domain/hrRoutePaths'
import { getHrJobDetailPath } from '@/features/hr/application/helpers/hrDashboardHelpers'
import { calendarWeekdays, getCalendarDays, getCalendarMonth, getLocalDateKey } from '@/features/hr/application/helpers/hrDashboardHelpers'
import { duplicateJobTitleConfirmMessage, jobTitleMaxLength } from '@/features/hr/infrastructure/hrJobLogic'
import styles from '@/features/hr/presentation/pages/HrDashboard.module.css'
import { JobRichTextEditor } from '../HrRichTextEditor'

export function JobFieldError({ message, showDefaultMessage = true }: { message?: string; showDefaultMessage?: boolean }) {
  return (
    <small className={styles.jobFieldError} aria-hidden={!message}>
      {message || (showDefaultMessage ? '' : '')}
    </small>
  )
}

export function JobFormSection({
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
  const deadlineInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className={`role-content ${styles.jobsContent}`}>
      <Breadcrumb items={[
        { label: 'Home', onClick: onHome },
        { label: 'Jobs', onClick: () => { jobsCtrl.setJobView('list'); jobsCtrl.updateHrJobsPath(hrJobsPath) } },
        ...(jobsCtrl.jobView === 'edit' && jobsCtrl.selectedJob?.id
          ? [{ label: 'Job Details', onClick: () => { jobsCtrl.setJobView('detail'); jobsCtrl.updateHrJobsPath(getHrJobDetailPath(jobsCtrl.selectedJob.id)) } }]
          : []),
        { label: jobsCtrl.jobView === 'edit' ? 'Edit Job Posting' : 'Create New Job Posting' },
      ]} />
      <div className={styles.jobsHeader}>
        <div>
          <h1>{jobsCtrl.jobView === 'edit' ? 'Edit Job Posting' : 'Create New Job Posting'}</h1>
          {jobsCtrl.jobView === 'edit' && <p>Manage and update the details of your active talent acquisition campaign.</p>}
        </div>
        <button
          type="button"
          className={styles.aiJobButton}
          disabled={isActionLocked}
          onClick={jobsCtrl.openGenerateWithAi}
        >
          Generate with AI
        </button>
      </div>
      <form className={styles.jobForm} onSubmit={(event) => { event.preventDefault(); criteriaCtrl.saveJob() }} noValidate>
        <div className={styles.jobFormMain}>
          <section className={styles.jobFormPanel}>
            <h2>General Information</h2>
            <div className={styles.jobFieldGrid}>
              <label className={styles.fullField}>
                <span>Job Title <b>*</b></span>
                <input
                  maxLength={jobTitleMaxLength}
                  className={criteriaCtrl.jobFieldErrors.title ? styles.jobInputError : undefined}
                  value={criteriaCtrl.jobForm.title}
                  onChange={(e) => criteriaCtrl.updateJobFormField('title', e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  required
                />
                <JobFieldError message={criteriaCtrl.jobFieldErrors.title} />
              </label>
              <label>
                <span>Department <b>*</b></span>
                <select className={criteriaCtrl.jobFieldErrors.department ? styles.jobInputError : undefined} value={criteriaCtrl.jobForm.department} onChange={(e) => criteriaCtrl.updateJobFormField('department', e.target.value)} required><option value="">Select department type</option><option value="Engineering">Engineering</option><option value="Design">Design</option><option value="Marketing">Marketing</option><option value="Operations">Operations</option><option value="Data">Data</option></select>
                <JobFieldError message={criteriaCtrl.jobFieldErrors.department} />
              </label>
              <label>
                <span>Employment Type <b>*</b></span>
                <select className={criteriaCtrl.jobFieldErrors.employmentType ? styles.jobInputError : undefined} value={criteriaCtrl.jobForm.employmentType} onChange={(e) => criteriaCtrl.updateJobFormField('employmentType', e.target.value)} required><option value="">Select employment type</option><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="INTERNSHIP">Internship</option></select>
                <JobFieldError message={criteriaCtrl.jobFieldErrors.employmentType} />
              </label>
              <div className={styles.locationRow}>
                <span>Location <b>*</b></span>
                <div className={styles.locationControls}>
                  <select value={criteriaCtrl.jobForm.locationType} onChange={(e) => criteriaCtrl.updateJobFormField('locationType', e.target.value)}><option value="OFFICE">Office</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option></select>
                  <div>
                    <div className={styles.iconInput}>
                      <svg width="16" height="28" viewBox="0 0 16 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 6.5875 6.5875C6.97917 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 7.45 8 8 8C8.55 8 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="#565E74" />
                      </svg>
                      <input className={criteriaCtrl.jobFieldErrors.location ? styles.jobInputError : undefined} value={criteriaCtrl.jobForm.location} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => criteriaCtrl.updateJobFormField('location', e.target.value)} placeholder="e.g. San Francisco, CA" />
                    </div>
                    <JobFieldError message={criteriaCtrl.jobFieldErrors.location} />
                  </div>
                </div>
              </div>
              <label className={styles.deadlineField}>
                <span>Application Deadline</span>
                <div className={`${styles.iconInput} ${styles.deadlinePickerShell}`}>
                  <button type="button" className={styles.datePickerButton} onClick={criteriaCtrl.toggleDeadlinePicker} aria-label="Open application deadline calendar">
                    <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V0H5V2H13V0H15V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6ZM2 6V4V6Z" fill="#565E74" />
                    </svg>
                  </button>
                  <input
                    ref={deadlineInputRef}
                    className={criteriaCtrl.jobFieldErrors.applicationDeadline ? styles.jobInputError : undefined}
                    type="text"
                    value={criteriaCtrl.deadlineInputValue}
                    maxLength={FIELD_LENGTH_LIMITS.defaultText}
                    onFocus={() => criteriaCtrl.setDeadlineCalendarMonth(getCalendarMonth(criteriaCtrl.jobForm.applicationDeadline))}
                    onChange={(event) => criteriaCtrl.updateDeadlineInputValue(event.target.value)}
                    placeholder="dd/mm/yyyy"
                  />
                  {criteriaCtrl.isDeadlineCalendarOpen && (
                    <div className={styles.deadlineCalendar}>
                      <header>
                        <button type="button" onClick={() => criteriaCtrl.setDeadlineCalendarMonth((current: Date) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
                        <strong>{criteriaCtrl.deadlineCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
                        <button type="button" onClick={() => criteriaCtrl.setDeadlineCalendarMonth((current: Date) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Next month">›</button>
                      </header>
                      <div className={styles.deadlineCalendarWeekdays}>
                        {calendarWeekdays.map((day) => <span key={day}>{day}</span>)}
                      </div>
                      <div className={styles.deadlineCalendarGrid}>
                        {getCalendarDays(criteriaCtrl.deadlineCalendarMonth).map((date: Date) => {
                          const dateKey = getLocalDateKey(date)
                          const isSelected = dateKey === (criteriaCtrl.jobForm.applicationDeadline ? criteriaCtrl.jobForm.applicationDeadline.slice(0, 10) : '')
                          const isToday = dateKey === getLocalDateKey(new Date())
                          const isOutsideMonth = date.getMonth() !== criteriaCtrl.deadlineCalendarMonth.getMonth()

                          return (
                            <button type="button" className={`${isSelected ? styles.selectedCalendarDay : ''} ${isToday ? styles.todayCalendarDay : ''} ${isOutsideMonth ? styles.outsideCalendarDay : ''}`} key={dateKey} onClick={() => criteriaCtrl.selectDeadlineDate(date)}>
                              {date.getDate()}
                            </button>
                          )
                        })}
                      </div>
                      <footer>
                        <button type="button" onClick={criteriaCtrl.clearDeadlineDate}>Clear</button>
                        <button type="button" onClick={() => criteriaCtrl.selectDeadlineDate(new Date())}>Today</button>
                      </footer>
                    </div>
                  )}
                </div>
                <JobFieldError message={criteriaCtrl.jobFieldErrors.applicationDeadline} />
              </label>
              <div className={styles.salaryRangeRow}>
                <span>Salary Range</span>
                <div className={styles.salaryRangeControls}>
                  <div className={styles.salaryInputSlot}>
                    <div className={`${styles.moneyInput} ${criteriaCtrl.jobFieldErrors.salaryMin ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Minimum salary" type="text" inputMode="decimal" value={criteriaCtrl.salaryInputValues.salaryMin} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => criteriaCtrl.updateSalaryField('salaryMin', e.target.value)} /></div>
                    <JobFieldError message={criteriaCtrl.jobFieldErrors.salaryMin} />
                  </div>
                  <small className={styles.salaryRangeDivider}>To</small>
                  <div className={styles.salaryInputSlot}>
                    <div className={`${styles.moneyInput} ${criteriaCtrl.jobFieldErrors.salaryMax ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Maximum salary" type="text" inputMode="decimal" value={criteriaCtrl.salaryInputValues.salaryMax} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => criteriaCtrl.updateSalaryField('salaryMax', e.target.value)} /></div>
                    <JobFieldError message={criteriaCtrl.jobFieldErrors.salaryMax} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.jobFormPanel}>
            <div className={styles.richTextField}><span>Job Description <b>*</b></span>
              <JobRichTextEditor hasError={Boolean(criteriaCtrl.jobFieldErrors.description)} value={criteriaCtrl.jobForm.description} onChange={(value) => criteriaCtrl.updateJobFormField('description', value)} placeholder="Enter job summary and context..." />
              <JobFieldError message={criteriaCtrl.jobFieldErrors.description} />
            </div>
          </section>
        </div>

        <aside className={styles.jobFormAside}>
          <section className={styles.jobFormPanel}>
            <div className={styles.richTextField}><span>Requirements <b>*</b></span>
              <JobRichTextEditor hasError={Boolean(criteriaCtrl.jobFieldErrors.requirements)} value={criteriaCtrl.jobForm.requirements} onChange={(value) => criteriaCtrl.updateJobFormField('requirements', value)} placeholder="List technical and soft skills required..." />
              <JobFieldError message={criteriaCtrl.jobFieldErrors.requirements} />
            </div>
          </section>
          <section className={styles.jobFormPanel}>
            <div className={styles.richTextField}><span>Benefits</span>
              <JobRichTextEditor hasError={Boolean(criteriaCtrl.jobFieldErrors.benefits)} value={criteriaCtrl.jobForm.benefits} onChange={(value) => criteriaCtrl.updateJobFormField('benefits', value)} placeholder="Enter company benefits and perks..." />
              <JobFieldError message={criteriaCtrl.jobFieldErrors.benefits} showDefaultMessage={false} />
            </div>
          </section>
          <footer>
            <button type="button" onClick={criteriaCtrl.handleCancelJobForm} disabled={criteriaCtrl.isSavingJob}>Cancel</button>
            {jobsCtrl.jobView === 'create' && (
              <button type="button" disabled={isActionLocked || criteriaCtrl.isSavingJob} onClick={() => criteriaCtrl.saveJob({ ...criteriaCtrl.jobForm, status: 'DRAFT' })}>Save as Draft</button>
            )}
            <button type="submit" disabled={isActionLocked || criteriaCtrl.isSavingJob}>{criteriaCtrl.isSavingJob ? 'Saving...' : (jobsCtrl.jobView === 'edit' ? 'Save Change' : 'Save')}</button>
          </footer>
        </aside>
      </form>
      {criteriaCtrl.isCancelConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={criteriaCtrl.isSavingJob}
          title="Confirm Action"
          message="Are you sure you want to cancel? Your changes will not be saved."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => criteriaCtrl.setIsCancelConfirmOpen(false)}
          onConfirm={criteriaCtrl.discardJobFormChanges}
        />
      )}
      {criteriaCtrl.pendingDuplicateTitlePayload && (
        <ConfirmActionModal
          isSubmitting={criteriaCtrl.isSavingJob}
          title="Confirm Action"
          message={duplicateJobTitleConfirmMessage}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => criteriaCtrl.setPendingDuplicateTitlePayload(null)}
          onConfirm={() => criteriaCtrl.saveJob(criteriaCtrl.pendingDuplicateTitlePayload!, { allowDuplicateTitle: true })}
        />
      )}
    </div>
  )
}
