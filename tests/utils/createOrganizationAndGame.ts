import Game from '../../src/entities/game'
import Organization from '../../src/entities/organization'
import PricingPlan from '../../src/entities/pricing-plan'
import GameFactory from '../fixtures/GameFactory'
import OrganizationFactory from '../fixtures/OrganizationFactory'
import OrganizationPricingPlanFactory from '../fixtures/OrganizationPricingPlanFactory'

export default async function createOrganizationAndGame(orgPartial?: Partial<Organization>, gamePartial?: Partial<Game>, plan?: PricingPlan): Promise<[Organization, Game]> {
  const organization = await new OrganizationFactory().state(() => orgPartial ?? {}).one()
  if (plan) {
    const orgPlan = await new OrganizationPricingPlanFactory().state(() => ({
      organization,
      pricingPlan: plan
    })).one()
    organization.pricingPlan = orgPlan
  }

  const game = await new GameFactory(organization).state(() => gamePartial ?? {}).one()
  await em.persistAndFlush([organization, game])

  return [organization, game]
}
