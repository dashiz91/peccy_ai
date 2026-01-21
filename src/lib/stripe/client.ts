import Stripe from 'stripe'

// Initialize Stripe client (server-side only)
let stripe: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return stripe
}

// Credit packages available for purchase
export const CREDIT_PACKAGES = [
  {
    id: 'credits_25',
    name: '25 Credits',
    credits: 25,
    price: 999, // $9.99 in cents
    pricePerCredit: 0.40,
    popular: false,
  },
  {
    id: 'credits_100',
    name: '100 Credits',
    credits: 100,
    price: 2999, // $29.99 in cents
    pricePerCredit: 0.30,
    popular: true,
  },
  {
    id: 'credits_500',
    name: '500 Credits',
    credits: 500,
    price: 9999, // $99.99 in cents
    pricePerCredit: 0.20,
    popular: false,
  },
] as const

export type CreditPackage = (typeof CREDIT_PACKAGES)[number]

export function getPackageById(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === packageId)
}
