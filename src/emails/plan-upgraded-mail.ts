import Stripe from 'stripe'
import Organization from '../entities/organization'
import Mail from './mail'

export default class PlanUpgraded extends Mail {
  constructor(organization: Organization, price: Stripe.Price, product: Stripe.Product) {
    super(organization.email, 'Your new Talo subscription', `Your plan has been successfully changed. Your organization has now been moved to the ${product.name}, recurring ${price.recurring!.interval}ly. An invoice for this will be sent to you when your new plan starts.`)

    this.title = 'Your plan has changed'
    this.mainText = `Your organization has now been moved to the ${product.name}, recurring ${price.recurring!.interval}ly. An invoice for this will be sent to you when your new plan starts.`

    this.why = 'You are receiving this email because your Talo subscription was updated'
  }
}
