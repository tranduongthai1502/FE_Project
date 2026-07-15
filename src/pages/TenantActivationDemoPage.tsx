import { useState } from 'react'

type TenantActivationDemoPageProps = {
  onGoToLogin: () => void
}

export function TenantActivationDemoPage({ onGoToLogin }: TenantActivationDemoPageProps) {
  const [isActivated, setIsActivated] = useState(false)

  return (
    <main className="tenant-activation-page">
      <section className="tenant-activation-shell" aria-labelledby="tenant-activation-title">
        <div className="tenant-activation-badge">
          <i className={isActivated ? 'fa-solid fa-check' : 'fa-regular fa-envelope'}></i>
        </div>

        <div className="tenant-activation-copy">
          <span>Tenant invitation</span>
          <h2 id="tenant-activation-title">
            {isActivated ? 'Your account is active' : 'Activate your tenant account'}
          </h2>
          <p>
            {isActivated
              ? 'Your JobFusion workspace is ready. You can now sign in and start configuring your hiring team.'
              : 'Confirm this invitation to activate your tenant admin account and access the JobFusion workspace.'}
          </p>
        </div>

        <div className="tenant-activation-summary">
          <div>
            <small>Workspace</small>
            <strong>TTB Media</strong>
          </div>
          <div>
            <small>Role</small>
            <strong>Tenant Admin</strong>
          </div>
          <div>
            <small>Email</small>
            <strong>admin@ttbmedia.com</strong>
          </div>
        </div>

        {isActivated ? (
          <button type="button" className="tenant-activation-secondary" onClick={onGoToLogin}>
            Go to Sign In
          </button>
        ) : (
          <button type="button" className="tenant-activation-button" onClick={() => setIsActivated(true)}>
            Active Account
          </button>
        )}
      </section>
    </main>
  )
}
