import React from 'react'

export function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action will trigger the next step in the recruitment workflow.",
  alertTitle = "WORKFLOW ALERT",
  alertMessage = "Are you sure you want to cancel? Your changes will not be saved.",
  onConfirm,
  onCancel,
}) {
  const backdropMouseDownRef = React.useRef(false)

  if (!isOpen) return null

  // Setup click away safety similar to the main modal
  const handleMouseDown = (e) => {
    backdropMouseDownRef.current = e.target === e.currentTarget
  }

  const handleMouseUp = (e) => {
    if (backdropMouseDownRef.current && e.target === e.currentTarget) {
      onCancel()
    }
    backdropMouseDownRef.current = false
  }

  return (
    <div 
      className="confirm-modal-backdrop" 
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="confirm-modal-card" onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="confirm-modal-header">
          <h2 className="confirm-modal-title">{title}</h2>
          <button 
            type="button" 
            className="confirm-modal-close-btn" 
            onClick={onCancel}
            aria-label="Close confirmation dialog"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
          
          {/* Blue Alert Banner */}
          <div className="confirm-alert-banner">
            <div className="confirm-alert-icon-container">
              <i className="fa-solid fa-circle-info"></i>
            </div>
            <div className="confirm-alert-content">
              <span className="confirm-alert-title">{alertTitle}</span>
              <p className="confirm-alert-text">{alertMessage}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="confirm-modal-footer">
          <button 
            type="button" 
            className="confirm-btn-cancel" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="confirm-btn-proceed" 
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
