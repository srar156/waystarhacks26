import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/transactions/summary — aggregated stats
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

    const allTx = await prisma.transaction.findMany({ where })

    const totalCount = allTx.length
    const totalAmount = allTx.reduce((sum, t) => sum + Number(t.amount), 0)
    const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0
    const successCount = allTx.filter((t) => t.status === 'SUCCESS').length
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0

    const byGlCode = Object.values(
      allTx.reduce<Record<string, { glCode: string; count: number; amount: number }>>(
        (acc, t) => {
          const gl = t.glCode || 'Unassigned'
          if (!acc[gl]) acc[gl] = { glCode: gl, count: 0, amount: 0 }
          acc[gl].count++
          acc[gl].amount += Number(t.amount)
          return acc
        },
        {}
      )
    )

    const byPaymentMethod = Object.values(
      allTx.reduce<Record<string, { method: string; count: number }>>((acc, t) => {
        const m = t.paymentMethod
        if (!acc[m]) acc[m] = { method: m, count: 0 }
        acc[m].count++
        return acc
      }, {})
    )

    const byStatus = Object.values(
      allTx.reduce<Record<string, { status: string; count: number }>>((acc, t) => {
        if (!acc[t.status]) acc[t.status] = { status: t.status, count: 0 }
        acc[t.status].count++
        return acc
      }, {})
    )

    return NextResponse.json({
      totalCount,
      totalAmount,
      avgAmount,
      successRate,
      byGlCode,
      byPaymentMethod,
      byStatus,
    })
  } catch (error) {
    console.error('GET /api/transactions/summary error:', error)
    return NextResponse.json({ error: 'Failed to compute summary' }, { status: 500 })
  }
}
