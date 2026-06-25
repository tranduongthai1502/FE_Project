export function ToastNotification({ isVisible, isFadingOut }) {
  if (!isVisible) return null

  return (
    <div className={`toast-notification ${isFadingOut ? 'hide' : ''}`} role="alert" aria-live="assertive">
      <span className="toast-icon">
        <i className="fa-regular fa-square-check"></i>
      </span>
      <span className="toast-text">Password reset successful.</span>
    </div>
  )
}
