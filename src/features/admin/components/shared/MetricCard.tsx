export function MetricCard({ icon, label, value, note }: { icon: string; label: string; value: string; note?: string }) {
  const noteTone = note?.trim().startsWith('+') ? 'positive' : note?.trim().startsWith('-') ? 'negative' : ''

  return (
    <article className="role-metric">
      <span><i className={`fa-solid ${icon}`}></i></span>
      <small>{label}</small>
      <strong>{value}</strong>
      {note && <em className={noteTone}>{note}</em>}
    </article>
  )
}

