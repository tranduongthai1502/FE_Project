import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type StoredUser = {
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

function getStoredUser(): StoredUser | null {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

function getDisplayName(user: StoredUser | null) {
  return user?.full_name || user?.fullName || user?.name || user?.email || 'Alex Thompson'
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

function getDisplayRole(user: StoredUser | null, fallback: string) {
  const role = user?.roleName || user?.role_name || user?.role || user?.userRole || user?.user_role || user?.type

  return role ? formatRoleLabel(role) : fallback
}

function getUserInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'U'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

export function DashboardShell({
  children,
  navItems,
  subtitle,
  onLogout,
  onChangePassword,
  showWorkspaceSwitcher = false,
  onWorkspaceSwitch,
  className = '',
}: {
  children: ReactNode
  navItems: Array<{ icon: string; label: string; active?: boolean; onClick?: () => void }>
  subtitle: string
  onLogout: () => void
  onChangePassword?: () => void
  showWorkspaceSwitcher?: boolean
  onWorkspaceSwitch?: () => void
  className?: string
}) {
  const user = useMemo(() => getStoredUser(), [])
  const displayName = getDisplayName(user)
  const displayRole = getDisplayRole(user, subtitle)
  const userInitials = getUserInitials(displayName)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
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

  const handleLogout = () => {
    setIsUserDropdownOpen(false)
    onLogout()
  }

  return (
    <main className={`role-page ${isSidebarVisible ? '' : 'is-sidebar-hidden'} ${className}`.trim()}>
      <aside className={`role-sidebar ${isSidebarVisible ? 'is-open' : ''}`}>
        <div className="role-brand">
          <strong>JobFusion</strong>
          <span>AI Talent Suite</span>
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
                <strong>{displayName}</strong>
                <small>{displayRole}</small>
              </span>
              <i className={`fa-solid fa-chevron-down role-user-chevron ${isUserDropdownOpen ? 'open' : ''}`}></i>
            </button>

            {isUserDropdownOpen && (
              <div className="role-user-dropdown" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="role-user-dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                  <i className="fa-solid fa-user-group"></i>
                  <span>Profile</span>
                </button>
                <button type="button" className="role-user-dropdown-item" onClick={handleChangePassword}>
                  <i className="fa-solid fa-lock"></i>
                  <span>Change password</span>
                </button>
                <button type="button" className="role-user-dropdown-item logout" onClick={handleLogout}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </header>
        {children}
      </section>
    </main>
  )
}

