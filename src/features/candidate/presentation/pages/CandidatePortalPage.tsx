import { useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AccountSettingsPanel, getStoredDashboardUser, type DashboardUser } from '@/features/auth'
import { DashboardShell } from '@/core/components/DashboardShell'

import { candidateNavItems } from '../../domain/candidateData'
import type { CandidatePortalPageProps } from '../../domain/candidate.types'
import { getUserDisplayName } from '../../application/candidateUserDisplay'
import { CandidateDashboard } from '../components/CandidateDashboard'
import { CandidateCompaniesPage } from '../components/CandidateCompaniesPage'
import { CandidateCompanyDetailPage } from '../components/CandidateCompanyDetailPage'
import { CandidateJobDetailPage } from '../components/CandidateJobDetailPage'
import { CandidateCvUploadPage } from '../components/CandidateCvUploadPage'
import { CandidateCvScorePage } from '../components/CandidateCvScorePage'

export function CandidatePortalPage({ onLogout, triggerToast }: CandidatePortalPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user] = useState<DashboardUser | null>(() => getStoredDashboardUser())
  const displayName = getUserDisplayName(user)
  const nameParts = displayName.trim().split(/\s+/).filter(Boolean)
  const lastName = nameParts[nameParts.length - 1] || displayName
  const isChangePasswordRoute = location.pathname === '/candidate/change-password'
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/candidate'
  const navItems = useMemo(() => candidateNavItems.map((item) => ({
    icon: item.icon,
    label: item.label,
    active: !isChangePasswordRoute && Boolean(item.path) && (
      normalizedPath === item.path || (item.path !== '/candidate' && normalizedPath.startsWith(`${item.path}/`))
    ),
    onClick: item.path ? () => navigate(item.path) : undefined,
  })), [isChangePasswordRoute, navigate, normalizedPath])

  return (
    <DashboardShell
      navItems={navItems}
      subtitle="Candidate"
      user={user}
      onLogout={onLogout}
      onProfile={() => navigate('/candidate')}
      onChangePassword={() => navigate('/candidate/change-password')}
      className="candidate-shell"
    >
      <div className={`candidate-content ${isChangePasswordRoute ? 'candidate-content-settings' : ''}`}>
        <Routes>
          <Route index element={<CandidateDashboard lastName={lastName} />} />
          <Route path="companies" element={<CandidateCompaniesPage />} />
          <Route path="companies/:companyId" element={<CandidateCompanyDetailPage />} />
          <Route path="companies/:companyId/jobs/:jobId" element={<CandidateJobDetailPage />} />
          <Route path="companies/:companyId/jobs/:jobId/upload-cv" element={<CandidateCvUploadPage />} />
          <Route path="companies/:companyId/jobs/:jobId/cv-score" element={<CandidateCvScorePage />} />
          <Route
            path="change-password"
            element={(
              <AccountSettingsPanel
                onBack={() => navigate('/candidate')}
                triggerToast={triggerToast}
              />
            )}
          />
          <Route path="*" element={<Navigate to="/candidate" replace />} />
        </Routes>
      </div>

      <footer className="candidate-footer">
        <div>
          <strong>JobFusion AI</strong>
          <span>Copyright 2024 JobFusion AI. All rights reserved.</span>
        </div>
        <nav>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#help">Help Center</a>
        </nav>
      </footer>
    </DashboardShell>
  )
}
