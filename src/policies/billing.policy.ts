import Policy from './policy'
import { PolicyResponse } from 'koa-clay'
import UserTypeGate from './user-type-gate'

export default class OrganizationPolicy extends Policy {
  @UserTypeGate([], 'update the organization pricing plan')
  async createCheckoutSession(): Promise<PolicyResponse> {
    return true
  }

  @UserTypeGate([], 'update the organization pricing plan')
  async confirmPlan(): Promise<PolicyResponse> {
    return true
  }

  @UserTypeGate([], 'update the organization pricing plan')
  async createPortalSession(): Promise<PolicyResponse> {
    return true
  }

  @UserTypeGate([], 'view the organization pricing plan usage')
  async usage(): Promise<PolicyResponse> {
    return true
  }

  @UserTypeGate([], 'view the organization pricing plan')
  async organizationPlan(): Promise<PolicyResponse> {
    return true
  }
}
