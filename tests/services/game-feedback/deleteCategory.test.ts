import request from 'supertest'
import { UserType } from '../../../src/entities/user'
import GameActivity, { GameActivityType } from '../../../src/entities/game-activity'
import userPermissionProvider from '../../utils/userPermissionProvider'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'
import createUserAndToken from '../../utils/createUserAndToken'
import GameFeedbackCategoryFactory from '../../fixtures/GameFeedbackCategoryFactory'

describe('Game feedback service - delete category', () => {
  it.each(userPermissionProvider([
    UserType.ADMIN
  ], 204))('should return a %i for a %s user', async (statusCode, _, type) => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type, emailConfirmed: true }, organization)

    const feedbackCategory = await new GameFeedbackCategoryFactory(game).one()
    await em.persistAndFlush(feedbackCategory)

    await request(app)
      .delete(`/games/${game.id}/game-feedback/categories/${feedbackCategory.id}`)
      .auth(token, { type: 'bearer' })
      .expect(statusCode)

    const activity = await em.getRepository(GameActivity).findOne({
      type: GameActivityType.GAME_FEEDBACK_CATEGORY_DELETED,
      game,
      extra: {
        feedbackCategoryInternalName: feedbackCategory.internalName
      }
    })

    if (statusCode === 204) {
      expect(activity).not.toBeNull()
    } else {
      expect(activity).toBeNull()
    }
  })

  it('should not delete a feedback category for a game the user has no access to', async () => {
    const [, otherGame] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN })

    const feedbackCategory = await new GameFeedbackCategoryFactory(otherGame).one()
    await em.persistAndFlush(feedbackCategory)

    const res = await request(app)
      .delete(`/games/${otherGame.id}/game-feedback/categories/${feedbackCategory.id}`)
      .auth(token, { type: 'bearer' })
      .expect(403)

    expect(res.body).toStrictEqual({ message: 'Forbidden' })
  })

  it('should not delete a non-existent feedback category', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({ type: UserType.ADMIN }, organization)

    const res = await request(app)
      .delete(`/games/${game.id}/game-feedback/categories/99999`)
      .auth(token, { type: 'bearer' })
      .expect(404)

    expect(res.body).toStrictEqual({ message: 'Feedback category not found' })
  })
})
