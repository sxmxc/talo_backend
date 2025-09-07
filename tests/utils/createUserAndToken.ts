import Organization from '../../src/entities/organization'
import User from '../../src/entities/user'
import { genAccessToken } from '../../src/lib/auth/buildTokenPair'
import UserFactory from '../fixtures/UserFactory'

export default async function createUserAndToken(partial?: Partial<User>, organization?: Organization): Promise<[string, User]> {
  const user = await new UserFactory().loginable().state(() => partial ?? {}).one()
  if (organization) user.organization = organization
  await em.persistAndFlush(user)

  const token = await genAccessToken(user)
  return [token, user]
}
