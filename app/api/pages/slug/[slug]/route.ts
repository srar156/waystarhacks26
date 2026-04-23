import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJsonSafe } from '@/lib/utils'

// GET /api/pages/slug/[slug] — public endpoint to get page config by slug
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const page = await prisma.paymentPage.findUnique({
      where: { slug: params.slug },
      include: {
        customFields: { orderBy: { displayOrder: 'asc' } },
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Payment page not found' }, { status: 404 })
    }

    if (!page.isActive) {
      return NextResponse.json({ error: 'This payment page is currently unavailable' }, { status: 404 })
    }

    const result = {
      ...page,
      fixedAmount: page.fixedAmount ? Number(page.fixedAmount) : null,
      minAmount: page.minAmount ? Number(page.minAmount) : null,
      maxAmount: page.maxAmount ? Number(page.maxAmount) : null,
      glCodes: parseJsonSafe<string[]>(page.glCodes, []),
      customFields: page.customFields.map((f) => ({
        ...f,
        options: parseJsonSafe<string[]>(f.options, []),
      })),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/pages/slug/[slug] error:', error)
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
  }
}
