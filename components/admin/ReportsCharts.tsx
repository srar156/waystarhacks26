'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TransactionSummary } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: '#16a34a',
  FAILED: '#dc2626',
  PENDING: '#d97706',
}

const METHOD_COLORS = ['#FF6900', '#002B5C', '#B9C9FF', '#6B7280']

interface ReportsChartsProps {
  summary: TransactionSummary
}

export function ReportsCharts({ summary }: ReportsChartsProps) {
  const methodData = summary.byPaymentMethod.map((m) => ({
    name: m.method === 'apple_pay' ? 'Apple Pay' : m.method === 'google_pay' ? 'Google Pay' : 'Card',
    value: m.count,
  }))

  const statusData = summary.byStatus.map((s) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#6B7280',
  }))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* GL Code Bar Chart */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Revenue by GL Code</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.byGlCode.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={summary.byGlCode} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="glCode" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#FF6900" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Pie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          {methodData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={methodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {methodData.map((_, index) => (
                    <Cell key={index} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Status Pie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
