import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseJsonSafe } from '@/lib/utils'

// GET /api/payment-pages/[id]
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const page = await prisma.paymentPage.findUnique({
      where: { id: params.id },
      include: {
        customFields: { orderBy: { displayOrder: 'asc' } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
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
      transactions: page.transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/payment-pages/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
  }
}

// PUT /api/payment-pages/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
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

    // Delete old custom fields and recreate
    await prisma.customField.deleteMany({ where: { pageId: params.id } })

    const page = await prisma.paymentPage.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json(page)
  } catch (error) {
    console.error('PUT /api/payment-pages/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}

// DELETE /api/payment-pages/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.paymentPage.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/payment-pages/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}

// PATCH /api/payment-pages/[id] — toggle active status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const page = await prisma.paymentPage.update({
      where: { id: params.id },
      data: { isActive: body.isActive },
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error('PATCH /api/payment-pages/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}
