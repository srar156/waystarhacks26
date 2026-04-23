'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomFieldBuilder } from './CustomFieldBuilder'
import { LivePreview } from './LivePreview'
import { useToast } from '@/components/ui/use-toast'
import type { PaymentPage, PageFormData, CustomFieldFormData, AmountMode } from '@/types'

const DEFAULT_EMAIL_TEMPLATE = `Thank you {payerName}! Your payment of $\{amount} has been received.
Transaction ID: {transactionId}
Date: {date}

{customFields}`

interface PageFormProps {
  initialData?: PaymentPage
  mode: 'create' | 'edit'
}

export function PageForm({ initialData, mode }: PageFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<PageFormData>({
    slug: initialData?.slug ?? '',
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    brandColor: initialData?.brandColor ?? '#FF6900',
    logoUrl: initialData?.logoUrl ?? '',
    headerMessage: initialData?.headerMessage ?? '',
    footerMessage: initialData?.footerMessage ?? '',
    amountMode: (initialData?.amountMode as AmountMode) ?? 'OPEN',
    fixedAmount: initialData?.fixedAmount?.toString() ?? '',
    minAmount: initialData?.minAmount?.toString() ?? '',
    maxAmount: initialData?.maxAmount?.toString() ?? '',
    glCodes: initialData?.glCodes ?? [],
    isActive: initialData?.isActive ?? true,
    emailTemplate: initialData?.emailTemplate ?? DEFAULT_EMAIL_TEMPLATE,
  })

  const [customFields, setCustomFields] = useState<CustomFieldFormData[]>(
    initialData?.customFields.map((f) => ({
      id: f.id,
      label: f.label,
      fieldType: f.fieldType,
      options: f.options.join(', '),
      required: f.required,
      placeholder: f.placeholder ?? '',
      displayOrder: f.displayOrder,
    })) ?? []
  )

  const [newGlCode, setNewGlCode] = useState('')

  const update = useCallback((field: keyof PageFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  function addGlCode() {
    const code = newGlCode.trim()
    if (!code) return
    if (formData.glCodes.includes(code)) {
      toast({ title: 'GL code already exists', variant: 'destructive' })
      return
    }
    update('glCodes', [...formData.glCodes, code])
    setNewGlCode('')
  }

  function removeGlCode(code: string) {
    update('glCodes', formData.glCodes.filter((c) => c !== code))
  }

  function insertVariable(variable: string) {
    const textarea = document.getElementById('email-template') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = formData.emailTemplate
    const updated = current.substring(0, start) + variable + current.substring(end)
    update('emailTemplate', updated)
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length
      textarea.focus()
    }, 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required'
    else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must be lowercase letters, numbers, and hyphens only'
    }
    if (formData.amountMode === 'FIXED' && !formData.fixedAmount) {
      newErrors.fixedAmount = 'Fixed amount is required'
    }
    if (formData.amountMode === 'RANGE') {
      if (!formData.minAmount) newErrors.minAmount = 'Min amount is required'
      if (!formData.maxAmount) newErrors.maxAmount = 'Max amount is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstErrorKey = Object.keys(newErrors)[0]
      const el = document.getElementById(firstErrorKey)
      el?.focus()
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        customFields: customFields.map((f) => ({
          ...f,
          options: f.options
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean),
        })),
      }

      const url = mode === 'create' ? '/api/payment-pages' : `/api/payment-pages/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save page')
      }

      toast({ title: mode === 'create' ? 'Page created!' : 'Page updated!' })
      router.push('/admin')
      router.refresh()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Form */}
      <div className="flex-1 min-w-0">
        <form onSubmit={handleSubmit} noValidate aria-label="Payment page configuration">
          <div className="space-y-6">

            {/* Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="title">
                      Page Title <span aria-hidden="true" className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => update('title', e.target.value)}
                      placeholder="e.g. Yoga Class Payment"
                      className="mt-1"
                      aria-required="true"
                      aria-invalid={!!errors.title}
                      aria-describedby={errors.title ? 'title-error' : undefined}
                    />
                    {errors.title && (
                      <span id="title-error" role="alert" className="text-xs text-red-500 mt-1 block">
                        {errors.title}
                      </span>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="slug">
                      URL Slug <span aria-hidden="true" className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-muted-foreground shrink-0">/pay/</span>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => update('slug', e.target.value.toLowerCase())}
                        placeholder="yoga-class"
                        aria-required="true"
                        aria-invalid={!!errors.slug}
                        aria-describedby={errors.slug ? 'slug-error' : 'slug-hint'}
                        disabled={mode === 'edit'}
                      />
                    </div>
                    <span id="slug-hint" className="text-xs text-muted-foreground mt-0.5 block">
                      Lowercase letters, numbers, hyphens only
                    </span>
                    {errors.slug && (
                      <span id="slug-error" role="alert" className="text-xs text-red-500 block">
                        {errors.slug}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Brief description shown to payers"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) => update('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="mt-1"
                      type="url"
                    />
                    {formData.logoUrl && (
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="mt-2 h-10 object-contain rounded border"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="brandColor">Brand Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="brandColor"
                        type="color"
                        value={formData.brandColor}
                        onChange={(e) => update('brandColor', e.target.value)}
                        className="h-10 w-16 rounded border cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange"
                        aria-describedby="brandColor-value"
                      />
                      <Input
                        id="brandColor-value"
                        value={formData.brandColor}
                        onChange={(e) => update('brandColor', e.target.value)}
                        placeholder="#FF6900"
                        className="flex-1 font-mono"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="headerMessage">Header Message</Label>
                    <Textarea
                      id="headerMessage"
                      value={formData.headerMessage}
                      onChange={(e) => update('headerMessage', e.target.value)}
                      placeholder="Welcome message shown at top"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="footerMessage">Footer Message</Label>
                    <Textarea
                      id="footerMessage"
                      value={formData.footerMessage}
                      onChange={(e) => update('footerMessage', e.target.value)}
                      placeholder="Contact info, disclaimer, etc."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(v) => update('isActive', v)}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Page is active (visible to payers)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Amount Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Amount Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <fieldset>
                  <legend className="text-sm font-medium mb-3">Amount Mode</legend>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {(['FIXED', 'RANGE', 'OPEN'] as AmountMode[]).map((mode) => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="amountMode"
                          value={mode}
                          checked={formData.amountMode === mode}
                          onChange={() => update('amountMode', mode)}
                          className="focus:ring-2 focus:ring-brand-orange"
                        />
                        <span className="text-sm">{mode.charAt(0) + mode.slice(1).toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {formData.amountMode === 'FIXED' && (
                  <div>
                    <Label htmlFor="fixedAmount">
                      Fixed Amount ($) <span aria-hidden="true" className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fixedAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.fixedAmount}
                      onChange={(e) => update('fixedAmount', e.target.value)}
                      placeholder="25.00"
                      className="mt-1 max-w-xs"
                      aria-required="true"
                      aria-invalid={!!errors.fixedAmount}
                      aria-describedby={errors.fixedAmount ? 'fixedAmount-error' : undefined}
                    />
                    {errors.fixedAmount && (
                      <span id="fixedAmount-error" role="alert" className="text-xs text-red-500 mt-1 block">
                        {errors.fixedAmount}
                      </span>
                    )}
                  </div>
                )}

                {formData.amountMode === 'RANGE' && (
                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <div>
                      <Label htmlFor="minAmount">
                        Min ($) <span aria-hidden="true" className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="minAmount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.minAmount}
                        onChange={(e) => update('minAmount', e.target.value)}
                        placeholder="10.00"
                        className="mt-1"
                        aria-required="true"
                        aria-invalid={!!errors.minAmount}
                      />
                      {errors.minAmount && (
                        <span role="alert" className="text-xs text-red-500 mt-1 block">{errors.minAmount}</span>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="maxAmount">
                        Max ($) <span aria-hidden="true" className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="maxAmount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.maxAmount}
                        onChange={(e) => update('maxAmount', e.target.value)}
                        placeholder="500.00"
                        className="mt-1"
                        aria-required="true"
                        aria-invalid={!!errors.maxAmount}
                      />
                      {errors.maxAmount && (
                        <span role="alert" className="text-xs text-red-500 mt-1 block">{errors.maxAmount}</span>
                      )}
                    </div>
                  </div>
                )}

                {formData.amountMode === 'OPEN' && (
                  <p className="text-sm text-muted-foreground">
                    Payers can enter any amount (minimum $1.00).
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Custom Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Custom Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomFieldBuilder fields={customFields} onChange={setCustomFields} />
              </CardContent>
            </Card>

            {/* GL Codes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GL Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Add GL (General Ledger) codes for accounting purposes. At least one recommended.
                </p>
                <div className="flex gap-2 mb-3">
                  <Label htmlFor="newGlCode" className="sr-only">New GL code</Label>
                  <Input
                    id="newGlCode"
                    value={newGlCode}
                    onChange={(e) => setNewGlCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGlCode())}
                    placeholder="e.g. 4100-YOGA"
                    className="max-w-xs font-mono"
                    aria-label="Add GL code"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addGlCode}>
                    <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                    Add
                  </Button>
                </div>
                {formData.glCodes.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label="GL codes">
                    {formData.glCodes.map((code) => (
                      <li key={code} className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-sm font-mono">
                        {code}
                        <button
                          type="button"
                          onClick={() => removeGlCode(code)}
                          className="ml-1 hover:text-red-500 focus:outline-none focus:ring-1 focus:ring-brand-orange rounded"
                          aria-label={`Remove GL code ${code}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Email Template */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Confirmation Template</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 flex items-start gap-1.5">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  Customize the email sent to payers after payment. Insert variables with the buttons below.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['{payerName}', '{amount}', '{transactionId}', '{date}', '{customFields}'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="rounded-md border bg-muted px-2 py-0.5 text-xs font-mono hover:bg-accent focus:outline-none focus:ring-2 focus:ring-brand-orange"
                      aria-label={`Insert variable ${v}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <Label htmlFor="email-template">Email body</Label>
                <Textarea
                  id="email-template"
                  value={formData.emailTemplate}
                  onChange={(e) => update('emailTemplate', e.target.value)}
                  className="mt-1 font-mono text-sm"
                  rows={6}
                  placeholder={DEFAULT_EMAIL_TEMPLATE}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pb-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : mode === 'create' ? 'Create Page' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Live Preview */}
      <div className="hidden lg:block w-80 xl:w-96 sticky top-6 h-[calc(100vh-6rem)]">
        <p className="text-sm font-medium text-muted-foreground mb-2">Live Preview</p>
        <LivePreview formData={formData} customFields={customFields} />
      </div>
    </div>
  )
}
