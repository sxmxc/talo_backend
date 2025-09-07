import { format } from 'date-fns'
import Stripe from 'stripe'
import Organization from '../entities/organization'
import Mail from './mail'

export default class PlanPaymentFailed extends Mail {
  constructor(organization: Organization, invoice: Stripe.Invoice) {
    super(organization.email, 'Payment failed', `We attempted to charge your card for your ${format(new Date(), 'MMMM yyyy')} invoice, however we were unable to do so.`)

    this.title = 'Payment failed'
    this.mainText = `We attempted to charge your card for your ${format(new Date(), 'MMMM yyyy')} invoice, however we were unable to do so.<br/><br/>Please use the link below to update your payment details:`

    this.ctaLink = invoice.hosted_invoice_url!
    this.ctaText = 'View invoice'

    this.why = 'You are receiving this email because your Talo subscription was updated'
  }
}
