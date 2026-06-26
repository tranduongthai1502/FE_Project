import React from 'react'

export function Toast({ isVisible, isFadingOut, message, type = 'success' }) {
  if (!isVisible) return null

  const isError = type === 'error'
  const toastClass = isError ? 'toast-error' : 'toast-success'
  const iconClass = isError ? 'fa-regular fa-circle-xmark' : 'fa-regular fa-square-check'

  return (
    <div className={`toast-notification ${toastClass} ${isFadingOut ? 'hide' : ''}`} role="alert" aria-live="assertive">
      <span className="toast-icon">
        <i className={iconClass}></i>
      </span>
      <span className="toast-text">{message}</span>
    </div>
  )
}
