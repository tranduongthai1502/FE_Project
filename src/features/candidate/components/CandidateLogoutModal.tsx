export function CandidateLogoutModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="candidate-logout-modal-backdrop" role="presentation">
      <section className="candidate-logout-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-logout-title">
        <div className="candidate-logout-modal-body">
          <div className="candidate-logout-modal-heading">
            <h2 id="candidate-logout-title">Confirm Action</h2>
            <button
              type="button"
              className="candidate-logout-modal-close"
              onClick={onCancel}
              aria-label="Close logout confirmation"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <p>Are you sure you want to log out?</p>
        </div>
        <div className="candidate-logout-modal-footer">
          <button type="button" className="candidate-logout-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="candidate-logout-confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </section>
    </div>
  )
}
