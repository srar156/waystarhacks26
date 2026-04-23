'use client'

import { CheckCircle, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PaymentSuccessProps {
  transactionId: string
  amount: number
  payerName: string
  payerEmail: string
  brandColor: string
  pageTitle: string
}

export function PaymentSuccess({
  transactionId,
  amount,
  payerName,
  payerEmail,
  brandColor,
  pageTitle,
}: PaymentSuccessProps) {
  const [copied, setCopied] = useState(false)

  function copyTransactionId() {
    navigator.clipboard.writeText(transactionId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="text-center py-8 space-y-6 animate-in fade-in duration-500">
      {/* Success icon */}
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: `${brandColor}15` }}
      >
        <CheckCircle
          className="h-12 w-12"
          style={{ color: brandColor }}
          aria-hidden="true"
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Payment Successful!
        </h2>
        <p className="text-muted-foreground mt-2">
          Thank you, {payerName}. Your payment has been processed.
        </p>
      </div>

      {/* Receipt details */}
      <div className="mx-auto max-w-sm rounded-lg border bg-card p-5 text-left space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-semibold">${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">For</span>
          <span className="text-sm font-medium">{pageTitle}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Email</span>
          <span className="text-sm">{payerEmail}</span>
        </div>
        <hr />
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Transaction ID</p>
            <p className="text-xs font-mono mt-0.5 break-all">{transactionId}</p>
          </div>
          <button
            onClick={copyTransactionId}
            className="shrink-0 p-1.5 rounded hover:bg-muted transition-colors"
            aria-label="Copy transaction ID"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        A confirmation email has been sent to <strong>{payerEmail}</strong>.
      </p>

      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        className="mt-2"
      >
        Make Another Payment
      </Button>
    </div>
  )
}
