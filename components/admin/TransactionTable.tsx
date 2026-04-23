'use client'

import { CheckCircle, XCircle, Clock, CreditCard, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types'

const StatusIcon = {
  SUCCESS: CheckCircle,
  FAILED: XCircle,
  PENDING: Clock,
}

const StatusVariant = {
  SUCCESS: 'success' as const,
  FAILED: 'error' as const,
  PENDING: 'warning' as const,
}

const MethodLabel: Record<string, string> = {
  card: 'Card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
}

interface TransactionTableProps {
  transactions: Transaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No transactions found for the selected filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">Transaction list</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Payer Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Page</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>GL Code</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const Icon = StatusIcon[tx.status as keyof typeof StatusIcon] || Clock
            return (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(tx.createdAt)}
                </TableCell>
                <TableCell className="font-medium">{tx.payerName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{tx.payerEmail}</TableCell>
                <TableCell className="text-sm">
                  {tx.page?.title ?? '—'}
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1.5">
                    {tx.paymentMethod === 'card' ? (
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    )}
                    {MethodLabel[tx.paymentMethod] ?? tx.paymentMethod}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">
                  {tx.glCode || '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={StatusVariant[tx.status as keyof typeof StatusVariant] || 'outline'}
                    className="flex items-center gap-1 w-fit"
                  >
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {tx.status}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
