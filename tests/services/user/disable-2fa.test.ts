import request from 'supertest'
import UserTwoFactorAuth from '../../../src/entities/user-two-factor-auth'
import UserRecoveryCode from '../../../src/entities/user-recovery-code'
import createUserAndToken from '../../utils/createUserAndToken'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'

describe('User service - disable 2fa', () => {
  it('should let users disable 2fa', async () => {
    const twoFactorAuth = new UserTwoFactorAuth('blah')
    twoFactorAuth.enabled = true

    const [organization] = await createOrganizationAndGame()
    const [token, user] = await createUserAndToken({ twoFactorAuth }, organization)

    const res = await request(app)
      .post('/users/2fa/disable')
      .send({ password: 'password' })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.user.has2fa).toBe(false)
    expect(res.body.user.organization).toBeTruthy()
    expect(res.body.user.organization.games).toHaveLength(1)

    const recoveryCodes = await em.getRepository(UserRecoveryCode).find({ user })
    expect(recoveryCodes).toHaveLength(0)

    const user2fa = await em.getRepository(UserTwoFactorAuth).findOne({ user })
    expect(user2fa).toBeNull()
  })

  it('should not try to disable 2fa if it isn\'t enabled', async () => {
    const [token] = await createUserAndToken()

    const res = await request(app)
      .post('/users/2fa/disable')
      .send({ password: 'password' })
      .auth(token, { type: 'bearer' })
      .expect(403)

    expect(res.body).toStrictEqual({ message: 'Two factor authentication needs to be enabled' })
  })

  it('should not try to disable 2fa if the password is incorrect', async () => {
    const twoFactorAuth = new UserTwoFactorAuth('blah')
    twoFactorAuth.enabled = true
    const [token] = await createUserAndToken({ twoFactorAuth })

    const res = await request(app)
      .post('/users/2fa/disable')
      .send({ password: 'p@ssw0rd' })
      .auth(token, { type: 'bearer' })
      .expect(403)

    expect(res.body).toStrictEqual({ message: 'Incorrect password' })
  })
})
