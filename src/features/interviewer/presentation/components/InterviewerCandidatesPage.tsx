import { Breadcrumb } from '@/core/components/Breadcrumb'
import styles from './InterviewerDashboard.module.css'

type AssignedCandidate = {
  id: string
  name: string
  title: string
  dateAssigned: string
  experience: string
  matchScore: number
  skills: string[]
  image: string
}

const assignedCandidates: AssignedCandidate[] = [
  {
    id: 'cand-elena-1',
    name: 'Elena Rodriguez',
    title: 'Senior Frontend Engineer',
    dateAssigned: 'Oct 24, 2023',
    experience: '8+ Years',
    matchScore: 94,
    skills: ['React', 'TypeScript', 'Design Systems'],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
  },
  {
    id: 'cand-alex',
    name: 'Alex Thompson',
    title: 'Product Manager',
    dateAssigned: 'Oct 23, 2023',
    experience: '5+ Years',
    matchScore: 88,
    skills: ['Agile', 'Data Analysis', 'Strategy'],
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
  },
  {
    id: 'cand-sarah',
    name: 'Sarah J. Miller',
    title: 'UX Research Lead',
    dateAssigned: 'Oct 25, 2023',
    experience: '10+ Years',
    matchScore: 91,
    skills: ['Usability', 'Workshop', 'Metrics'],
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=96&q=80',
  },
  {
    id: 'cand-rosy',
    name: 'Rosy Chao',
    title: 'UX Research Lead',
    dateAssigned: 'Oct 25, 2023',
    experience: '10+ Years',
    matchScore: 91,
    skills: ['Usability', 'Workshop', 'Metrics'],
    image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=96&q=80',
  },
  {
    id: 'cand-elena-2',
    name: 'Elena Rodriguez',
    title: 'Senior Frontend Engineer',
    dateAssigned: 'Oct 24, 2023',
    experience: '8+ Years',
    matchScore: 94,
    skills: ['React', 'TypeScript', 'Design Systems'],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
  },
  {
    id: 'cand-elena-3',
    name: 'Elena Rodriguez',
    title: 'Senior Frontend Engineer',
    dateAssigned: 'Oct 24, 2023',
    experience: '8+ Years',
    matchScore: 94,
    skills: ['React', 'TypeScript', 'Design Systems'],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
  },
]

export function InterviewerCandidatesPage({ onHome }: { onHome: () => void }) {
  return (
    <div className={`role-content ${styles.candidatesContent}`}>
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Candidates' }]} />

      <header className={styles.candidatesHeader}>
        <h1>Candidates Assigned to Me</h1>
        <p>Review and evaluate candidates recently assigned for your expert feedback.</p>
      </header>

      <section className={styles.assignedCandidateGrid} aria-label="Assigned candidates">
        {assignedCandidates.map((candidate) => (
          <article className={styles.assignedCandidateCard} key={candidate.id}>
            <header>
              <img src={candidate.image} alt="" />
              <div>
                <strong>{candidate.name}</strong>
                <span>{candidate.title}</span>
              </div>
              <em>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                {candidate.matchScore}%
              </em>
            </header>

            <dl>
              <div>
                <dt>Date Assigned</dt>
                <dd>{candidate.dateAssigned}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>{candidate.experience}</dd>
              </div>
              <div>
                <dt>Skills Highlight</dt>
                <dd>
                  {candidate.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </div>
  )
}
