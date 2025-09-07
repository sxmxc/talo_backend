import request from 'supertest'
import createOrganizationAndGame from '../../../utils/createOrganizationAndGame'
import initStripe from '../../../../src/lib/billing/initStripe'
import { v4 } from 'uuid'
import PricingPlanFactory from '../../../fixtures/PricingPlanFactory'
import * as sendEmail from '../../../../src/lib/messaging/sendEmail'
import PlanUpgraded from '../../../../src/emails/plan-upgraded-mail'
import { addDays } from 'date-fns'
import PlanRenewed from '../../../../src/emails/plan-renewed-mail'
import PlanCancelled from '../../../../src/emails/plan-cancelled-mail'

const stripe = initStripe()!

describe('Webhook service - subscription updated', () => {
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
      type: 'customer.subscription.updated'
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

  it('should not send a plan upgrade email if the plan has not changed', async () => {
    const product = (await stripe.products.list()).data[0]
    const plan = await new PricingPlanFactory().state(() => ({ stripeId: product.id })).one()

    const [organization] = await createOrganizationAndGame({}, {}, plan)
    const subscription = (await stripe.subscriptions.list()).data[0]

    organization.pricingPlan.stripeCustomerId = (subscription.customer as string) + organization.id
    organization.pricingPlan.stripePriceId = subscription.items.data[0].price.id
    await em.flush()

    const payload = JSON.stringify({
      id: v4(),
      object: 'event',
      data: {
        object: {
          ...subscription,
          customer: organization.pricingPlan.stripeCustomerId,
          cancel_at_period_end: false
        }
      },
      api_version: '2020-08-27',
      created: Date.now(),
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'customer.subscription.updated'
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

    expect(sendMock).not.toHaveBeenCalled()
  })

  it('should update the organization pricing plan end date if the plan was renewed', async () => {
    const product = (await stripe.products.list()).data[0]
    const plan = await new PricingPlanFactory().state(() => ({ stripeId: product.id })).one()

    const [organization] = await createOrganizationAndGame({}, {}, plan)
    const subscription = (await stripe.subscriptions.list()).data[0]

    organization.pricingPlan.stripeCustomerId = (subscription.customer as string) + organization.id
    organization.pricingPlan.stripePriceId = subscription.items.data[0].price.id
    organization.pricingPlan.endDate = addDays(new Date(), 1)
    await em.flush()

    const payload = JSON.stringify({
      id: v4(),
      object: 'event',
      data: {
        object: {
          ...subscription,
          customer: organization.pricingPlan.stripeCustomerId,
          cancel_at_period_end: false
        }
      },
      api_version: '2020-08-27',
      created: Date.now(),
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'customer.subscription.updated'
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

    await em.refresh(organization.pricingPlan)
    expect(organization.pricingPlan.endDate).toBe(null)
    expect(sendMock).toHaveBeenCalledWith(new PlanRenewed(organization).getConfig())
  })

  it('should update the organization pricing plan end date if the plan was cancelled', async () => {
    const product = (await stripe.products.list()).data[0]
    const plan = await new PricingPlanFactory().state(() => ({ stripeId: product.id })).one()

    const [organization] = await createOrganizationAndGame({}, {}, plan)
    const subscription = (await stripe.subscriptions.list()).data[0]
    subscription.cancel_at_period_end = true

    organization.pricingPlan.stripeCustomerId = (subscription.customer as string) + organization.id
    organization.pricingPlan.stripePriceId = subscription.items.data[0].price.id
    organization.pricingPlan.endDate = null
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
      type: 'customer.subscription.updated'
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

    await em.refresh(organization, { populate: ['pricingPlan'] })
    expect(organization.pricingPlan.endDate!.getMilliseconds()).toBe(new Date(subscription.items.data[0].current_period_end * 1000).getMilliseconds())
    expect(sendMock).toHaveBeenCalledWith(new PlanCancelled(organization).getConfig())
  })

  it('should not send any plan cancellation/renewal emails if the subscription is not ending', async () => {
    const product = (await stripe.products.list()).data[0]
    const plan = await new PricingPlanFactory().state(() => ({ stripeId: product.id })).one()

    const [organization] = await createOrganizationAndGame({}, {}, plan)
    const subscription = (await stripe.subscriptions.list()).data[0]

    organization.pricingPlan.stripeCustomerId = (subscription.customer as string) + organization.id
    organization.pricingPlan.stripePriceId = subscription.items.data[0].price.id
    organization.pricingPlan.endDate = null
    await em.flush()

    const payload = JSON.stringify({
      id: v4(),
      object: 'event',
      data: {
        object: {
          ...subscription,
          customer: organization.pricingPlan.stripeCustomerId,
          cancel_at_period_end: false
        }
      },
      api_version: '2020-08-27',
      created: Date.now(),
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'customer.subscription.updated'
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

    await em.refresh(organization, { populate: ['pricingPlan'] })
    expect(organization.pricingPlan.endDate).toBe(null)
    expect(sendMock).not.toHaveBeenCalled()
  })
})
