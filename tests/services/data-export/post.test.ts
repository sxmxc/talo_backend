import request from 'supertest'
import { UserType } from '../../../src/entities/user'
import DataExport, { DataExportAvailableEntities } from '../../../src/entities/data-export'
import createUserAndToken from '../../utils/createUserAndToken'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'
import userPermissionProvider from '../../utils/userPermissionProvider'
import GameActivity, { GameActivityType } from '../../../src/entities/game-activity'
import { DataExporter } from '../../../src/lib/queues/data-exports/dataExportProcessor'

describe('Data export service - post', () => {
  it.each(userPermissionProvider([
    UserType.ADMIN
  ], 200))('should return a %i for a %s user', async (statusCode, _, type) => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.GAME_STATS, DataExportAvailableEntities.GAME_ACTIVITIES] })
      .auth(token, { type: 'bearer' })
      .expect(statusCode)

    const activity = await em.getRepository(GameActivity).findOne({
      type: GameActivityType.DATA_EXPORT_REQUESTED,
      game
    })

    if (statusCode === 200) {
      expect(activity!.extra.dataExportId).toBe(res.body.dataExport.id)
    } else {
      expect(activity).toBeNull()
    }
  })

  it('should not create a data export for a game the user has no access to', async () => {
    const [, otherGame] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true })

    const res = await request(app)
      .post(`/games/${otherGame.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.GAME_STATS, DataExportAvailableEntities.GAME_ACTIVITIES] })
      .auth(token, { type: 'bearer' })
      .expect(403)

    expect(res.body).toStrictEqual({ message: 'Forbidden' })
  })

  it('should create a data export for player aliases', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.PLAYER_ALIASES] })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.dataExport.entities).toStrictEqual([DataExportAvailableEntities.PLAYER_ALIASES])
  })

  it('should create a data export for players', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.PLAYERS] })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.dataExport.entities).toStrictEqual([DataExportAvailableEntities.PLAYERS])
  })

  it('should create a data export for events', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.EVENTS] })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.dataExport.entities).toStrictEqual([DataExportAvailableEntities.EVENTS])
  })

  it('should create a data export for leaderboard entries', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.LEADERBOARD_ENTRIES] })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.dataExport.entities).toStrictEqual([DataExportAvailableEntities.LEADERBOARD_ENTRIES])
  })

  it('should create a data export for game stats', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.GAME_STATS] })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.dataExport.entities).toStrictEqual([DataExportAvailableEntities.GAME_STATS])
  })

  it('should create a data export for player game stats', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.PLAYER_GAME_STATS] })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.dataExport.entities).toStrictEqual([DataExportAvailableEntities.PLAYER_GAME_STATS])
  })

  it('should create a data export for game activities', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.GAME_ACTIVITIES] })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.dataExport.entities).toStrictEqual([DataExportAvailableEntities.GAME_ACTIVITIES])
  })

  it('should create a data export for game feedback', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.GAME_FEEDBACK] })
      .auth(token, { type: 'bearer' })
      .expect(200)

    expect(res.body.dataExport.entities).toStrictEqual([DataExportAvailableEntities.GAME_FEEDBACK])
  })

  it('should not create a data export for users with unconfirmed emails', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.PLAYER_ALIASES] })
      .auth(token, { type: 'bearer' })
      .expect(403)

    expect(res.body).toStrictEqual({ message: 'You need to confirm your email address to create data exports' })
  })

  it('should not create a data export for empty entities', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [] })
      .auth(token, { type: 'bearer' })
      .expect(400)

    await request(app)
      .post(`/games/${game.id}/data-exports`)
      .auth(token, { type: 'bearer' })
      .expect(400)
  })

  it('should not create a data export with non-string entities', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [1, 2] })
      .auth(token, { type: 'bearer' })
      .expect(400)

    expect(res.body).toStrictEqual({
      errors: {
        entities: ['Entities must be an array of strings']
      }
    })
  })

  it('should handle data export errors', async () => {
    vi.spyOn(DataExporter.prototype, 'createZipStream').mockRejectedValueOnce(new Error('bad news'))

    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN, emailConfirmed: true }, organization)

    const res = await request(app)
      .post(`/games/${game.id}/data-exports`)
      .send({ entities: [DataExportAvailableEntities.GAME_FEEDBACK] })
      .auth(token, { type: 'bearer' })
      .expect(200)

    const dataExport = await em.repo(DataExport).findOneOrFail(res.body.dataExport.id)
    expect(dataExport.failedAt).toBeTruthy()
  })
})
