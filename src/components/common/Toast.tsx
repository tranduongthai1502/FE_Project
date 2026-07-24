import type { CSSProperties } from 'react'

type ToastProps = {
  isVisible: boolean
  isFadingOut: boolean
  text: string
  isError?: boolean
}

export function Toast({ isVisible, isFadingOut, text, isError = false }: ToastProps) {
  if (!isVisible) return null

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
      <span className="toast-text">{text}</span>
    </div>
  )
}
