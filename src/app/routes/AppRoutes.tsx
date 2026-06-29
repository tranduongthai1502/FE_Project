import { useState } from 'react'
import { Toast } from '../../components/common/Toast'
import { useAdminSettings } from '../../features/admin/hooks/useAdminSettings'
import { useToast } from '../../hooks/useToast'
import { AdminDashboardPage } from '../../pages/AdminDashboardPage'
import { LoginPage } from '../../pages/LoginPage'
import { SignupPage } from '../../pages/SignupPage'

type AppPage = 'login' | 'signup' | 'admin'

export function AppRoutes() {
  const [page, setPage] = useState<AppPage>('login')
  const { showToast, toastFadeOut, toastMessage, toastType, triggerToast } = useToast()
  const {
    activeSidebarMenu,
    setActiveSidebarMenu,
    activeSettingsTab,
    setActiveSettingsTab,
    adminCurrentPassword,
    setAdminCurrentPassword,
    adminNewPassword,
    setAdminNewPassword,
    adminConfirmPassword,
    setAdminConfirmPassword,
    adminCurrentPasswordError,
    setAdminCurrentPasswordError,
    adminNewPasswordError,
    setAdminNewPasswordError,
    adminConfirmPasswordError,
    setAdminConfirmPasswordError,
    showAdminCurrentPassword,
    setShowAdminCurrentPassword,
    showAdminNewPassword,
    setShowAdminNewPassword,
    showAdminConfirmPassword,
    setShowAdminConfirmPassword,
    adminStrength,
    isAdminSaving,
    showConfirmSave,
    setShowConfirmSave,
    handleAdminSaveChanges,
    executeAdminSaveChanges,
    handleAdminCancel,
  } = useAdminSettings({ triggerToast })

  const handleSignInSuccess = () => {
    handleAdminCancel()
    setPage('admin')
    triggerToast('Logged in successfully.')
  }

  const handleLogout = () => {
    setPage('login')
    triggerToast('Logged out successfully.')
  }

  if (page === 'signup') {
    return (
      <>
        <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
        <SignupPage onGoToSignin={() => setPage('login')} />
      </>
    )
  }

  if (page === 'admin') {
    return (
      <>
        <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
        <AdminDashboardPage
          activeSidebarMenu={activeSidebarMenu}
          setActiveSidebarMenu={setActiveSidebarMenu}
          activeSettingsTab={activeSettingsTab}
          setActiveSettingsTab={setActiveSettingsTab}
          adminCurrentPassword={adminCurrentPassword}
          setAdminCurrentPassword={setAdminCurrentPassword}
          adminNewPassword={adminNewPassword}
          setAdminNewPassword={setAdminNewPassword}
          adminConfirmPassword={adminConfirmPassword}
          setAdminConfirmPassword={setAdminConfirmPassword}
          adminCurrentPasswordError={adminCurrentPasswordError}
          setAdminCurrentPasswordError={setAdminCurrentPasswordError}
          adminNewPasswordError={adminNewPasswordError}
          setAdminNewPasswordError={setAdminNewPasswordError}
          adminConfirmPasswordError={adminConfirmPasswordError}
          setAdminConfirmPasswordError={setAdminConfirmPasswordError}
          showAdminCurrentPassword={showAdminCurrentPassword}
          setShowAdminCurrentPassword={setShowAdminCurrentPassword}
          showAdminNewPassword={showAdminNewPassword}
          setShowAdminNewPassword={setShowAdminNewPassword}
          showAdminConfirmPassword={showAdminConfirmPassword}
          setShowAdminConfirmPassword={setShowAdminConfirmPassword}
          adminStrength={adminStrength}
          isLoading={isAdminSaving}
          showConfirmSave={showConfirmSave}
          setShowConfirmSave={setShowConfirmSave}
          handleAdminSaveChanges={handleAdminSaveChanges}
          executeAdminSaveChanges={executeAdminSaveChanges}
          handleAdminCancel={handleAdminCancel}
          handleLogout={handleLogout}
        />
      </>
    )
  }

  return (
    <>
      <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
      <LoginPage onGoToSignup={() => setPage('signup')} onSignInSuccess={handleSignInSuccess} />
    </>
  )
}
