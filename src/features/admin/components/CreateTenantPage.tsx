import type { FormEvent } from 'react'
import type { CreateTenantForm, SubscriptionPlan } from '@/services/api/api.types'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ScrollableSelect } from '@/components/common/ScrollableSelect'
import { formatCurrencyInput } from '@/utils/currencyFormat'
import { FIELD_LENGTH_LIMITS, validationErrorMessages } from '@/services/api/axiosErrorHandler'

export type CreateTenantFieldErrors = Partial<Record<keyof CreateTenantForm, string>>

const requiredFieldMessage = validationErrorMessages.requiredField
const planNamePreviewLength = 20

function FieldError({ message }: { message?: string }) {
  return (
    <small className="tenant-field-error" aria-hidden={!message}>
      {message || requiredFieldMessage}
    </small>
  )
}

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

function formatPlanOptionLabel(plan: SubscriptionPlan) {
  const trimmedName = plan.name.trim()
  const displayName = trimmedName.length > planNamePreviewLength
    ? `${trimmedName.slice(0, planNamePreviewLength)}...`
    : trimmedName
  const priceLabel = plan.priceLabel || `$${formatCurrencyInput(plan.monthlyPrice.toFixed(2))} / month`

  return `${displayName} - ${priceLabel}`
}

export function CreateTenantPage({
  error,
  form,
  plans,
  fieldErrors = {},
  isLoadingPlans,
  isSubmitting,
  onChange,
  onClose,
  onGoHome,
  onBackToList,
  onSubmit,
}: {
  form: CreateTenantForm
  error: string
  fieldErrors?: CreateTenantFieldErrors
  plans: SubscriptionPlan[]
  isLoadingPlans: boolean
  isSubmitting: boolean
  onChange: (field: keyof CreateTenantForm, value: string) => void
  onClose: () => void
  onGoHome: () => void
  onBackToList: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="role-content create-tenant-content">
      <Breadcrumb
        className="create-tenant-page-breadcrumb"
        items={[
          { label: 'Home', onClick: onGoHome },
          { label: 'Tenant Management', onClick: onBackToList },
          { label: 'Create New Tenant' },
        ]}
      />

      <section className="tenant-modal create-tenant-card" aria-labelledby="create-tenant-title">
        <header className="tenant-modal-header">
          <div>
            <h2 id="create-tenant-title">Create New Tenant</h2>
            <p>Configure a new instance for your recruitment partner.</p>
          </div>
        </header>

        <form className="tenant-create-form" onSubmit={onSubmit} noValidate>
          {error && <p className="tenant-modal-error">{error}</p>}

          <div className="tenant-form-grid">
            <label>
              <span>Company Name <b>*</b></span>
              <input
                aria-invalid={Boolean(fieldErrors.companyName)}
                value={form.companyName}
                onChange={(event) => onChange('companyName', event.target.value)}
                placeholder="e.g. Acme Corp"
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                required
              />
              <FieldError message={fieldErrors.companyName} />
            </label>

            <label>
              <span>Subscription Plan <b>*</b></span>
              <ScrollableSelect
                ariaLabel="Select subscription plan"
                invalid={Boolean(fieldErrors.planId)}
                value={form.planId}
                disabled={isLoadingPlans || isSubmitting}
                placeholder={isLoadingPlans ? 'Loading plans...' : 'Select a plan'}
                options={[
                  { value: '', label: isLoadingPlans ? 'Loading plans...' : 'Select a plan', disabled: true },
                  ...plans.map((plan) => ({
                    value: plan.id,
                    label: formatPlanOptionLabel(plan),
                  })),
                ]}
                onChange={(nextValue) => onChange('planId', nextValue)}
              />
              <FieldError message={fieldErrors.planId} />
            </label>

            <label className="tenant-domain-field">
              <span>Domain / Identifier <b>*</b></span>
              <div className={fieldErrors.domain ? 'has-error' : ''}>
                <input
                  maxLength={FIELD_LENGTH_LIMITS.defaultText}
                  aria-invalid={Boolean(fieldErrors.domain)}
                  value={form.domain}
                  onChange={(event) => onChange('domain', event.target.value)}
                  placeholder="acme"
                  required
                />
                <small>.jobfusion.ai</small>
              </div>
              <FieldError message={fieldErrors.domain} />
            </label>

            <label>
              <span>Industry <b>*</b></span>
              <ScrollableSelect
                ariaLabel="Select industry"
                invalid={Boolean(fieldErrors.industry)}
                value={form.industry}
                placeholder="Select industry"
                options={[
                  { value: '', label: 'Select industry', disabled: true },
                  ...industryOptions.map((industry) => ({ value: industry, label: industry })),
                ]}
                onChange={(nextValue) => onChange('industry', nextValue)}
              />
              <FieldError message={fieldErrors.industry} />
            </label>

            <label>
              <span>Region <b>*</b></span>
              <ScrollableSelect
                ariaLabel="Select region"
                invalid={Boolean(fieldErrors.region)}
                value={form.region}
                placeholder="Select region"
                options={[
                  { value: '', label: 'Select region', disabled: true },
                  ...regionOptions.map((region) => ({ value: region, label: region })),
                ]}
                onChange={(nextValue) => onChange('region', nextValue)}
              />
              <FieldError message={fieldErrors.region} />
            </label>
          </div>

          <hr />
          <h3>Tenant Administrator</h3>

          <div className="tenant-form-grid admin">
            <label>
              <span>Admin Full Name <b>*</b></span>
              <input
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                aria-invalid={Boolean(fieldErrors.adminFullName)}
                value={form.adminFullName}
                onChange={(event) => onChange('adminFullName', event.target.value)}
                placeholder="Jane Doe"
                required
              />
              <FieldError message={fieldErrors.adminFullName} />
            </label>

            <label>
              <span>Admin Email <b>*</b></span>
              <input
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                aria-invalid={Boolean(fieldErrors.adminEmail)}
                value={form.adminEmail}
                onChange={(event) => onChange('adminEmail', event.target.value)}
                placeholder="jane@company.com"
                type="email"
                required
              />
              <FieldError message={fieldErrors.adminEmail} />
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
