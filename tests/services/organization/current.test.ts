import request from 'supertest'
import { UserType } from '../../../src/entities/user'
import UserFactory from '../../fixtures/UserFactory'
import InviteFactory from '../../fixtures/InviteFactory'
import userPermissionProvider from '../../utils/userPermissionProvider'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'
import createUserAndToken from '../../utils/createUserAndToken'

describe('Organization service - current', () => {
  it.each(userPermissionProvider([
    UserType.ADMIN
  ]))('should return a %i for a %s user', async (statusCode, _, type) => {
    const [organization] = await createOrganizationAndGame()
    const [token, user] = await createUserAndToken({ type }, organization)

    const otherUser = await new UserFactory().state(() => ({ organization })).one()
    const invites = await new InviteFactory().construct(organization).state(() => ({ invitedByUser: user })).many(3)
    await em.persistAndFlush([otherUser, ...invites])

    const res = await request(app)
      .get('/organizations/current')
      .auth(token, { type: 'bearer' })
      .expect(statusCode)

    if (statusCode === 200) {
      expect(res.body.games).toHaveLength(1)
      expect(res.body.members).toHaveLength(2)
      expect(res.body.pendingInvites).toHaveLength(invites.length)
    } else {
      expect(res.body).toStrictEqual({ message: 'You do not have permissions to view organization info' })
    }
  })
})
