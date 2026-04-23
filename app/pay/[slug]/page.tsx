'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { CreditCard, Loader2, AlertCircle, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CustomFieldRenderer } from '@/components/payment/CustomFieldRenderer'
import { StripeWrapper } from '@/components/payment/StripeWrapper'
import { PaymentSuccess } from '@/components/payment/PaymentSuccess'
import type { PaymentPage } from '@/types'

type Step = 'info' | 'payment' | 'success' | 'error'

export default function PublicPaymentPage() {
  const params = useParams()
  const slug = params.slug as string

  const [page, setPage] = useState<PaymentPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state
  const [payerName, setPayerName] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [glCode, setGlCode] = useState('')
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Flow state
  const [step, setStep] = useState<Step>('info')
  const [successTxId, setSuccessTxId] = useState('')
  const [paymentError, setPaymentError] = useState('')

  // Refs for focus management
  const resultRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const errorRegionRef = useRef<HTMLDivElement>(null)

  // Fetch page data by slug using the dedicated public endpoint
  useEffect(() => {
    async function fetchPage() {
      try {
        const res = await fetch(`/api/pages/slug/${slug}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Payment page not found.')
          return
        }
        const data: PaymentPage = await res.json()
        setPage(data)

        // Pre-fill amount for fixed mode
        if (data.amountMode === 'FIXED' && data.fixedAmount) {
          setAmount(data.fixedAmount.toString())
        }

        // Default GL code if only one
        if (data.glCodes.length === 1) {
          setGlCode(data.glCodes[0])
        }
      } catch {
        setError('Unable to load payment page. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [slug])

  // Focus management: move focus to result on step change
  useEffect(() => {
    if ((step === 'success' || step === 'error') && resultRef.current) {
      resultRef.current.focus()
    }
  }, [step])

  const handleCustomFieldChange = useCallback(
    (fieldId: string, value: string) => {
      setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    },
    []
  )

  function validateInfoStep(): boolean {
    const errors: Record<string, string> = {}

    if (!payerName.trim()) errors.payerName = 'Full name is required'
    if (!payerEmail.trim()) errors.payerEmail = 'Email address is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
      errors.payerEmail = 'Please enter a valid email address'
    }

    if (!page) return false

    // Amount validation
    const parsedAmount = parseFloat(amount)
    if (page.amountMode !== 'FIXED') {
      if (!amount || isNaN(parsedAmount) || parsedAmount < 1) {
        errors.amount = 'Please enter a valid amount (minimum $1.00)'
      } else if (
        page.amountMode === 'RANGE' &&
        page.minAmount &&
        parsedAmount < page.minAmount
      ) {
        errors.amount = `Minimum amount is $${page.minAmount}`
      } else if (
        page.amountMode === 'RANGE' &&
        page.maxAmount &&
        parsedAmount > page.maxAmount
      ) {
        errors.amount = `Maximum amount is $${page.maxAmount}`
      }
    }

    // GL code required if multiple
    if (page.glCodes.length > 1 && !glCode) {
      errors.glCode = 'Please select a category'
    }

    // Custom field validation
    for (const field of page.customFields) {
      if (field.required) {
        const val = customValues[field.id]
        if (!val || (val.trim() === '' && field.fieldType !== 'CHECKBOX')) {
          errors[field.id] = `${field.label} is required`
        }
        if (field.fieldType === 'CHECKBOX' && val !== 'true') {
          errors[field.id] = `${field.label} must be checked`
        }
      }
    }

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      // Focus the first error field
      const firstKey = Object.keys(errors)[0]
      const el =
        document.getElementById(firstKey) ||
        document.getElementById(`custom-${firstKey}`)
      el?.focus()
    }

    return Object.keys(errors).length === 0
  }

  function handleContinueToPayment(e: React.FormEvent) {
    e.preventDefault()
    if (validateInfoStep()) {
      setPaymentError('')
      setStep('payment')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray dark:bg-zinc-950">
        <div className="text-center" role="status">
          <Loader2 className="h-10 w-10 animate-spin text-brand-orange mx-auto" aria-hidden="true" />
          <p className="mt-4 text-muted-foreground">Loading payment page…</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray dark:bg-zinc-950 p-4">
        <div className="text-center max-w-md" role="alert">
          <img
            src="https://s45903.pcdn.co/wp-content/uploads/2018/12/logo-full.png"
            alt="Waystar logo"
            className="h-8 mx-auto mb-6 opacity-60"
          />
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold mb-2">Page Not Available</h1>
          <p className="text-muted-foreground">{error || 'This payment page is currently unavailable.'}</p>
        </div>
      </div>
    )
  }

  const brandColor = page.brandColor || '#FF6900'
  const finalAmount =
    page.amountMode === 'FIXED' && page.fixedAmount
      ? page.fixedAmount
      : parseFloat(amount) || 0

  return (
    <div className="min-h-screen bg-brand-gray dark:bg-zinc-950">
      {/* Skip navigation link */}
      <a
        href="#payment-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded-md focus:text-sm focus:font-semibold"
      >
        Skip to payment form
      </a>

      {/* Header banner */}
      <header className="w-full" style={{ backgroundColor: brandColor }}>
        <div className="max-w-lg mx-auto px-6 py-6">
          {page.logoUrl && (
            <img
              src={page.logoUrl}
              alt={`${page.title} logo`}
              className="h-8 mb-3 object-contain brightness-0 invert"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          )}
          <h1 className="text-2xl font-bold text-white">{page.title}</h1>
          {page.description && (
            <p className="text-white/80 text-sm mt-1">{page.description}</p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-6 py-6" id="payment-form">
        {page.headerMessage && (
          <div
            className="mb-6 p-4 rounded-lg text-sm border"
            style={{
              backgroundColor: `${brandColor}10`,
              borderColor: `${brandColor}30`,
            }}
          >
            {page.headerMessage}
          </div>
        )}

        {/* Aria-live region for error announcements */}
        <div
          ref={errorRegionRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {Object.values(formErrors).length > 0 &&
            `There are ${Object.values(formErrors).length} errors in the form. ${Object.values(formErrors).join('. ')}`}
          {paymentError && `Payment error: ${paymentError}`}
        </div>

        {step === 'success' ? (
          <div ref={resultRef} tabIndex={-1} aria-label="Payment result">
            <PaymentSuccess
              transactionId={successTxId}
              amount={finalAmount}
              payerName={payerName}
              payerEmail={payerEmail}
              brandColor={brandColor}
              pageTitle={page.title}
            />
          </div>
        ) : step === 'error' ? (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="alert"
            className="text-center py-8 space-y-4"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-12 w-12 text-red-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold">Payment Failed</h2>
            <p className="text-muted-foreground">{paymentError || 'Something went wrong.'}</p>
            <Button onClick={() => { setStep('payment'); setPaymentError('') }}>
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step indicator */}
            <nav aria-label="Payment steps" className="flex items-center gap-3 mb-2">
              <div
                className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold text-white ${
                  step === 'info' ? '' : 'opacity-60'
                }`}
                style={{ backgroundColor: brandColor }}
                aria-current={step === 'info' ? 'step' : undefined}
              >
                1
              </div>
              <span className={`text-xs font-medium ${step === 'info' ? '' : 'text-muted-foreground'}`}>
                Your Info
              </span>
              <div
                className={`h-0.5 flex-1 rounded ${
                  step === 'payment' ? 'bg-current' : 'bg-gray-200 dark:bg-zinc-700'
                }`}
                style={step === 'payment' ? { backgroundColor: brandColor } : {}}
                aria-hidden="true"
              />
              <div
                className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${
                  step === 'payment'
                    ? 'text-white'
                    : 'text-muted-foreground border-2 border-gray-200 dark:border-zinc-700'
                }`}
                style={step === 'payment' ? { backgroundColor: brandColor } : {}}
                aria-current={step === 'payment' ? 'step' : undefined}
              >
                2
              </div>
              <span className={`text-xs font-medium ${step === 'payment' ? '' : 'text-muted-foreground'}`}>
                Payment
              </span>
            </nav>

            {step === 'info' && (
              <form ref={formRef} onSubmit={handleContinueToPayment} noValidate className="space-y-5">
                {/* Payer Details */}
                <fieldset className="rounded-lg border bg-card p-5 space-y-4">
                  <legend className="text-base font-semibold px-1">Your Information</legend>

                  <div>
                    <Label htmlFor="payerName">
                      Full Name <span className="text-red-500" aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="payerName"
                      value={payerName}
                      onChange={(e) => {
                        setPayerName(e.target.value)
                        setFormErrors((p) => { const n = { ...p }; delete n.payerName; return n })
                      }}
                      placeholder="John Doe"
                      className="mt-1"
                      aria-required="true"
                      aria-invalid={!!formErrors.payerName}
                      aria-describedby={formErrors.payerName ? 'payerName-error' : undefined}
                    />
                    {formErrors.payerName && (
                      <span id="payerName-error" role="alert" className="text-xs text-red-500 mt-1 block">
                        {formErrors.payerName}
                      </span>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="payerEmail">
                      Email Address <span className="text-red-500" aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="payerEmail"
                      type="email"
                      value={payerEmail}
                      onChange={(e) => {
                        setPayerEmail(e.target.value)
                        setFormErrors((p) => { const n = { ...p }; delete n.payerEmail; return n })
                      }}
                      placeholder="john@example.com"
                      className="mt-1"
                      aria-required="true"
                      aria-invalid={!!formErrors.payerEmail}
                      aria-describedby={formErrors.payerEmail ? 'payerEmail-error' : undefined}
                    />
                    {formErrors.payerEmail && (
                      <span id="payerEmail-error" role="alert" className="text-xs text-red-500 mt-1 block">
                        {formErrors.payerEmail}
                      </span>
                    )}
                  </div>
                </fieldset>

                {/* Amount */}
                <fieldset className="rounded-lg border bg-card p-5 space-y-4">
                  <legend className="text-base font-semibold px-1">Payment Amount</legend>

                  {page.amountMode === 'FIXED' && page.fixedAmount ? (
                    <div>
                      <p
                        className="text-3xl font-bold"
                        style={{ color: brandColor }}
                        aria-label={`Fixed payment amount: $${page.fixedAmount.toFixed(2)}`}
                      >
                        ${page.fixedAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fixed amount
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="amount">
                        Amount ($) <span className="text-red-500" aria-hidden="true">*</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        min={
                          page.amountMode === 'RANGE' && page.minAmount
                            ? page.minAmount
                            : 1
                        }
                        max={
                          page.amountMode === 'RANGE' && page.maxAmount
                            ? page.maxAmount
                            : undefined
                        }
                        step="0.01"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value)
                          setFormErrors((p) => { const n = { ...p }; delete n.amount; return n })
                        }}
                        placeholder={
                          page.amountMode === 'RANGE'
                            ? `Enter amount between $${page.minAmount ?? 1} – $${page.maxAmount ?? '∞'}`
                            : 'Enter any amount'
                        }
                        className="mt-1 text-lg"
                        aria-required="true"
                        aria-invalid={!!formErrors.amount}
                        aria-describedby={
                          formErrors.amount
                            ? 'amount-error'
                            : page.amountMode === 'RANGE'
                            ? 'amount-hint'
                            : 'amount-hint-open'
                        }
                      />
                      {page.amountMode === 'RANGE' && (
                        <p id="amount-hint" className="text-xs text-muted-foreground mt-1">
                          Enter amount between ${page.minAmount ?? 1} and $
                          {page.maxAmount ?? '∞'}
                        </p>
                      )}
                      {page.amountMode === 'OPEN' && (
                        <p id="amount-hint-open" className="text-xs text-muted-foreground mt-1">
                          Enter any amount (minimum $1.00)
                        </p>
                      )}
                      {formErrors.amount && (
                        <span id="amount-error" role="alert" className="text-xs text-red-500 mt-1 block">
                          {formErrors.amount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* GL Code Selector */}
                  {page.glCodes.length > 1 && (
                    <div>
                      <Label htmlFor="glCode">
                        Payment Category <span className="text-red-500" aria-hidden="true">*</span>
                      </Label>
                      <select
                        id="glCode"
                        value={glCode}
                        onChange={(e) => {
                          setGlCode(e.target.value)
                          setFormErrors((p) => { const n = { ...p }; delete n.glCode; return n })
                        }}
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-required="true"
                        aria-invalid={!!formErrors.glCode}
                        aria-describedby={formErrors.glCode ? 'glCode-error' : undefined}
                      >
                        <option value="">Select category…</option>
                        {page.glCodes.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                      {formErrors.glCode && (
                        <span id="glCode-error" role="alert" className="text-xs text-red-500 mt-1 block">
                          {formErrors.glCode}
                        </span>
                      )}
                    </div>
                  )}
                </fieldset>

                {/* Custom Fields */}
                {page.customFields.length > 0 && (
                  <fieldset className="rounded-lg border bg-card p-5 space-y-4">
                    <legend className="text-base font-semibold px-1">Additional Information</legend>
                    <CustomFieldRenderer
                      fields={page.customFields}
                      values={customValues}
                      onChange={handleCustomFieldChange}
                      errors={formErrors}
                    />
                  </fieldset>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  Continue to Payment
                </Button>
              </form>
            )}

            {step === 'payment' && (
              <div className="space-y-5">
                {/* Summary */}
                <div className="rounded-lg border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-base">Payment Summary</h2>
                    <button
                      onClick={() => setStep('info')}
                      className="text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
                      style={{ color: brandColor }}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span>{payerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{payerEmail}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span style={{ color: brandColor }}>
                        ${finalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stripe Payment */}
                <fieldset className="rounded-lg border bg-card p-5">
                  <legend className="text-base font-semibold px-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Payment Information
                  </legend>

                  {paymentError && (
                    <div
                      role="alert"
                      className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-start gap-2"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                      {paymentError}
                    </div>
                  )}

                  <StripeWrapper
                    pageId={page.id}
                    amount={finalAmount}
                    payerName={payerName}
                    payerEmail={payerEmail}
                    glCode={glCode}
                    fieldResponses={Object.entries(customValues).map(
                      ([fieldId, value]) => ({ fieldId, value })
                    )}
                    brandColor={brandColor}
                    onSuccess={(txId) => {
                      setSuccessTxId(txId)
                      setStep('success')
                    }}
                    onError={(msg) => setPaymentError(msg)}
                  />
                </fieldset>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  <span>
                    256-bit SSL encrypted · PCI DSS compliant · Powered by Stripe
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {page.footerMessage && (
          <footer className="mt-8 text-xs text-center text-muted-foreground border-t pt-4">
            {page.footerMessage}
          </footer>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground pb-8">
          Powered by{' '}
          <span className="font-semibold" style={{ color: brandColor }}>
            QuickPay
          </span>{' '}
          by Waystar
        </p>
      </main>
    </div>
  )
}
