import request from 'supertest'
import createOrganizationAndGame from '../../../utils/createOrganizationAndGame'
import initStripe from '../../../../src/lib/billing/initStripe'
import { v4 } from 'uuid'
import PricingPlanFactory from '../../../fixtures/PricingPlanFactory'
import * as sendEmail from '../../../../src/lib/messaging/sendEmail'
import PlanUpgraded from '../../../../src/emails/plan-upgraded-mail'

const stripe = initStripe()!

describe('Webhook service - subscription created', () => {
  const sendMock = vi.spyOn(sendEmail, 'default')

  afterEach(() => {
    sendMock.mockClear()
  })

  it('should update the organization pricing plan with the updated subscription\'s details', async () => {
    const product = (await stripe.products.list()).data[0]
    const plan = await new PricingPlanFactory().state(() => ({ stripeId: product.id })).one()

    const [organization] = await createOrganizationAndGame({}, {}, plan)
    const subscription = (await stripe.subscriptions.list()).data[0]

    organization.pricingPlan.stripeCustomerId = (subscription.customer as string) + organization.id
    await em.flush()

    const payload = JSON.stringify({
      id: v4(),
      object: 'event',
      data: {
        object: {
          ...subscription,
          customer: organization.pricingPlan.stripeCustomerId
        }
      },
      api_version: '2020-08-27',
      created: Date.now(),
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'customer.subscription.created'
    }, null, 2)

    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!
    })

    await request(app)
      .post('/public/webhooks/subscriptions')
      .set('stripe-signature', header)
      .send(payload)
      .expect(204)

    await em.refresh(organization)
    const price = subscription.items.data[0].price
    expect(organization.pricingPlan.stripePriceId).toBe(price.id)
    expect(sendMock).toHaveBeenCalledWith(new PlanUpgraded(organization, price, product).getConfig())
  })
})
