'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PageForm } from '@/components/admin/PageForm'
import type { PaymentPage } from '@/types'

export default function EditPagePage() {
  const params = useParams()
  const [page, setPage] = useState<PaymentPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/payment-pages/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Page not found')
        return res.json()
      })
      .then(setPage)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [params.id])

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Edit Payment Page" />
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
            <span className="ml-3 text-muted-foreground">Loading page…</span>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-red-600">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              The page you&apos;re looking for doesn&apos;t exist or was deleted.
            </p>
          </div>
        ) : page ? (
          <PageForm mode="edit" initialData={page} />
        ) : null}
      </div>
    </div>
  )
}
