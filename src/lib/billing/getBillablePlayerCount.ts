import { EntityManager } from '@mikro-orm/mysql'
import Organization from '../../entities/organization'
import Player from '../../entities/player'
import { getResultCacheOptions } from '../perf/getResultCacheOptions'

export default async function getBillablePlayerCount(em: EntityManager, organization: Organization): Promise<number> {
  return em.getRepository(Player).count({
    game: { organization }
  }, getResultCacheOptions(`billable-player-count-${organization.id}`))
}
