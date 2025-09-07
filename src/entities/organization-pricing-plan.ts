import { Entity, ManyToOne, OneToOne, PrimaryKey, Property } from '@mikro-orm/mysql'
import Stripe from 'stripe'
import Organization from './organization'
import PricingPlan from './pricing-plan'

@Entity()
export default class OrganizationPricingPlan {
  @PrimaryKey()
  id!: number

  @OneToOne(() => Organization, (organization) => organization.pricingPlan)
  organization!: Organization

  @ManyToOne(() => PricingPlan, { eager: true })
  pricingPlan: PricingPlan

  @Property({ type: 'string' })
  status: Stripe.Subscription.Status = 'active'

  @Property({ nullable: true })
  stripePriceId: string | null = null

  @Property({ nullable: true })
  stripeCustomerId: string | null = null

  @Property({ nullable: true })
  endDate: Date | null = null

  @Property()
  createdAt: Date = new Date()

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  constructor(organization: Organization, pricingPlan: PricingPlan) {
    this.organization = organization
    this.pricingPlan = pricingPlan
  }

  toJSON() {
    return {
      pricingPlan: this.pricingPlan,
      status: this.status,
      endDate: this.endDate,
      canViewBillingPortal: Boolean(this.stripeCustomerId)
    }
  }
}
