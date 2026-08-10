import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'

export type DashboardShellUser = {
  full_name?: string | null
  fullName?: string | null
  name?: string | null
  email?: string | null
  avatar?: string | null
  role?: string | null
  roleName?: string | null
  role_name?: string | null
  userRole?: string | null
  user_role?: string | null
  type?: string | null
}

function getDisplayName(user: DashboardShellUser | null | undefined) {
  return user?.full_name || user?.fullName || user?.name || user?.email || 'Alex Thompson'
}

function formatDisplayName(value: string, limit = 15) {
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, limit)}...`
}

function formatRoleLabel(role: string) {
  return role
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .map((word) => word.toLowerCase() === 'hr' ? 'HR' : `${word[0]?.toUpperCase() || ''}${word.slice(1).toLowerCase()}`)
    .join(' ')
}

function getDisplayRole(user: DashboardShellUser | null | undefined, fallback: string) {
  const role = user?.roleName || user?.role_name || user?.role || user?.userRole || user?.user_role || user?.type

  return role ? formatRoleLabel(role) : fallback
}

function getUserInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'U'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

function truncateDisplayName(name: string) {
  return name.length > 10 ? `${name.slice(0, 10)}...` : name
}

function getInitialSidebarVisibility() {
  return !window.matchMedia('(max-width: 980px)').matches
}

export function DashboardShell({
  children,
  navItems,
  subtitle,
  user,
  onLogout,
  onProfile,
  onChangePassword,
  showWorkspaceSwitcher = false,
  onWorkspaceSwitch,
  className = '',
}: {
  children: ReactNode
  navItems: Array<{ icon: string; label: string; active?: boolean; onClick?: () => void }>
  subtitle: string
  user?: DashboardShellUser | null
  onLogout: () => void
  onProfile?: () => void
  onChangePassword?: () => void
  showWorkspaceSwitcher?: boolean
  onWorkspaceSwitch?: () => void
  className?: string
}) {
  const displayName = getDisplayName(user)
  const displayNamePreview = truncateDisplayName(formatDisplayName(displayName))
  const displayRole = getDisplayRole(user, subtitle)
  const userInitials = getUserInitials(displayName)
  const [isSidebarVisible, setIsSidebarVisible] = useState(getInitialSidebarVisibility)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChangePassword = () => {
    onChangePassword?.()
    setIsUserDropdownOpen(false)
  }

  const handleProfile = () => {
    onProfile?.()
    setIsUserDropdownOpen(false)
  }

  const handleLogout = () => {
    setIsUserDropdownOpen(false)
    setIsLogoutConfirmOpen(true)
  }

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(false)
    onLogout()
  }

  return (
    <main className={`role-page ${isSidebarVisible ? '' : 'is-sidebar-hidden'} ${className}`.trim()}>
      <aside className={`role-sidebar ${isSidebarVisible ? 'is-open' : ''}`}>
        <div className="role-brand">
          <div className="role-brand-copy">
            <strong>JobFusion</strong>
            <span>AI Talent Suite</span>
          </div>
          <button
            type="button"
            className={`role-sidebar-trigger ${isSidebarVisible ? 'is-open' : ''}`}
            aria-label={isSidebarVisible ? 'Hide navigation sidebar' : 'Show navigation sidebar'}
            aria-expanded={isSidebarVisible}
            onClick={() => setIsSidebarVisible((value) => !value)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {isSidebarVisible ? 'arrow_menu_close' : 'arrow_menu_open'}
            </span>
          </button>
        </div>
        <nav className="role-nav" aria-label={`${subtitle} navigation`}>
          {navItems.map((item) => (
            <button key={item.label} type="button" className={item.active ? 'active' : ''} onClick={item.onClick}>
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="role-main">
        <header className="role-topbar">
          {showWorkspaceSwitcher && <button type="button" className="role-switcher" onClick={onWorkspaceSwitch}>Workspace Switcher</button>}
          <div className="role-icons">
            <i className="fa-regular fa-bell"></i>
            <i className="fa-regular fa-circle-question"></i>
          </div>
          <div className="role-user-menu-container" ref={userDropdownRef}>
            <button
              type="button"
              className={`role-user ${isUserDropdownOpen ? 'is-open' : ''}`}
              onClick={() => setIsUserDropdownOpen((value) => !value)}
              aria-label="User menu"
              aria-expanded={isUserDropdownOpen}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                <span className="role-user-avatar">{userInitials}</span>
              )}
              <span className="role-user-text">
                <strong title={displayName}>{displayNamePreview}</strong>
                <small>{displayRole}</small>
              </span>
              <i className={`fa-solid fa-chevron-down role-user-chevron ${isUserDropdownOpen ? 'open' : ''}`}></i>
            </button>

            {isUserDropdownOpen && (
              <div className="role-user-dropdown" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="role-user-dropdown-item" onClick={handleProfile}>
                  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM18 16V13C18 12.2667 17.7958 11.5625 17.3875 10.8875C16.9792 10.2125 16.4 9.63333 15.65 9.15C16.5 9.25 17.3 9.42083 18.05 9.6625C18.8 9.90417 19.5 10.2 20.15 10.55C20.75 10.8833 21.2083 11.2542 21.525 11.6625C21.8417 12.0708 22 12.5167 22 13V16H18ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM18 4C18 5.1 17.6083 6.04167 16.825 6.825C16.0417 7.60833 15.1 8 14 8C13.8167 8 13.5833 7.97917 13.3 7.9375C13.0167 7.89583 12.7833 7.85 12.6 7.8C13.05 7.26667 13.3958 6.675 13.6375 6.025C13.8792 5.375 14 4.7 14 4C14 3.3 13.8792 2.625 13.6375 1.975C13.3958 1.325 13.05 0.733333 12.6 0.2C12.8333 0.116667 13.0667 0.0625 13.3 0.0375C13.5333 0.0125 13.7667 0 14 0C15.1 0 16.0417 0.391667 16.825 1.175C17.6083 1.95833 18 2.9 18 4ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#0B1C30" />
                  </svg>
                  <span>Profile</span>
                </button>
                <button type="button" className="role-user-dropdown-item" onClick={handleChangePassword}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9V6ZM18 20H6V10H18V20ZM12 17C13.1 17 14 16.1 14 15C14 13.9 13.1 13 12 13C10.9 13 10 13.9 10 15C10 16.1 10.9 17 12 17Z" fill="#0B1C30" />
                  </svg>
                  <span>Change password</span>
                </button>
                <button type="button" className="role-user-dropdown-item logout" onClick={handleLogout}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M6 2H15C15.5304 2 16.0391 2.21071 16.4142 2.58579C16.7893 2.96086 17 3.46957 17 4V6H15V4H6V20H15V18H17V20C17 20.5304 16.7893 21.0391 16.4142 21.4142C16.0391 21.7893 15.5304 22 15 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2Z" fill="#0B1C30" />
                    <path d="M16.09 15.59L17.5 17L22.5 12L17.5 7L16.09 8.41L18.67 11H9V13H18.67L16.09 15.59Z" fill="#0B1C30" />
                  </svg>
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </header>
        {children}
      </section>
      {isLogoutConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={false}
          message="Are you sure you want to log out?"
          onCancel={() => setIsLogoutConfirmOpen(false)}
          onConfirm={confirmLogout}
        />
      )}
    </main>
  )
}
