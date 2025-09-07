import { EntityManager } from '@mikro-orm/mysql'
import { Request } from 'koa-clay'
import Organization from '../../entities/organization'
import PlanUsageWarning from '../../emails/plan-usage-warning-mail'
import queueEmail from '../messaging/queueEmail'
import getBillablePlayerCount from './getBillablePlayerCount'

const OVERAGE_PERCENTAGE = 1.05

export default async function checkPricingPlanPlayerLimit(
  req: Request,
  organization: Organization
): Promise<void> {
  const em: EntityManager = req.ctx.em
  const organizationPricingPlan = organization.pricingPlan

  if (organizationPricingPlan.status !== 'active') {
    req.ctx.throw(402, 'Your subscription is in an incomplete state. Please update your billing details.')
  }

  const planPlayerLimit = organizationPricingPlan.pricingPlan.playerLimit ?? Infinity
  const playerCount = await getBillablePlayerCount(em, organization) + 1

  if (playerCount > (planPlayerLimit * OVERAGE_PERCENTAGE)) {
    req.ctx.throw(402, { limit: planPlayerLimit })
  } else {
    const usagePercentage = playerCount / planPlayerLimit * 100
    if (usagePercentage == 75 || usagePercentage == 90 || usagePercentage == 100) {
      await queueEmail(req.ctx.emailQueue, new PlanUsageWarning(organization, playerCount, planPlayerLimit))
    }
  }
}
