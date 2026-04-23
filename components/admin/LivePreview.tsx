'use client'

import type { PageFormData, CustomFieldFormData, AmountMode } from '@/types'
import { parseJsonSafe } from '@/lib/utils'

interface LivePreviewProps {
  formData: PageFormData
  customFields: CustomFieldFormData[]
}

export function LivePreview({ formData, customFields }: LivePreviewProps) {
  const brandColor = formData.brandColor || '#FF6900'

  return (
    <div className="h-full overflow-y-auto rounded-lg border bg-white dark:bg-zinc-900">
      <div className="text-xs text-center py-1 bg-brand-gray dark:bg-zinc-800 text-muted-foreground border-b font-medium">
        LIVE PREVIEW
      </div>

      {/* Header */}
      <div className="px-6 py-4" style={{ backgroundColor: brandColor }}>
        {formData.logoUrl ? (
          <img
            src={formData.logoUrl}
            alt="Page logo"
            className="h-8 mb-3 object-contain"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        ) : null}
        <h1 className="text-white text-lg font-bold leading-snug">
          {formData.title || 'Payment Page Title'}
        </h1>
        {formData.description && (
          <p className="text-white/80 text-sm mt-1">{formData.description}</p>
        )}
      </div>

      <div className="px-6 py-4">
        {formData.headerMessage && (
          <div className="mb-4 p-3 rounded-md bg-brand-blue/20 text-sm border border-brand-blue/40">
            {formData.headerMessage}
          </div>
        )}

        {/* Amount */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Payment Amount
          </p>
          {formData.amountMode === 'FIXED' && (
            <p className="text-2xl font-bold" style={{ color: brandColor }}>
              ${formData.fixedAmount || '0.00'}
            </p>
          )}
          {formData.amountMode === 'RANGE' && (
            <div>
              <div className="h-2 rounded-full bg-gray-200 w-full" />
              <p className="text-xs text-muted-foreground mt-1">
                ${formData.minAmount || '0'} – ${formData.maxAmount || '∞'}
              </p>
            </div>
          )}
          {formData.amountMode === 'OPEN' && (
            <div className="h-8 rounded border-2 border-dashed border-gray-300 flex items-center px-2">
              <span className="text-muted-foreground text-sm">Enter amount…</span>
            </div>
          )}
        </div>

        {/* Payer fields */}
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Full Name *</p>
            <div className="h-8 rounded bg-gray-100 dark:bg-zinc-800" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email Address *</p>
            <div className="h-8 rounded bg-gray-100 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Custom fields */}
        {customFields.filter((f) => f.label).map((field, i) => (
          <div key={i} className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </p>
            {field.fieldType === 'CHECKBOX' ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-gray-300" />
                <span className="text-xs text-muted-foreground">{field.label}</span>
              </div>
            ) : field.fieldType === 'DROPDOWN' ? (
              <div className="h-8 rounded bg-gray-100 dark:bg-zinc-800 flex items-center px-2 justify-between">
                <span className="text-xs text-muted-foreground">Select…</span>
                <span className="text-xs">▾</span>
              </div>
            ) : (
              <div className="h-8 rounded bg-gray-100 dark:bg-zinc-800" />
            )}
          </div>
        ))}

        {/* Payment section mock */}
        <div className="mt-4 p-3 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-xs font-semibold text-muted-foreground mb-2">PAYMENT</p>
          <div className="space-y-2">
            <div className="h-8 rounded bg-gray-100 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-4">
          <div
            className="h-10 rounded-md flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: brandColor }}
          >
            Pay Now
          </div>
        </div>

        {formData.footerMessage && (
          <p className="mt-4 text-xs text-center text-muted-foreground">{formData.footerMessage}</p>
        )}
      </div>
    </div>
  )
}
