import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

// POST /api/payments/create-intent — create Stripe PaymentIntent
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, pageId } = body

    if (!amount || !pageId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amountCents = Math.round(parseFloat(amount) * 100)
    if (amountCents < 100) {
      return NextResponse.json({ error: 'Minimum payment is $1.00' }, { status: 400 })
    }

    // Validate against page constraints
    const { prisma } = await import('@/lib/prisma')
    const page = await prisma.paymentPage.findUnique({ where: { id: pageId } })

    if (!page) {
      return NextResponse.json({ error: 'Payment page not found' }, { status: 404 })
    }

    if (!page.isActive) {
      return NextResponse.json({ error: 'Payment page is not active' }, { status: 400 })
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { pageId },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('POST /api/payments/create-intent error:', error)
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}
