import React from 'react'
import { Toast } from './components/Toast'
import { AuthLayout } from './components/AuthLayout'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { ForgotPasswordForm } from './components/ForgotPasswordForm'
import { OtpForm } from './components/OtpForm'
import { ResetPasswordForm } from './components/ResetPasswordForm'
import { AdminDashboard } from './pages/AdminDashboard'

import { useAdminSettings } from './features/admin/useAdminSettings'
import { useAuthFlow } from './features/auth/useAuthFlow'
import { useToast } from './hooks/useToast'

function App() {
  const backdropMouseDownRef = React.useRef(false)
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
  
  const {
    step,
    setStep,
    email,
    setEmail,
    emailError,
    setEmailError,
    isAuthLoading,
    otp,
    setOtp,
    otpError,
    setOtpError,
    otpInputsRef,
    countdown,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    newPasswordError,
    setNewPasswordError,
    confirmPasswordError,
    setConfirmPasswordError,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    strength,
    startTimer,
    validateEmail,
    handleSendCode,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerifyOtp,
    handleResetPassword,
    handleBackToLogin,
    handleSignInSubmit,
  } = useAuthFlow({ triggerToast, onSignInSuccess: handleAdminCancel })

  const handleLogout = () => {
    handleBackToLogin()
    triggerToast("Logged out successfully.")
  }

  const handleBackdropMouseDown = (e) => {
    backdropMouseDownRef.current = e.target === e.currentTarget
  }

  const handleBackdropMouseUp = (e) => {
    if (backdropMouseDownRef.current && e.target === e.currentTarget) {
      handleBackToLogin()
    }
    backdropMouseDownRef.current = false
  }

  const isLoading = isAuthLoading || isAdminSaving

  return (
    <>
      <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />

      {step !== 'admin' ? (
        <>
          {/* Main Auth split screen: displays LoginForm when on login or recovery steps, and RegisterForm on register step */}
          <AuthLayout cardClass={step === 'register' ? 'register-card' : ''}>
            {step === 'register' ? (
              <RegisterForm
                setStep={setStep}
                isLoading={isLoading}
                triggerToast={triggerToast}
              />
            ) : (
              <LoginForm
                setStep={setStep}
                setEmail={setEmail}
                setEmailError={setEmailError}
                isLoading={isLoading}
                handleSignInSubmit={handleSignInSubmit}
              />
            )}
          </AuthLayout>

          {/* Recovery Flow Popup Modal */}
          {['forgot', 'otp', 'reset'].includes(step) && (
            <div 
              className="recovery-modal-backdrop" 
              onMouseDown={handleBackdropMouseDown}
              onMouseUp={handleBackdropMouseUp}
            >
              <div className="recovery-popup-card" onClick={(e) => e.stopPropagation()}>
                {/* Close button in top-right of popup */}
                <button
                  type="button"
                  className="popup-close-btn"
                  onClick={handleBackToLogin}
                  aria-label="Close recovery popup"
                  disabled={isLoading}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>

                {step === 'forgot' && (
                  <ForgotPasswordForm
                    email={email}
                    setEmail={setEmail}
                    emailError={emailError}
                    setEmailError={setEmailError}
                    isLoading={isLoading}
                    validateEmail={validateEmail}
                    handleSendCode={handleSendCode}
                    handleBackToLogin={handleBackToLogin}
                  />
                )}

                {step === 'otp' && (
                  <OtpForm
                    otp={otp}
                    setOtp={setOtp}
                    otpError={otpError}
                    setOtpError={setOtpError}
                    otpInputsRef={otpInputsRef}
                    countdown={countdown}
                    isLoading={isLoading}
                    handleOtpChange={handleOtpChange}
                    handleOtpKeyDown={handleOtpKeyDown}
                    handleOtpPaste={handleOtpPaste}
                    handleVerifyOtp={handleVerifyOtp}
                    handleBackToLogin={handleBackToLogin}
                    startTimer={startTimer}
                  />
                )}

                {step === 'reset' && (
                  <ResetPasswordForm
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    newPasswordError={newPasswordError}
                    setNewPasswordError={setNewPasswordError}
                    confirmPasswordError={confirmPasswordError}
                    setConfirmPasswordError={setConfirmPasswordError}
                    showNewPassword={showNewPassword}
                    setShowNewPassword={setShowNewPassword}
                    showConfirmPassword={showConfirmPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                    strength={strength}
                    isLoading={isLoading}
                    handleResetPassword={handleResetPassword}
                    handleBackToLogin={handleBackToLogin}
                  />
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <AdminDashboard
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
          isLoading={isLoading}
          showConfirmSave={showConfirmSave}
          setShowConfirmSave={setShowConfirmSave}
          handleAdminSaveChanges={handleAdminSaveChanges}
          executeAdminSaveChanges={executeAdminSaveChanges}
          handleAdminCancel={handleAdminCancel}
          handleBackToLogin={handleBackToLogin}
          handleLogout={handleLogout}
        />
      )}
    </>
  )
}

export default App
