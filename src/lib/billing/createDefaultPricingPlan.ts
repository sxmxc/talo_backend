import { EntityManager } from '@mikro-orm/mysql'
import Organization from '../../entities/organization'
import OrganizationPricingPlan from '../../entities/organization-pricing-plan'
import PricingPlan from '../../entities/pricing-plan'
import initStripe from './initStripe'

export default async function createDefaultPricingPlan(em: EntityManager, organization: Organization): Promise<OrganizationPricingPlan> {
  const stripe = initStripe()

  let defaultPlan = await em.getRepository(PricingPlan).findOne({ default: true })

  let price: string
  if (process.env.STRIPE_KEY && defaultPlan) {
    const prices = await stripe!.prices.list({ product: defaultPlan.stripeId, active: true })
    price = prices.data[0].id
  } else {
    // self-hosted logic
    defaultPlan = new PricingPlan()
    defaultPlan.stripeId = ''
    defaultPlan.default = true
  }

  if (!organization.pricingPlan) {
    const organizationPricingPlan = new OrganizationPricingPlan(organization, defaultPlan)
    organizationPricingPlan.stripePriceId = price!
    return organizationPricingPlan
  } else {
    organization.pricingPlan.pricingPlan = defaultPlan
    organization.pricingPlan.status = 'active'
    organization.pricingPlan.stripePriceId = price!
    organization.pricingPlan.endDate = null
    return organization.pricingPlan
  }
}
