import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseJsonSafe } from '@/lib/utils'

// GET /api/payment-pages — list all pages
export async function GET() {
  try {
    const pages = await prisma.paymentPage.findMany({
      include: { customFields: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })

    const result = pages.map((p) => ({
      ...p,
      fixedAmount: p.fixedAmount ? Number(p.fixedAmount) : null,
      minAmount: p.minAmount ? Number(p.minAmount) : null,
      maxAmount: p.maxAmount ? Number(p.maxAmount) : null,
      glCodes: parseJsonSafe<string[]>(p.glCodes, []),
      customFields: p.customFields.map((f) => ({
        ...f,
        options: parseJsonSafe<string[]>(f.options, []),
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/payment-pages error:', error)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}

// POST /api/payment-pages — create new page
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      slug,
      title,
      description,
      brandColor,
      logoUrl,
      headerMessage,
      footerMessage,
      amountMode,
      fixedAmount,
      minAmount,
      maxAmount,
      glCodes,
      isActive,
      emailTemplate,
      customFields,
    } = body

    // Check slug uniqueness
    const existing = await prisma.paymentPage.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }

    const page = await prisma.paymentPage.create({
      data: {
        slug,
        title,
        description: description || null,
        brandColor: brandColor || '#FF6900',
        logoUrl: logoUrl || null,
        headerMessage: headerMessage || null,
        footerMessage: footerMessage || null,
        amountMode: amountMode || 'OPEN',
        fixedAmount: fixedAmount ? parseFloat(fixedAmount) : null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        glCodes: JSON.stringify(glCodes || []),
        isActive: isActive ?? true,
        emailTemplate: emailTemplate || null,
        customFields: {
          create: (customFields || []).map(
            (f: { label: string; fieldType: string; options: string[]; required: boolean; placeholder: string; displayOrder: number }, i: number) => ({
              label: f.label,
              fieldType: f.fieldType || 'TEXT',
              options: f.options?.length ? JSON.stringify(f.options) : null,
              required: f.required ?? false,
              placeholder: f.placeholder || null,
              displayOrder: f.displayOrder ?? i,
            })
          ),
        },
      },
      include: { customFields: { orderBy: { displayOrder: 'asc' } } },
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error('POST /api/payment-pages error:', error)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}
