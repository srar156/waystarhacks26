import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/transactions/export — CSV export
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}
    if (pageId) where.pageId = pageId
    if (status) where.status = status
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        page: { select: { title: true, slug: true } },
        fieldResponses: { include: { field: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Build CSV
    const headers = [
      'Date',
      'Payer Name',
      'Payer Email',
      'Page',
      'Amount',
      'Payment Method',
      'GL Code',
      'Status',
      'Stripe PI',
      'Custom Fields',
    ]

    const rows = transactions.map((tx) => {
      const customFields = tx.fieldResponses
        .map((fr) => `${fr.field.label}: ${fr.value}`)
        .join('; ')

      return [
        new Date(tx.createdAt).toISOString(),
        `"${tx.payerName.replace(/"/g, '""')}"`,
        tx.payerEmail,
        `"${(tx.page?.title || '').replace(/"/g, '""')}"`,
        Number(tx.amount).toFixed(2),
        tx.paymentMethod,
        tx.glCode || '',
        tx.status,
        tx.stripePaymentIntentId || '',
        `"${customFields.replace(/"/g, '""')}"`,
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="quickpay-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('GET /api/transactions/export error:', error)
    return NextResponse.json({ error: 'Failed to export transactions' }, { status: 500 })
  }
}
