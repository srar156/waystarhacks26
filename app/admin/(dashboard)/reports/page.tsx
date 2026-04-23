'use client'

import { useEffect, useState } from 'react'
import { Loader2, Download, Filter } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { SummaryCards } from '@/components/admin/SummaryCards'
import { ReportsCharts } from '@/components/admin/ReportsCharts'
import { TransactionTable } from '@/components/admin/TransactionTable'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function ReportsPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary>(emptySummary)
  const [pages, setPages] = useState<PaymentPage[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterPageId, setFilterPageId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  function buildQueryParams() {
    const params = new URLSearchParams()
    if (filterPageId) params.set('pageId', filterPageId)
    if (filterStatus) params.set('status', filterStatus)
    if (filterStartDate) params.set('startDate', filterStartDate)
    if (filterEndDate) params.set('endDate', filterEndDate)
    return params.toString()
  }

  async function fetchData() {
    setLoading(true)
    try {
      const qs = buildQueryParams()
      const [txRes, summaryRes, pagesRes] = await Promise.all([
        fetch(`/api/transactions?${qs}`),
        fetch(`/api/transactions/summary?${qs}`),
        fetch('/api/payment-pages'),
      ])

      if (txRes.ok) {
        const txData = await txRes.json()
        setTransactions(txData.transactions)
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSummary(summaryData)
      }

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json()
        setPages(pagesData)
      }
    } catch {
      toast({ title: 'Failed to load reports', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  function handleApplyFilters() {
    fetchData()
  }

  function handleClearFilters() {
    setFilterPageId('')
    setFilterStatus('')
    setFilterStartDate('')
    setFilterEndDate('')
    // Fetch will be called via effect when state resets, but let's call manually
    setTimeout(fetchData, 0)
  }

  function handleExportCsv() {
    const qs = buildQueryParams()
    window.open(`/api/transactions/export?${qs}`, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Reports" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-orange" aria-hidden="true" />
            <span className="ml-3 text-muted-foreground">Loading reports…</span>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryCards summary={summary} />

            {/* Charts */}
            <ReportsCharts summary={summary} />

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label htmlFor="filter-page">Payment Page</Label>
                    <select
                      id="filter-page"
                      value={filterPageId}
                      onChange={(e) => setFilterPageId(e.target.value)}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">All Pages</option>
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="filter-status">Status</Label>
                    <select
                      id="filter-status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">All Statuses</option>
                      <option value="SUCCESS">Success</option>
                      <option value="FAILED">Failed</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="filter-start">Start Date</Label>
                    <Input
                      id="filter-start"
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="filter-end">End Date</Label>
                    <Input
                      id="filter-end"
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button onClick={handleApplyFilters} size="sm">
                    <Filter className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Apply Filters
                  </Button>
                  <Button onClick={handleClearFilters} variant="outline" size="sm">
                    Clear
                  </Button>
                  <div className="flex-1" />
                  <Button onClick={handleExportCsv} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Transactions</h2>
                <span className="text-sm text-muted-foreground">
                  {transactions.length} result{transactions.length !== 1 ? 's' : ''}
                </span>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-orange" aria-hidden="true" />
                </div>
              ) : (
                <TransactionTable transactions={transactions} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
