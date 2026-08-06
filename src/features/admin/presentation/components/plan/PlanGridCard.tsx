import type { SubscriptionPlan } from '@/features/admin/domain/adminApi.types'
import { isEnterprisePlan, formatPlanPriceDisplay } from '@/features/admin/domain/subscriptionPlanRules'

export type PlanGridCardProps = {
  plan: SubscriptionPlan
  onEdit: (plan: SubscriptionPlan) => void
  onToggleActive: (plan: SubscriptionPlan) => void
}

export function PlanGridCard({ plan, onEdit, onToggleActive }: PlanGridCardProps) {
  const isEnterprise = isEnterprisePlan(plan)

  return (
    <div className={`plan-card ${isEnterprise ? 'enterprise-card' : ''}`}>
      <div className="plan-card-header">
        <div>
          <h3>{plan.name}</h3>
          <span className={`status-pill ${plan.active ? 'active' : 'inactive'}`}>
            {plan.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {plan.recommended && <span className="recommended-badge">Recommended</span>}
      </div>

      <div className="plan-card-price">
        <strong className="monthly-price">{formatPlanPriceDisplay(plan.monthlyPrice)}</strong>
        <small>/ month</small>
        {plan.yearlyPrice > 0 && (
          <p className="yearly-price">{formatPlanPriceDisplay(plan.yearlyPrice)} / year</p>
        )}
      </div>

      <div className="plan-card-features">
        <p><strong>Max Staff:</strong> {plan.staffAccountUnlimited ? 'Unlimited' : plan.maxStaffAccount}</p>
        <p><strong>Features:</strong> {plan.features?.length || 0} enabled</p>
      </div>

      <div className="plan-card-actions">
        <button type="button" className="btn-secondary" onClick={() => onEdit(plan)}>
          Edit Plan
        </button>
        <button type="button" className="btn-tertiary" onClick={() => onToggleActive(plan)}>
          {plan.active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  )
}
