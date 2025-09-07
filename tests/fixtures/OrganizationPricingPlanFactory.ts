import { Factory } from 'hefty'
import OrganizationPricingPlan from '../../src/entities/organization-pricing-plan'
import { randUuid } from '@ngneat/falso'

export default class OrganizationPricingPlanFactory extends Factory<OrganizationPricingPlan> {
  constructor() {
    super(OrganizationPricingPlan)
  }

  protected definition(): void {
    this.state(() => ({
      stripePriceId: `price_${randUuid().split('-')[0]}`,
      stripeCustomerId: `cus_${randUuid().split('-')[0]}`,
      status: 'active'
    }))
  }
}
