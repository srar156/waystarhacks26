'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Loader2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PageCard } from '@/components/admin/PageCard'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import type { PaymentPage } from '@/types'

export default function PagesListPage() {
  const { toast } = useToast()
  const [pages, setPages] = useState<PaymentPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/payment-pages')
      .then((res) => res.json())
      .then(setPages)
      .catch(() => toast({ title: 'Failed to load pages', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/payment-pages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (res.ok) {
        setPages((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive } : p))
        )
        toast({ title: `Page ${isActive ? 'enabled' : 'disabled'}` })
      }
    } catch {
      toast({ title: 'Failed to update page', variant: 'destructive' })
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/payment-pages/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== id))
        toast({ title: 'Page deleted' })
      }
    } catch {
      toast({ title: 'Failed to delete page', variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Payment Pages" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">All Payment Pages</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your payment pages, toggle visibility, and share links.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/pages/new">
              <PlusCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
              New Page
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16 bg-muted/50 rounded-lg border border-dashed">
            <h3 className="text-lg font-semibold mb-2">No payment pages yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first payment page to start collecting payments.
            </p>
            <Button asChild>
              <Link href="/admin/pages/new">
                <PlusCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Create Payment Page
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pages.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
