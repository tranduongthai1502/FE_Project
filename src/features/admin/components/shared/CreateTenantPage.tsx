import type { FormEvent } from 'react'
import type { CreateTenantForm, SubscriptionPlan } from '../../types/admin.types'

const industryOptions = [
  'Technology',
  'Media',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Logistics',
  'Hospitality',
  'Real Estate',
  'Other',
]

const regionOptions = [
  'America',
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Southeast Asia',
  'Oceania',
  'Middle East',
  'Africa',
  'VietNam',
  'Other',
]

export function CreateTenantPage({
  form,
  plans,
  isLoadingPlans,
  isSubmitting,
  onChange,
  onClose,
  onBackToList,
  onSubmit,
}: {
  form: CreateTenantForm
  error: string
  plans: SubscriptionPlan[]
  isLoadingPlans: boolean
  isSubmitting: boolean
  onChange: (field: keyof CreateTenantForm, value: string) => void
  onClose: () => void
  onBackToList: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="role-content create-tenant-content">
      <div className="tenant-breadcrumb create-tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <span className="breadcrumb-separator">/</span>
        <button type="button" onClick={onBackToList}>Tenant Management</button>
        <span className="breadcrumb-separator">/</span>
        <strong>Create New Tenant</strong>
      </div>

      <section className="tenant-modal create-tenant-card" aria-labelledby="create-tenant-title">
        <header className="tenant-modal-header">
          <div>
            <h2 id="create-tenant-title">Create New Tenant</h2>
            <p>Configure a new instance for your recruitment partner.</p>
          </div>
        </header>

        <form className="tenant-create-form" onSubmit={onSubmit}>
          <div className="tenant-form-grid">
            <label>
              <span>Company Name <b>*</b></span>
              <input
                value={form.companyName}
                onChange={(event) => onChange('companyName', event.target.value)}
                placeholder="e.g. Acme Corp"
                required
              />
            </label>

            <label>
              <span>Subscription Plan <b>*</b></span>
              <select
                value={form.planId}
                onChange={(event) => onChange('planId', event.target.value)}
                disabled={isLoadingPlans || isSubmitting}
                required
              >
                <option value="">{isLoadingPlans ? 'Loading plans...' : 'Select a plan'}</option>
                {plans.map((plan) => (
                  <option value={plan.id} key={plan.id}>
                    {plan.priceLabel ? `${plan.name} - ${plan.priceLabel}` : plan.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="tenant-domain-field">
              <span>Domain / Identifier <b>*</b></span>
              <div>
                <input
                  value={form.domain}
                  onChange={(event) => onChange('domain', event.target.value)}
                  placeholder="acme"
                  required
                />
                <small>.jobfusion.ai</small>
              </div>
            </label>

            <label>
              <span>Industry <b>*</b></span>
              <select
                value={form.industry}
                onChange={(event) => onChange('industry', event.target.value)}
                required
              >
                <option value="">Select industry</option>
                {industryOptions.map((industry) => (
                  <option value={industry} key={industry}>{industry}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Region <b>*</b></span>
              <select
                value={form.region}
                onChange={(event) => onChange('region', event.target.value)}
                required
              >
                <option value="">Select region</option>
                {regionOptions.map((region) => (
                  <option value={region} key={region}>{region}</option>
                ))}
              </select>
            </label>
          </div>

          <hr />
          <h3>Tenant Administrator</h3>

          <div className="tenant-form-grid admin">
            <label>
              <span>Admin Full Name <b>*</b></span>
              <input
                value={form.adminFullName}
                onChange={(event) => onChange('adminFullName', event.target.value)}
                placeholder="Jane Doe"
                required
              />
            </label>

            <label>
              <span>Admin Email <b>*</b></span>
              <input
                value={form.adminEmail}
                onChange={(event) => onChange('adminEmail', event.target.value)}
                placeholder="jane@company.com"
                type="email"
                required
              />
            </label>
          </div>

          <footer className="tenant-modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Confirm'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
