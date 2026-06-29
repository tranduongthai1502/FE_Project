import { useState } from 'react'
import { getAdminPasswordStrength } from '../../utils/passwordStrength'

export function useAdminSettings({ triggerToast }) {
  const [activeSidebarMenu, setActiveSidebarMenu] = useState('dashboard')
  const [activeSettingsTab, setActiveSettingsTab] = useState('change_password')

  const [adminCurrentPassword, setAdminCurrentPassword] = useState('')
  const [adminNewPassword, setAdminNewPassword] = useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')

  const [adminCurrentPasswordError, setAdminCurrentPasswordError] = useState('')
  const [adminNewPasswordError, setAdminNewPasswordError] = useState('')
  const [adminConfirmPasswordError, setAdminConfirmPasswordError] = useState('')

  const [showAdminCurrentPassword, setShowAdminCurrentPassword] = useState(false)
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false)
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false)
  const [isAdminSaving, setIsAdminSaving] = useState(false)
  const [showConfirmSave, setShowConfirmSave] = useState(false)

  const adminStrength = getAdminPasswordStrength(adminNewPassword)

  const handleAdminCancel = () => {
    setAdminCurrentPassword('')
    setAdminNewPassword('')
    setAdminConfirmPassword('')
    setAdminCurrentPasswordError('')
    setAdminNewPasswordError('')
    setAdminConfirmPasswordError('')
  }

  const handleAdminSaveChanges = (event) => {
    event.preventDefault()
    let hasError = false

    if (!adminCurrentPassword) {
      setAdminCurrentPasswordError('Please enter current password.')
      hasError = true
    } else {
      setAdminCurrentPasswordError('')
    }

    if (!adminNewPassword) {
      setAdminNewPasswordError('Please enter new password.')
      hasError = true
    } else if (adminStrength.score < 4) {
      setAdminNewPasswordError('Password does not meet requirements.')
      hasError = true
    } else {
      setAdminNewPasswordError('')
    }

    if (!adminConfirmPassword) {
      setAdminConfirmPasswordError('Please enter confirm password.')
      hasError = true
    } else if (adminNewPassword !== adminConfirmPassword) {
      setAdminConfirmPasswordError('Passwords do not match.')
      hasError = true
    } else {
      setAdminConfirmPasswordError('')
    }

    if (hasError) return

    // Show confirmation popup modal instead of executing save instantly
    setShowConfirmSave(true)
  }

  const executeAdminSaveChanges = () => {
    setShowConfirmSave(false)
    setIsAdminSaving(true)

    setTimeout(() => {
      setIsAdminSaving(false)
      setAdminCurrentPassword('')
      setAdminNewPassword('')
      setAdminConfirmPassword('')
      triggerToast()
    }, 1200)
  }

  return {
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
  }
}
