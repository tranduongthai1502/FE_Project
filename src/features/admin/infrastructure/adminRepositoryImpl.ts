import type { AdminRepository } from '../application/ports/adminRepository'
import type {
  CreatePlanPayload,
  CreateTenantPayload,
  Prompt,
  SubscriptionPlan,
  Tenant,
  UpdatePlanPayload,
  UpdateTenantPayload,
} from '../domain/adminApi.types'
import { adminApi } from './adminApi'

export class AdminRepositoryImpl implements AdminRepository {
  async getTenants(): Promise<Tenant[]> {
    return adminApi.getTenants()
  }

  async getTenantById(id: string): Promise<Tenant> {
    return adminApi.getTenantById(id)
  }

  async createTenant(payload: CreateTenantPayload): Promise<Tenant> {
    return adminApi.createTenant(payload)
  }

  async updateTenant(id: string, payload: UpdateTenantPayload): Promise<Tenant> {
    return adminApi.updateTenant(id, payload)
  }

  async deleteTenant(id: string): Promise<void> {
    return adminApi.deleteTenant(id)
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return adminApi.getSubscriptionPlans()
  }

  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan> {
    return adminApi.getSubscriptionPlanById(id)
  }

  async createSubscriptionPlan(payload: CreatePlanPayload): Promise<SubscriptionPlan> {
    return adminApi.createSubscriptionPlan(payload)
  }

  async updateSubscriptionPlan(id: string, payload: UpdatePlanPayload): Promise<SubscriptionPlan> {
    return adminApi.updateSubscriptionPlan(id, payload)
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    return adminApi.deleteSubscriptionPlan(id)
  }

  async getPrompts(): Promise<Prompt[]> {
    return adminApi.getPrompts()
  }

  async updatePrompt(id: string, content: string): Promise<Prompt> {
    return adminApi.updatePrompt(id, content)
  }
}

export const adminRepository = new AdminRepositoryImpl()
