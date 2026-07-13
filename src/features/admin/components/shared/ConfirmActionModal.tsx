export function ConfirmActionModal({
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="tenant-confirm-backdrop" role="presentation">
      <section className="tenant-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="tenant-confirm-title">
        <header>
          <h2 id="tenant-confirm-title">Confirm Action</h2>
          <button type="button" onClick={onCancel} aria-label="Close confirm dialog" disabled={isSubmitting}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>
        <p>Are you sure you want to proceed? This action will trigger the next step in the recruitment workflow. Your changes will not be saved.</p>
        <footer>
          <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isSubmitting}>{isSubmitting ? 'Confirming...' : 'Confirm'}</button>
        </footer>
      </section>
    </div>
  )
}
