import { Breadcrumb } from '@/core/components/Breadcrumb'
import { hrJobsPath } from '@/features/hr/domain/hrRoutePaths'
import type { JobPosting } from '@/features/hr/domain/hrApi.types'
import styles from '@/features/hr/presentation/pages/HrDashboard.module.css'

type JobKanbanBoardSectionProps = {
  onHome: () => void
  jobsCtrl: {
    selectedJob: JobPosting | null
    setJobView: (view: 'list' | 'detail' | 'create' | 'edit' | 'ai' | 'kanban') => void
    updateHrJobsPath: (path: string) => void
  }
}

type KanbanCandidate = {
  name: string
  title: string
  time?: string
  score?: string
  checked?: boolean
  muted?: boolean
  note?: string
}

const kanbanColumns: Array<{ key: string; label: string; count: number; items: KanbanCandidate[] }> = [
  {
    key: 'applied',
    label: 'Applied',
    count: 12,
    items: [
      { name: 'Alex Rivera', title: 'Senior Product Designer', time: '2h ago', score: '98% Match', checked: true },
      { name: 'Elena Soroka', title: 'UX Architect', time: '5h ago', score: '84% Match', checked: true },
      { name: 'Babie Teer', title: 'UX Architect', time: '7h ago', score: '89% Match' },
    ],
  },
  {
    key: 'screening',
    label: 'Screening',
    count: 8,
    items: [
      { name: 'Marcus Chen', title: 'Lead Interaction Designer', time: '1d ago', score: '92% Match', checked: true },
      { name: 'Laura Nhat', title: 'Lead Interaction Designer', time: '2d ago', score: '95% Match', checked: true },
    ],
  },
  {
    key: 'interview',
    label: 'Interview',
    count: 5,
    items: [
      { name: 'Suki Tanaka', title: 'Visual Designer', score: '95% Match', checked: true, note: 'Tomorrow, 10:00 AM' },
      { name: 'Amuro Tooru', title: 'Visual Designer', score: '99% Match', checked: true, note: 'Tomorrow, 11:00 AM' },
    ],
  },
  {
    key: 'hired',
    label: 'Hired',
    count: 2,
    items: [
      { name: 'James Wilson', title: 'Principle Designer', checked: true },
      { name: 'James Wilson', title: 'Principle Designer', checked: true },
    ],
  },
  {
    key: 'rejected',
    label: 'Rejected',
    count: 45,
    items: [
      { name: 'Candidate #029', title: 'Skills Mismatch', muted: true },
      { name: 'Candidate #030', title: 'Skills Mismatch', muted: true },
    ],
  },
]

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function JobKanbanBoardSection({ onHome, jobsCtrl }: JobKanbanBoardSectionProps) {
  const selectedJob = jobsCtrl.selectedJob
  const jobTitle = selectedJob?.title || 'Job Kanban Board'

  return (
    <div className={`role-content ${styles.kanbanContent}`}>
      <Breadcrumb items={[
        { label: 'Home', onClick: onHome },
        { label: 'Jobs', onClick: () => { jobsCtrl.setJobView('list'); jobsCtrl.updateHrJobsPath(hrJobsPath) } },
        selectedJob
          ? { label: 'Job Detail', onClick: () => { jobsCtrl.setJobView('detail'); jobsCtrl.updateHrJobsPath(`${hrJobsPath}/${encodeURIComponent(selectedJob.id)}`) } }
          : { label: 'Job Detail' },
        { label: 'Kanban Board' },
      ]} />

      <header className={styles.kanbanHeader}>
        <h1>{jobTitle}</h1>
        <div>
          <button type="button"><i className="fa-solid fa-arrow-down-wide-short"></i> Sort: Applied Date</button>
          <button type="button">Export List</button>
        </div>
      </header>

      <section className={styles.kanbanBoard}>
        {kanbanColumns.map((column) => (
          <article className={styles.kanbanColumn} key={column.key}>
            <header>
              <span>{column.label}</span>
              <strong>{column.count}</strong>
            </header>
            <div>
              {column.items.map((candidate) => (
                <section className={`${styles.kanbanCard} ${candidate.muted ? styles.kanbanCardMuted : ''}`} key={`${column.key}-${candidate.name}-${candidate.title}`}>
                  <div className={styles.kanbanAvatar}>{candidate.muted ? <i className="fa-regular fa-user"></i> : getInitials(candidate.name)}</div>
                  <div>
                    <h2>{candidate.name}</h2>
                    <p>{candidate.title}</p>
                    {candidate.note && (
                      <aside>
                        <i className="fa-regular fa-calendar"></i>
                        <span>{candidate.note}</span>
                        <small>Panel Interview with Tech Team</small>
                      </aside>
                    )}
                    <footer>
                      {candidate.time && <small>{candidate.time}</small>}
                      <span>Stage: {column.label}</span>
                    </footer>
                  </div>
                  {candidate.score && <em>{candidate.score}</em>}
                  <b className={candidate.checked ? styles.kanbanChecked : undefined}></b>
                </section>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
