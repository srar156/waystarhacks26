import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendConfirmationEmail } from '@/lib/email'

// POST /api/payments/confirm — save transaction + field responses + send email
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      pageId,
      amount,
      payerName,
      payerEmail,
      stripePaymentIntentId,
      paymentMethod,
      glCode,
      fieldResponses, // { fieldId: string, value: string }[]
    } = body

    // Validate required fields
    if (!pageId || !amount || !payerName || !payerEmail || !stripePaymentIntentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const page = await prisma.paymentPage.findUnique({
      where: { id: pageId },
      include: { customFields: true },
    })

    if (!page) {
      return NextResponse.json({ error: 'Payment page not found' }, { status: 404 })
    }

    // Validate required custom fields
    for (const field of page.customFields) {
      if (field.required) {
        const response = (fieldResponses || []).find(
          (fr: { fieldId: string; value: string }) => fr.fieldId === field.id
        )
        if (!response || !response.value?.trim()) {
          return NextResponse.json(
            { error: `${field.label} is required` },
            { status: 400 }
          )
        }
      }
    }

    // Save transaction
    const transaction = await prisma.transaction.create({
      data: {
        pageId,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || 'card',
        status: 'SUCCESS',
        payerEmail,
        payerName,
        stripePaymentIntentId,
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

    // Send confirmation email
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

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
    })
  } catch (error) {
    console.error('POST /api/payments/confirm error:', error)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
