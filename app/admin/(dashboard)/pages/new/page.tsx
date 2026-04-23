'use client'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { PageForm } from '@/components/admin/PageForm'

export default function NewPagePage() {
  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Create Payment Page" />
      <div className="flex-1 overflow-y-auto p-6">
        <PageForm mode="create" />
      </div>
    </div>
  )
}
