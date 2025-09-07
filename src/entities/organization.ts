import { Collection, Entity, OneToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/mysql'
import Game from './game'
import OrganizationPricingPlan from './organization-pricing-plan'

@Entity()
export default class Organization {
  @PrimaryKey()
  id!: number

  @Property()
  email!: string

  @Property()
  name!: string

  @OneToMany(() => Game, (game) => game.organization)
  games = new Collection<Game>(this)

  @OneToOne({ orphanRemoval: true, eager: true })
  pricingPlan!: OrganizationPricingPlan

  @Property()
  createdAt: Date = new Date()

  @Property()
  updatedAt: Date = new Date()

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      games: this.games,
      pricingPlan: {
        status: this.pricingPlan.status
      }
    }
  }
}
