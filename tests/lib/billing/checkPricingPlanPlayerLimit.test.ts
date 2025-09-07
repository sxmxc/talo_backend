import PlayerFactory from '../../fixtures/PlayerFactory'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'
import PlanUsageWarning from '../../../src/emails/plan-usage-warning-mail'
import request from 'supertest'
import createUserAndToken from '../../utils/createUserAndToken'
import * as sendEmail from '../../../src/lib/messaging/sendEmail'

describe('checkPricingPlanPlayerLimit', () => {
  const sendMock = vi.spyOn(sendEmail, 'default')

  afterEach(() => {
    sendMock.mockClear()
  })

  it('should allow creation when under the limit', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({}, organization)
    organization.pricingPlan.pricingPlan.playerLimit = 100
    organization.pricingPlan.status = 'active'

    const players = await new PlayerFactory([game]).many(10)
    await em.persistAndFlush(players)

    const res = await request(app)
      .post(`/games/${game.id}/players`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.player).toBeTruthy()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('should throw a 402 when subscription status is not active', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({}, organization)
    organization.pricingPlan.status = 'incomplete'
    await em.flush()

    const res = await request(app)
      .post(`/games/${game.id}/players`)
      .auth(token, { type: 'bearer' })
      .expect(402)

    expect(res.body).toStrictEqual({
      message: 'Your subscription is in an incomplete state. Please update your billing details.'
    })
  })

  it('should send an email at 75% usage', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({}, organization)
    organization.pricingPlan.pricingPlan.playerLimit = 100
    organization.pricingPlan.status = 'active'

    const players = await new PlayerFactory([game]).many(74)
    await em.persistAndFlush(players)

    const res = await request(app)
      .post(`/games/${game.id}/players`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.player).toBeTruthy()
    expect(sendMock).toHaveBeenCalledWith(new PlanUsageWarning(organization, 75, 100).getConfig())
  })

  it('should send an email at 90% usage', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({}, organization)
    organization.pricingPlan.pricingPlan.playerLimit = 100
    organization.pricingPlan.status = 'active'

    const players = await new PlayerFactory([game]).many(89)
    await em.persistAndFlush(players)

    const res = await request(app)
      .post(`/games/${game.id}/players`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.player).toBeTruthy()
    expect(sendMock).toHaveBeenCalledWith(new PlanUsageWarning(organization, 90, 100).getConfig())
  })

  it('should send an email at 100% usage', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({}, organization)
    organization.pricingPlan.pricingPlan.playerLimit = 100
    organization.pricingPlan.status = 'active'

    const players = await new PlayerFactory([game]).many(99)
    await em.persistAndFlush(players)

    const res = await request(app)
      .post(`/games/${game.id}/players`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.player).toBeTruthy()
    expect(sendMock).toHaveBeenCalledWith(new PlanUsageWarning(organization, 100, 100).getConfig())
  })

  it('should not send an email below 75% usage', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({}, organization)
    organization.pricingPlan.pricingPlan.playerLimit = 100
    organization.pricingPlan.status = 'active'

    const randomPlayerCount = Math.floor(Math.random() * 74) + 1
    const players = await new PlayerFactory([game]).many(randomPlayerCount - 1)
    await em.persistAndFlush(players)

    const res = await request(app)
      .post(`/games/${game.id}/players`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.player).toBeTruthy()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('should allow player creation when playerLimit is null', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({}, organization)
    organization.pricingPlan.pricingPlan.playerLimit = null
    organization.pricingPlan.status = 'active'

    const players = await new PlayerFactory([game]).many(100)
    await em.persistAndFlush(players)

    const res = await request(app)
      .post(`/games/${game.id}/players`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.player).toBeTruthy()
    expect(sendMock).not.toHaveBeenCalled()
  })
})
