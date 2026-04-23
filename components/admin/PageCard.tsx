'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Edit, ToggleLeft, ToggleRight, Trash2, Share2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { PaymentPage } from '@/types'

interface PageCardProps {
  page: PaymentPage
  onToggle?: (id: string, isActive: boolean) => void
  onDelete?: (id: string) => void
}

export function PageCard({ page, onToggle, onDelete }: PageCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await onToggle?.(page.id, !page.isActive)
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return
    setLoading(true)
    await onDelete?.(page.id)
    setLoading(false)
  }

  const amountDisplay = {
    FIXED: page.fixedAmount ? `$${Number(page.fixedAmount).toFixed(2)} fixed` : 'Fixed',
    RANGE: `$${page.minAmount ?? 0} – $${page.maxAmount ?? '∞'}`,
    OPEN: 'Open amount',
  }[page.amountMode]

  return (
    <Card className="overflow-hidden">
      {/* Color bar */}
      <div className="h-1.5" style={{ backgroundColor: page.brandColor }} aria-hidden="true" />

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold truncate">{page.title}</h2>
              <Badge variant={page.isActive ? 'success' : 'outline'}>
                {page.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground font-mono">/pay/{page.slug}</p>
            {page.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{page.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{amountDisplay}</span>
              <span>·</span>
              <span>Created {formatDate(page.createdAt)}</span>
              {page.glCodes.length > 0 && (
                <>
                  <span>·</span>
                  <span>GL: {page.glCodes.join(', ')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/pages/${page.id}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Edit
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/pages/${page.id}/distribute`}>
              <Share2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Distribute
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <a href={`/pay/${page.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Preview
            </a>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleToggle}
            disabled={loading}
            aria-label={page.isActive ? `Disable ${page.title}` : `Enable ${page.title}`}
          >
            {page.isActive ? (
              <ToggleRight className="h-3.5 w-3.5 mr-1.5 text-green-600" aria-hidden="true" />
            ) : (
              <ToggleLeft className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            )}
            {page.isActive ? 'Disable' : 'Enable'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            aria-label={`Delete ${page.title}`}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
