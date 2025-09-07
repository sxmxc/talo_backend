import request from 'supertest'
import { UserType } from '../../../src/entities/user'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'
import createUserAndToken from '../../utils/createUserAndToken'

describe('Data export service - available entities', () => {
  it('should return a list of available data export entities', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN }, organization)

    const res = await request(app)
      .get(`/games/${game.id}/data-exports/entities`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.entities).toStrictEqual([ 'events', 'players', 'playerAliases', 'leaderboardEntries', 'gameStats', 'playerGameStats', 'gameActivities', 'gameFeedback' ])
  })
})
