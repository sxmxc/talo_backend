import request from 'supertest'
import initStripe from '../../../src/lib/billing/initStripe'
import PricingPlanFactory from '../../fixtures/PricingPlanFactory'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'
import createUserAndToken from '../../utils/createUserAndToken'
import userPermissionProvider from '../../utils/userPermissionProvider'
import { UserType } from '../../../src/entities/user'

const stripe = initStripe()!

describe('Billing service - create portal session', () => {
  it.each(userPermissionProvider())('should return a %i for a %s user', async (statusCode, _, type) => {
    const product = (await stripe.products.list()).data[0]
    const price = (await stripe.prices.list({ product: product.id })).data[0]
    const plan = await new PricingPlanFactory().state(() => ({ stripeId: product.id })).one()

    const subscription = (await stripe.subscriptions.list()).data[0]

    const [organization] = await createOrganizationAndGame({}, {}, plan)
    const [token] = await createUserAndToken({ type }, organization)

    organization.pricingPlan.stripeCustomerId = subscription.customer as string
    organization.pricingPlan.stripePriceId = price.id
    await em.flush()

    const res = await request(app)
      .post('/billing/portal-session')
      .auth(token, { type: 'bearer' })
      .expect(statusCode)

    if (statusCode === 200) {
      expect(res.body.redirect).toBeDefined()
    } else {
      expect(res.body).toStrictEqual({ message: 'You do not have permissions to update the organization pricing plan' })
    }
  })

  it('should return a 400 if the organization doesn\'t have a stripeCustomerId', async () => {
    const product = (await stripe.products.list()).data[0]
    const price = (await stripe.prices.list({ product: product.id })).data[0]
    const plan = await new PricingPlanFactory().state(() => ({ stripeId: product.id })).one()

    const [organization] = await createOrganizationAndGame({}, {}, plan)
    const [token] = await createUserAndToken({ type: UserType.OWNER }, organization)

    organization.pricingPlan.stripeCustomerId = null
    organization.pricingPlan.stripePriceId = price.id
    await em.flush()

    await request(app)
      .post('/billing/portal-session')
      .auth(token, { type: 'bearer' })
      .expect(400)
  })
})
