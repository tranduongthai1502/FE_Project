import { useMemo, useState } from 'react'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { CandidateEmptyState } from '@/core/components/CandidateEmptyState'
import { SearchInput } from '@/core/components/SearchInput'
import { ScrollableSelect } from '@/core/components/ScrollableSelect'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMatchScore, setSelectedMatchScore] = useState('all')
  const [selectedAppliedDate, setSelectedAppliedDate] = useState('all')

  const visibleCandidates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = assignedCandidates.filter((candidate) => {
      const matchesSearch = !query || `${candidate.name} ${candidate.title}`.toLowerCase().includes(query)
      const matchesScore = selectedMatchScore === 'all'
        || (selectedMatchScore === 'high' && candidate.matchScore >= 90)
        || (selectedMatchScore === 'medium' && candidate.matchScore >= 75 && candidate.matchScore < 90)
        || (selectedMatchScore === 'low' && candidate.matchScore < 75)
      return matchesSearch && matchesScore
    })

    if (selectedAppliedDate === 'oldest') return [...filtered].reverse()
    return filtered
  }, [searchQuery, selectedMatchScore, selectedAppliedDate])

  return (
    <div className={`role-content ${styles.candidatesContent}`}>
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Candidates' }]} />

      <header className={styles.candidatesHeader}>
        <h1>Candidates Assigned to Me</h1>
        <p>Review and evaluate candidates recently assigned for your expert feedback.</p>
      </header>

      <div className={styles.candidateFilters}>
        <SearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search candidates..."
          ariaLabel="Search candidates"
          className={styles.candidateSearch}
        />
        <ScrollableSelect
          className={styles.candidateFilter}
          value={selectedMatchScore}
          onChange={setSelectedMatchScore}
          ariaLabel="Filter by match score"
          options={[
            { value: 'all', label: 'Match Score: All' },
            { value: 'high', label: 'Match Score: >= 90%' },
            { value: 'medium', label: 'Match Score: 75% - 89%' },
            { value: 'low', label: 'Match Score: < 75%' },
          ]}
        />
        <ScrollableSelect
          className={styles.candidateFilter}
          value={selectedAppliedDate}
          onChange={setSelectedAppliedDate}
          ariaLabel="Filter by date applied"
          options={[
            { value: 'all', label: 'Date Applied: All' },
            { value: 'newest', label: 'Date Applied: Newest First' },
            { value: 'oldest', label: 'Date Applied: Oldest First' },
          ]}
        />
      </div>

      {visibleCandidates.length === 0 ? <CandidateEmptyState /> : <section className={styles.assignedCandidateGrid} aria-label="Assigned candidates">
        {visibleCandidates.map((candidate) => (
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
      </section>}
    </div>
  )
}
