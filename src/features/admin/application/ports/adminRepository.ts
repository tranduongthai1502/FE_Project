import type {
  CreatePlanPayload,
  CreateTenantPayload,
  Prompt,
  SubscriptionPlan,
  Tenant,
  UpdatePlanPayload,
  UpdateTenantPayload,
} from '../../domain/adminApi.types'

export interface AdminRepository {
  getTenants(): Promise<Tenant[]>
  getTenantById(id: string): Promise<Tenant>
  createTenant(payload: CreateTenantPayload): Promise<Tenant>
  updateTenant(id: string, payload: UpdateTenantPayload): Promise<Tenant>
  deleteTenant(id: string): Promise<void>

  getSubscriptionPlans(): Promise<SubscriptionPlan[]>
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan>
  createSubscriptionPlan(payload: CreatePlanPayload): Promise<SubscriptionPlan>
  updateSubscriptionPlan(id: string, payload: UpdatePlanPayload): Promise<SubscriptionPlan>
  deleteSubscriptionPlan(id: string): Promise<void>

  getPrompts(): Promise<Prompt[]>
  updatePrompt(id: string, content: string): Promise<Prompt>
}
