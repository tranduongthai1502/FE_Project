import { Breadcrumb } from '@/core/components/Breadcrumb'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'
import { hrJobsPath } from '@/features/hr/domain/hrRoutePaths'
import { jobTitleMaxLength } from '@/features/hr/infrastructure/hrJobLogic'
import styles from '@/features/hr/presentation/pages/HrDashboard.module.css'
import { JobFieldError } from './JobFormSection'

export function JobAiGenerateSection({
  isActionLocked,
  onHome,
  jobsCtrl,
  criteriaCtrl,
  openCreateJobForm,
}: {
  isActionLocked: boolean
  onHome: () => void
  jobsCtrl: any
  criteriaCtrl: any
  openCreateJobForm: () => void
}) {
  return (
    <div className={`role-content ${styles.jobsContent}`}>
      <Breadcrumb items={[
        { label: 'Home', onClick: onHome },
        { label: 'Jobs', onClick: () => { jobsCtrl.setJobView('list'); jobsCtrl.updateHrJobsPath(hrJobsPath) } },
        { label: 'Create New Job Posting', onClick: openCreateJobForm },
        { label: 'Generate with AI' },
      ]} />
      <div className={styles.aiJobTitle}>
        <h1>Create New Job Description</h1>
        <p>Provide the core details and let our AI engine craft the perfect job description for you.</p>
      </div>

      <section className={styles.aiJobLayout}>
        <form className={`${styles.jobForm} ${styles.aiJobForm}`} noValidate>
          <section className={styles.aiJobInputPanel}>
            <label className={styles.fullField}>
              <span>Job Title <b>*</b></span>
              <input className={criteriaCtrl.jobFieldErrors.title ? styles.jobInputError : undefined} value={criteriaCtrl.jobForm.title} maxLength={jobTitleMaxLength} onChange={(e) => criteriaCtrl.updateJobFormField('title', e.target.value)} placeholder="e.g. Senior Product Designer" />
              <JobFieldError message={criteriaCtrl.jobFieldErrors.title} />
            </label>
            <label className={styles.aiDepartmentField}>
              <span>Department <b>*</b></span>
              <select className={criteriaCtrl.jobFieldErrors.department ? styles.jobInputError : undefined} value={criteriaCtrl.jobForm.department} onChange={(e) => criteriaCtrl.updateJobFormField('department', e.target.value)}><option value="">Select department type</option><option value="Engineering">Engineering</option><option value="Design">Design</option><option value="Marketing">Marketing</option><option value="Operations">Operations</option><option value="Data">Data</option></select>
              <JobFieldError message={criteriaCtrl.jobFieldErrors.department} />
            </label>
            <div className={styles.aiLocationField}>
              <span>Location <b>*</b></span>
              <div className={styles.aiLocationControls}>
                <div>
                  <select className={criteriaCtrl.jobFieldErrors.locationType ? styles.jobInputError : undefined} value={criteriaCtrl.jobForm.locationType} onChange={(e) => criteriaCtrl.updateJobFormField('locationType', e.target.value)}><option value="OFFICE">Office</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option></select>
                  <JobFieldError message={criteriaCtrl.jobFieldErrors.locationType} />
                </div>
                <div>
                  <div className={styles.iconInput}>
                    <svg width="16" height="28" viewBox="0 0 16 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 7.45 8 8 8C8.55 8 9.02083 6.5875 9.4125 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="#565E74" />
                    </svg>
                    <input className={criteriaCtrl.jobFieldErrors.location ? styles.jobInputError : undefined} value={criteriaCtrl.jobForm.location} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => criteriaCtrl.updateJobFormField('location', e.target.value)} placeholder="e.g. San Francisco, CA" />
                  </div>
                  <JobFieldError message={criteriaCtrl.jobFieldErrors.location} />
                </div>
              </div>
            </div>
            <label>
              <span>Application Deadline</span>
              <input className={criteriaCtrl.jobFieldErrors.applicationDeadline ? styles.jobInputError : undefined} type="text" value={criteriaCtrl.jobForm.applicationDeadline ? criteriaCtrl.jobForm.applicationDeadline.slice(0, 10) : ''} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => criteriaCtrl.updateJobFormField('applicationDeadline', e.target.value)} placeholder="mm/dd/yyyy" />
              <JobFieldError message={criteriaCtrl.jobFieldErrors.applicationDeadline} />
            </label>
            <div className={styles.aiSalaryField}>
              <span>Salary Range (Optional)</span>
              <div className={styles.aiSalaryControls}>
                <div className={styles.salaryInputSlot}>
                  <div className={`${styles.moneyInput} ${criteriaCtrl.jobFieldErrors.salaryMin ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Minimum salary" type="text" inputMode="decimal" value={criteriaCtrl.salaryInputValues.salaryMin} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => criteriaCtrl.updateSalaryField('salaryMin', e.target.value)} placeholder="0" /></div>
                  <JobFieldError message={criteriaCtrl.jobFieldErrors.salaryMin} />
                </div>
                <div className={styles.salaryInputSlot}>
                  <div className={`${styles.moneyInput} ${criteriaCtrl.jobFieldErrors.salaryMax ? styles.moneyInputError : ''}`}><span>$</span><input aria-label="Maximum salary" type="text" inputMode="decimal" value={criteriaCtrl.salaryInputValues.salaryMax} maxLength={FIELD_LENGTH_LIMITS.defaultText} onChange={(e) => criteriaCtrl.updateSalaryField('salaryMax', e.target.value)} placeholder="0" /></div>
                  <JobFieldError message={criteriaCtrl.jobFieldErrors.salaryMax} />
                </div>
              </div>
            </div>
            <label className={`${styles.fullField} ${styles.aiTextAreaField}`}>
              <span>Key Skills <b>*</b></span>
              <textarea className={criteriaCtrl.jobFieldErrors.requirements ? styles.jobInputError : undefined} value={criteriaCtrl.jobForm.requirements} maxLength={FIELD_LENGTH_LIMITS.jobDescription} onChange={(e) => criteriaCtrl.updateJobFormField('requirements', e.target.value)} placeholder="Add skill..." />
              <JobFieldError message={criteriaCtrl.jobFieldErrors.requirements} />
            </label>
            <button type="button" disabled={isActionLocked} onClick={criteriaCtrl.generateAiJobContent}>Generate Content</button>
          </section>
        </form>

        <aside className={styles.aiDraftPanel}>
          <header>
            <span>AI Content Draft</span>
            <button type="button" aria-label="Copy AI content draft">
              <i className="fa-regular fa-copy"></i>
            </button>
          </header>
          <div className={styles.aiDraftBody}></div>
          <footer>
            <div className={styles.aiTokenUsage}>
              <span>Token Usage</span>
              <strong>2 Generations Left</strong>
              <div><span></span></div>
            </div>
            <div className={styles.aiDraftActions}>
              <button type="button">Regenerate</button>
              <button type="button">Discard Draft</button>
            </div>
            <button type="button" className={styles.aiApproveButton}>Approve &amp; Save Job</button>
          </footer>
        </aside>
      </section>
    </div>
  )
}
