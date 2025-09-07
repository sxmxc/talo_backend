import request from 'supertest'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'
import createUserAndToken from '../../utils/createUserAndToken'

describe('User service - get me', () => {
  it('should return the user\'s data', async () => {
    const [organization] = await createOrganizationAndGame({}, { name: 'Vigilante 2084' })
    const [token] = await createUserAndToken({}, organization)

    const res = await request(app)
      .get('/users/me')
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.user).toBeTruthy()
    expect(res.body.user.organization).toBeTruthy()
    expect(res.body.user.organization.games).toHaveLength(1)
    expect(res.body.user.organization.games[0].name).toBe('Vigilante 2084')
  })
})
