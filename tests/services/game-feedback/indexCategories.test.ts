import request from 'supertest'
import createUserAndToken from '../../utils/createUserAndToken'
import createOrganizationAndGame from '../../utils/createOrganizationAndGame'
import GameFeedbackFactory from '../../fixtures/GameFeedbackFactory'
import GameFeedbackCategoryFactory from '../../fixtures/GameFeedbackCategoryFactory'
import GameFeedbackCategory from '../../../src/entities/game-feedback-category'

describe('Game feedback service - index categories', () => {
  it('should return a list of categories', async () => {
    const [organization, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken({}, organization)

    const categories = await new GameFeedbackCategoryFactory(game).many(10)
    await em.persistAndFlush(categories)

    const res = await request(app)
      .get(`/games/${game.id}/game-feedback/categories`)
      .auth(token, { type: 'bearer' })
      .expect(200)

    res.body.feedbackCategories.forEach((item: GameFeedbackCategory, idx: number) => {
      expect(item.id).toBe(categories[idx].id)
    })
  })

  it('should not return categories for a non-existent game', async () => {
    const [token] = await createUserAndToken()

    const res = await request(app)
      .get('/games/99999/game-feedback/categories')
      .auth(token, { type: 'bearer' })
      .expect(404)

    expect(res.body).toStrictEqual({ message: 'Game not found' })
  })

  it('should not return categories for a game the user has no access to', async () => {
    const [, game] = await createOrganizationAndGame()
    const [token] = await createUserAndToken()

    await new GameFeedbackFactory(game).many(10)

    await request(app)
      .get(`/games/${game.id}/game-feedback/categories`)
      .auth(token, { type: 'bearer' })
      .expect(403)
  })
})
