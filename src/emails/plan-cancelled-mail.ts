import { format } from 'date-fns'
import Organization from '../entities/organization'
import Mail from './mail'

export default class PlanCancelled extends Mail {
  constructor(organization: Organization) {
    const formattedDate = format(new Date(organization.pricingPlan.endDate!), 'do MMM yyyy')

    super(organization.email, 'Subscription cancelled', `Your subscription has been successfully cancelled and will end on ${formattedDate}. In the mean time, you can renew your plan through the billing portal if you change your mind.`)

    this.title = 'Subscription cancelled'
    this.mainText = `Your subscription has been successfully cancelled and will end on ${formattedDate}. After this date, you will be downgraded to our free plan.<br/><br/>You will need to contact support about removing users if you have more members in your organization than the user seat limit for the free plan.<br/><br/>In the mean time, you can renew your plan through the billing portal if you change your mind.`

    this.why = 'You are receiving this email because your Talo subscription was updated'
  }
}
