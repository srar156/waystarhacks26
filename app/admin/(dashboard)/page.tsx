'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Loader2, RefreshCcw } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { SummaryCards } from '@/components/admin/SummaryCards'
import { TransactionTable } from '@/components/admin/TransactionTable'
import { PageCard } from '@/components/admin/PageCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import type { PaymentPage, Transaction, TransactionSummary } from '@/types'

const emptySummary: TransactionSummary = {
  totalCount: 0,
  totalAmount: 0,
  avgAmount: 0,
  successRate: 0,
  byGlCode: [],
  byPaymentMethod: [],
  byStatus: [],
}

export default function AdminDashboardPage() {
  const { toast } = useToast()
  const [pages, setPages] = useState<PaymentPage[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary>(emptySummary)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    try {
      const [pagesRes, txRes] = await Promise.all([
        fetch('/api/payment-pages'),
        fetch('/api/transactions'),
      ])

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json()
        setPages(pagesData)
      }

      if (txRes.ok) {
        const txData = await txRes.json()
        setTransactions(txData.transactions)
        setSummary(txData.summary)
      }
    } catch (err) {
      toast({ title: 'Failed to load data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
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
      <AdminHeader title="Dashboard" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
            <span className="ml-3 text-muted-foreground">Loading dashboard…</span>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryCards summary={summary} />

            {/* Tabs */}
            <Tabs defaultValue="pages" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="pages">Payment Pages</TabsTrigger>
                  <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Refresh
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/admin/pages/new">
                      <PlusCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      New Page
                    </Link>
                  </Button>
                </div>
              </div>

              <TabsContent value="pages" className="space-y-4">
                {pages.length === 0 ? (
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
              </TabsContent>

              <TabsContent value="transactions">
                <TransactionTable transactions={transactions} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
