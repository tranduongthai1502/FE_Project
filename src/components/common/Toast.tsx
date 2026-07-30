import type { CSSProperties } from 'react'

type ToastProps = {
  isVisible: boolean
  isFadingOut: boolean
  message: string
  type?: 'success' | 'error'
}

export function Toast({ isVisible, isFadingOut, message, type = 'success' }: ToastProps) {
  if (!isVisible) return null

  const isError = type === 'error'
  const toastClass = isError ? 'toast-error' : 'toast-success'
  const iconClass = isError ? 'fa-regular fa-circle-xmark' : 'fa-regular fa-square-check'
  const toastStyle: CSSProperties = {
    right: 24,
    left: 'auto',
    animationName: isFadingOut ? 'slideOutRight' : 'slideInRight',
  }

  return (
    <div
      className={`toast-notification ${toastClass} ${isFadingOut ? 'hide' : ''}`}
      role="alert"
      aria-live="assertive"
      style={toastStyle}
    >
      <span className="toast-icon">
        <i className={iconClass}></i>
      </span>
      <span className="toast-text">{message}</span>
    </div>
  )
}
