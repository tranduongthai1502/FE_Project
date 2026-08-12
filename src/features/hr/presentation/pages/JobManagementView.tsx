import { hrCreateJobPostingPath, hrJobsPath } from '@/features/hr/domain/hrRoutePaths'
import { getHrJobDetailPath } from '@/features/hr/application/helpers/hrDashboardHelpers'
import { useHrJobCriteriaController } from '@/features/hr/application/hooks/useHrJobCriteriaController'
import { useHrJobsController } from '@/features/hr/application/hooks/useHrJobsController'
import { JobAiGenerateSection } from '../components/job/JobAiGenerateSection'
import { JobDetailSection } from '../components/job/JobDetailSection'
import { JobFormSection } from '../components/job/JobFormSection'
import { JobListSection } from '../components/job/JobListSection'

type ToastTrigger = (message: string, type?: 'success' | 'error') => void

export function JobManagementView({
  isActionLocked,
  onHome,
  triggerToast,
}: {
  isActionLocked: boolean
  onHome: () => void
  triggerToast?: ToastTrigger
}) {
  const jobsCtrl = useHrJobsController({ isActionLocked, triggerToast })
  const criteriaCtrl = useHrJobCriteriaController({
    selectedJob: jobsCtrl.selectedJob,
    jobView: jobsCtrl.jobView,
    jobDetailTab: jobsCtrl.jobDetailTab,
    jobs: jobsCtrl.jobs,
    isActionLocked,
    onReturnToList: (updatedJob) => {
      if (jobsCtrl.jobView === 'edit' && jobsCtrl.selectedJob?.id) {
        if (updatedJob) {
          jobsCtrl.setSelectedJob(updatedJob)
        }
        jobsCtrl.setJobDetailTab('overview')
        jobsCtrl.setJobView('detail')
        jobsCtrl.updateHrJobsPath(getHrJobDetailPath(jobsCtrl.selectedJob.id))
        return
      }

      if (updatedJob) {
        jobsCtrl.setJobs((currentJobs: any[]) => [
          updatedJob,
          ...currentJobs.filter((job) => job.id !== updatedJob.id),
        ])
        void jobsCtrl.refreshJobs()
        void jobsCtrl.refreshJobStats()
        void jobsCtrl.refreshJobPostingLimit()
      }

      jobsCtrl.setJobView('list')
      jobsCtrl.updateHrJobsPath(hrJobsPath)
    },
    triggerToast,
  })

  const openCreateJobForm = (options: { preserveDraft?: boolean } = {}) => {
    if (!options.preserveDraft) criteriaCtrl.setDeadlineInputValue('')
    jobsCtrl.setJobView('create')
    jobsCtrl.updateHrJobsPath(hrCreateJobPostingPath)
  }

  if (jobsCtrl.jobView === 'detail' && jobsCtrl.selectedJob) {
    return (
      <JobDetailSection
        isActionLocked={isActionLocked}
        onHome={onHome}
        jobsCtrl={jobsCtrl}
        criteriaCtrl={criteriaCtrl}
      />
    )
  }

  if (jobsCtrl.jobView === 'ai') {
    return (
      <JobAiGenerateSection
        isActionLocked={isActionLocked}
        onHome={onHome}
        jobsCtrl={jobsCtrl}
        criteriaCtrl={criteriaCtrl}
        openCreateJobForm={openCreateJobForm}
      />
    )
  }

  if (jobsCtrl.jobView === 'create' || jobsCtrl.jobView === 'edit') {
    return (
      <JobFormSection
        isActionLocked={isActionLocked}
        onHome={onHome}
        jobsCtrl={jobsCtrl}
        criteriaCtrl={criteriaCtrl}
      />
    )
  }

  return (
    <JobListSection
      isActionLocked={isActionLocked}
      onHome={onHome}
      jobsCtrl={jobsCtrl}
    />
  )
}

export const HrJobsView = JobManagementView
