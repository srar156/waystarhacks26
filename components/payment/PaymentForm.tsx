'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PaymentElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PaymentRequest } from '@stripe/stripe-js'

interface PaymentFormProps {
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

export function PaymentForm({
  pageId,
  amount,
  payerName,
  payerEmail,
  glCode,
  fieldResponses,
  brandColor,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [ready, setReady] = useState(false)
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [canMakePayment, setCanMakePayment] = useState(false)

  // Set up PaymentRequestButton for Apple Pay / Google Pay
  useEffect(() => {
    if (!stripe) return

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'QuickPay Payment',
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    })

    // Check if the browser supports Payment Request (Apple Pay / Google Pay)
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr)
        setCanMakePayment(true)
      }
    })

    // Handle the payment method from digital wallet
    pr.on('paymentmethod', async (ev) => {
      setProcessing(true)
      try {
        // Determine wallet type
        const walletType = ev.paymentMethod.card?.wallet?.type
        const methodType =
          walletType === 'apple_pay'
            ? 'apple_pay'
            : walletType === 'google_pay'
            ? 'google_pay'
            : 'card'

        // Call our API to process
        const res = await fetch('/api/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId,
            amount,
            payerName: ev.payerName || payerName,
            payerEmail: ev.payerEmail || payerEmail,
            paymentMethodId: ev.paymentMethod.id,
            paymentMethod: methodType,
            glCode,
            fieldResponses,
          }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          ev.complete('fail')
          onError(data.error || 'Payment failed')
        } else {
          ev.complete('success')
          onSuccess(data.transactionId)
        }
      } catch {
        ev.complete('fail')
        onError('Payment processing failed')
      } finally {
        setProcessing(false)
      }
    })

    return () => {
      // Cleanup
    }
  }, [stripe, amount, pageId, payerName, payerEmail, glCode, fieldResponses])

  // Handle standard card payment via PaymentElement
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) return

    setProcessing(true)

    try {
      // Submit the PaymentElement form
      const { error: submitError } = await elements.submit()
      if (submitError) {
        onError(submitError.message || 'Payment validation failed')
        setProcessing(false)
        return
      }

      // Create a payment method from the element
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
      })

      if (pmError || !paymentMethod) {
        onError(pmError?.message || 'Failed to create payment method')
        setProcessing(false)
        return
      }

      // Send to our API to create PaymentIntent and confirm
      const res = await fetch('/api/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          amount,
          payerName,
          payerEmail,
          paymentMethodId: paymentMethod.id,
          paymentMethod: paymentMethod.type === 'card' ? 'card' : paymentMethod.type,
          glCode,
          fieldResponses,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        onError(data.error || 'Payment failed')
        setProcessing(false)
        return
      }

      if (data.success) {
        onSuccess(data.transactionId)
      } else if (data.clientSecret && data.status === 'PENDING') {
        // Handle requires_action
        const { error: confirmError } = await stripe.confirmPayment({
          clientSecret: data.clientSecret,
          confirmParams: {
            return_url: window.location.href,
          },
        })
        if (confirmError) {
          onError(confirmError.message || 'Payment confirmation failed')
        }
      } else {
        onError('Payment was not successful. Please try again.')
      }
    } catch {
      onError('An unexpected error occurred. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Apple Pay / Google Pay button */}
      {canMakePayment && paymentRequest && (
        <>
          <div>
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    type: 'default',
                    theme: 'dark',
                    height: '48px',
                  },
                },
              }}
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-1 border-t border-gray-200 dark:border-zinc-700" />
            <span className="px-3 text-xs text-muted-foreground bg-card">
              — or pay with card —
            </span>
            <div className="flex-1 border-t border-gray-200 dark:border-zinc-700" />
          </div>
        </>
      )}

      {/* Standard card form */}
      <form onSubmit={handleSubmit}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{
            layout: 'tabs',
          }}
        />

        <Button
          type="submit"
          disabled={!stripe || !elements || processing || !ready}
          className="w-full h-12 text-base font-semibold text-white mt-4"
          style={{ backgroundColor: brandColor }}
          aria-busy={processing}
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
              Processing…
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        Secured by Stripe. Your payment information is encrypted.
      </p>
    </div>
  )
}
