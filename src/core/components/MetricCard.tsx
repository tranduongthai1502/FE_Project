import type { ReactNode } from 'react'

type MetricCardProps = {
  icon: string
  label: string
  value: ReactNode
  note?: ReactNode
  className?: string
}

export function MetricCard({ icon, label, value, note, className = '' }: MetricCardProps) {
  const noteText = typeof note === 'string' ? note.trim() : ''
  const noteTone = noteText.startsWith('+') ? 'positive' : noteText.startsWith('-') ? 'negative' : ''
  const classes = ['role-metric', className].filter(Boolean).join(' ')

  return (
    <article className={classes}>
      <span><i className={`fa-solid ${icon}`}></i></span>
      <small>{label}</small>
      <strong>{value}</strong>
      {note && <em className={noteTone}>{note}</em>}
    </article>
  )
}

