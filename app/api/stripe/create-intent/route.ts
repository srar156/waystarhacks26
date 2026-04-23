import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendConfirmationEmail } from '@/lib/email'
import { parseJsonSafe } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      pageId,
      amount,
      payerName,
      payerEmail,
      paymentMethodId,
      paymentMethod: methodType,
      glCode,
      fieldResponses, // { fieldId: string, value: string }[]
    } = body

    if (!pageId || !amount || !payerName || !payerEmail || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate page exists and is active
    const page = await prisma.paymentPage.findUnique({
      where: { id: pageId },
      include: { customFields: true },
    })

    if (!page) {
      return NextResponse.json({ error: 'Payment page not found' }, { status: 404 })
    }

    if (!page.isActive) {
      return NextResponse.json({ error: 'Payment page is not active' }, { status: 400 })
    }

    // Validate amount
    const amountCents = Math.round(parseFloat(amount) * 100)
    if (amountCents < 100) {
      return NextResponse.json({ error: 'Minimum payment is $1.00' }, { status: 400 })
    }

    if (page.amountMode === 'FIXED' && page.fixedAmount) {
      const expected = Math.round(Number(page.fixedAmount) * 100)
      if (amountCents !== expected) {
        return NextResponse.json({ error: 'Amount does not match fixed amount' }, { status: 400 })
      }
    }

    if (page.amountMode === 'RANGE') {
      const min = page.minAmount ? Math.round(Number(page.minAmount) * 100) : 0
      const max = page.maxAmount ? Math.round(Number(page.maxAmount) * 100) : Infinity
      if (amountCents < min || amountCents > max) {
        return NextResponse.json({ error: 'Amount outside allowed range' }, { status: 400 })
      }
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        pageId,
        payerName,
        payerEmail,
        glCode: glCode || '',
      },
      receipt_email: payerEmail,
    })

    // Determine status
    const isSuccess = paymentIntent.status === 'succeeded'
    const status = isSuccess ? 'SUCCESS' : paymentIntent.status === 'processing' ? 'PENDING' : 'FAILED'

    // Save transaction
    const transaction = await prisma.transaction.create({
      data: {
        pageId,
        amount: parseFloat(amount),
        paymentMethod: methodType || 'card',
        status,
        payerEmail,
        payerName,
        stripePaymentIntentId: paymentIntent.id,
        glCode: glCode || null,
        fieldResponses: {
          create: (fieldResponses || [])
            .filter((fr: { fieldId: string; value: string }) => fr.value)
            .map((fr: { fieldId: string; value: string }) => ({
              fieldId: fr.fieldId,
              value: fr.value,
            })),
        },
      },
    })

    // Send confirmation email if successful
    if (isSuccess) {
      const customFieldsMap: Record<string, string> = {}
      if (fieldResponses) {
        for (const fr of fieldResponses as { fieldId: string; value: string }[]) {
          const field = page.customFields.find((f) => f.id === fr.fieldId)
          if (field && fr.value) {
            customFieldsMap[field.label] = fr.value
          }
        }
      }

      sendConfirmationEmail({
        to: payerEmail,
        payerName,
        amount: parseFloat(amount),
        transactionId: transaction.id,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        customFields: customFieldsMap,
        template: page.emailTemplate,
      }).catch(console.error) // Fire and forget
    }

    return NextResponse.json({
      success: isSuccess,
      status,
      transactionId: transaction.id,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: unknown) {
    console.error('POST /api/stripe/create-intent error:', error)

    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message: string }
      if (stripeError.type === 'StripeCardError') {
        return NextResponse.json(
          { error: stripeError.message || 'Payment declined' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}
