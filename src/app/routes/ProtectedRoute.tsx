import type { ReactNode } from 'react'

type ProtectedRouteProps = {
  isAllowed: boolean
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ isAllowed, children, fallback = null }: ProtectedRouteProps) {
  if (!isAllowed) {
    return fallback
  }

  return children
}
