import { DollarSign, TrendingUp, BarChart2, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { TransactionSummary } from '@/types'

interface SummaryCardsProps {
  summary: TransactionSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Transactions',
      value: summary.totalCount.toString(),
      icon: BarChart2,
      color: 'text-brand-navy',
      bg: 'bg-brand-navy/10',
    },
    {
      label: 'Total Collected',
      value: formatCurrency(summary.totalAmount),
      icon: DollarSign,
      color: 'text-green-700',
      bg: 'bg-green-100',
    },
    {
      label: 'Average Payment',
      value: formatCurrency(summary.avgAmount),
      icon: TrendingUp,
      color: 'text-brand-orange',
      bg: 'bg-brand-orange/10',
    },
    {
      label: 'Success Rate',
      value: `${summary.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-700',
      bg: 'bg-green-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} role="listitem">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
