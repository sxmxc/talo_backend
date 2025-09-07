import { Factory } from 'hefty'
import Organization from '../../src/entities/organization'
import PricingPlanFactory from './PricingPlanFactory'
import OrganizationPricingPlanFactory from './OrganizationPricingPlanFactory'
import { randCompanyName, randEmail } from '@ngneat/falso'

export default class OrganizationFactory extends Factory<Organization> {
  constructor() {
    super(Organization)
  }

  protected definition(): void {
    this.state(async (organization) => {
      const plan = await new PricingPlanFactory().one()
      const orgPlan = await new OrganizationPricingPlanFactory().state(() => ({
        organization,
        pricingPlan: plan
      })).one()

      return {
        email: randEmail(),
        name: randCompanyName(),
        pricingPlan: orgPlan
      }
    })
  }

  demo(): this {
    return this.state(() => ({
      name: process.env.DEMO_ORGANIZATION_NAME
    }))
  }
}
