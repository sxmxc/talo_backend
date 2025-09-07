import { EntityManager } from '@mikro-orm/mysql'
import { HasPermission, Service, Request, Response, Route } from 'koa-clay'
import Game from '../entities/game'
import Invite from '../entities/invite'
import Organization from '../entities/organization'
import User from '../entities/user'
import OrganizationPolicy from '../policies/organization.policy'

export default class OrganizationService extends Service {
  @Route({
    method: 'GET',
    path: '/current'
  })
  @HasPermission(OrganizationPolicy, 'current')
  async current(req: Request): Promise<Response> {
    const em: EntityManager = req.ctx.em

    const organization: Organization = req.ctx.state.user.organization

    const games = await em.getRepository(Game).find({
      organization
    }, {
      populate: ['players']
    })

    const members = await em.getRepository(User).find({ organization })

    const pendingInvites = await em.getRepository(Invite).find({ organization })

    return {
      status: 200,
      body: {
        games,
        members,
        pendingInvites
      }
    }
  }
}
