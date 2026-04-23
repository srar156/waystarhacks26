'use client'

import { useMemo } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js'
import { PaymentForm } from './PaymentForm'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface StripeWrapperProps {
  pageId: string
  amount: number
  payerName: string
  payerEmail: string
  glCode: string
  fieldResponses: { fieldId: string; value: string }[]
  brandColor: string
  onSuccess: (transactionId: string) => void
  onError: (message: string) => void
}

export function StripeWrapper(props: StripeWrapperProps) {
  const options: StripeElementsOptions = useMemo(
    () => ({
      mode: 'payment' as const,
      amount: Math.round(props.amount * 100),
      currency: 'usd',
      paymentMethodCreation: 'manual',
      appearance: {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: props.brandColor,
          borderRadius: '8px',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      },
    }),
    [props.amount, props.brandColor]
  )

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  )
}
