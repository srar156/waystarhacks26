'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DistributePage } from '@/components/admin/DistributePage'

interface PageInfo {
  title: string
  slug: string
}

export default function DistributePageRoute() {
  const params = useParams()
  const [page, setPage] = useState<PageInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/payment-pages/${params.id}`)
      .then((res) => res.json())
      .then((data) => setPage({ title: data.title, slug: data.slug }))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title={page ? `Distribute: ${page.title}` : 'Distribute'} />
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
          </div>
        ) : page ? (
          <DistributePage slug={page.slug} pageTitle={page.title} />
        ) : (
          <p className="text-center text-muted-foreground py-20">Page not found</p>
        )}
      </div>
    </div>
  )
}
