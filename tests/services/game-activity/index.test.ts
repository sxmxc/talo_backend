import request from 'supertest'
import { UserType } from '../../../src/entities/user'
import UserFactory from '../../fixtures/UserFactory'
import GameActivityFactory from '../../fixtures/GameActivityFactory'
import createUserAndToken from '../../utils/createUserAndToken'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'
import userPermissionProvider from '../../utils/userPermissionProvider'

describe('Game activity service - index', () => {
  it.each(userPermissionProvider([
    UserType.ADMIN,
    UserType.DEMO
  ]))('should return a %i for a %s user', async (statusCode, _, type) => {
    const [organization, game] = await createOrganizationAndGame()
    const [token, user] = await createUserAndToken({ type }, organization)

    const activities = await new GameActivityFactory([game], [user]).many(5)
    await em.persistAndFlush([user, game, ...activities])

    const res = await request(app)
      .get(`/games/${game.id}/game-activities`)
      .auth(token, { type: 'bearer' })
      .expect(statusCode)

    if (statusCode === 200) {
      expect(res.body.activities).toHaveLength(activities.length)
    } else {
      expect(res.body).toStrictEqual({ message: 'You do not have permissions to view game activities' })
    }
  })

  it('should return game activities with no games but from the same organization', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [otherOrg] = await createOrganizationAndGame()

    const [token, user] = await createUserAndToken({ type: UserType.ADMIN }, organization)
    const otherUser = await new UserFactory().state(() => ({ organization: otherOrg })).one()

    const activities = await new GameActivityFactory([], [user]).many(5)
    const otherActivities = await new GameActivityFactory([], [otherUser]).many(5)

    await em.persistAndFlush([...activities, ...otherActivities])

    const res = await request(app)
      .get(`/games/${game.id}/game-activities`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.activities).toHaveLength(activities.length)
  })

  it('should not return a list of game activities for a game the user has no access to', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN })

    const user = await new UserFactory().state(() => ({ organization })).one()
    const activities = await new GameActivityFactory([game], [user]).many(10)
    await em.persistAndFlush(activities)

    const res = await request(app)
      .get(`/games/${game.id}/game-activities`)
      .auth(token, { type: 'bearer' })
      .expect(403)

    expect(res.body).toStrictEqual({ message: 'Forbidden' })
  })
})
