import type { StoredCandidateUser } from '../domain/candidate.types'
import { getUserDisplayName, getUserInitials } from '../../application/candidateUser'

export function UserAvatar({ user, className }: { user: StoredCandidateUser | null; className: string }) {
  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(displayName)

  if (user?.avatar) {
    return (
      <div className={className} aria-label={displayName}>
        <img src={user.avatar} alt="" />
      </div>
    )
  }

  return <div className={className}>{initials}</div>
}
