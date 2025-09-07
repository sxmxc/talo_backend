import Organization from '../entities/organization'
import Mail from './mail'

export default class PlanRenewed extends Mail {
  constructor(organization: Organization) {
    super(organization.email, 'Subscription renewed', 'Thank you for choosing to continue your Talo subscription. Your subscription has been successfully renewed and will carry on as normal.')

    this.title = 'Subscription renewed'
    this.mainText = 'Thanks for renewing your subscription! Your renewal was successful and your subscription will carry on as normal.'

    this.why = 'You are receiving this email because your Talo subscription was updated'
  }
}
