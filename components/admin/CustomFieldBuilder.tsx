'use client'

import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { CustomFieldFormData, FieldType } from '@/types'

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DROPDOWN', label: 'Dropdown' },
  { value: 'DATE', label: 'Date' },
  { value: 'CHECKBOX', label: 'Checkbox' },
]

interface CustomFieldBuilderProps {
  fields: CustomFieldFormData[]
  onChange: (fields: CustomFieldFormData[]) => void
}

export function CustomFieldBuilder({ fields, onChange }: CustomFieldBuilderProps) {
  function addField() {
    if (fields.length >= 10) return
    onChange([
      ...fields,
      {
        label: '',
        fieldType: 'TEXT',
        options: '',
        required: false,
        placeholder: '',
        displayOrder: fields.length,
      },
    ])
  }

  function removeField(index: number) {
    const updated = fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, displayOrder: i }))
    onChange(updated)
  }

  function moveField(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= fields.length) return
    const updated = [...fields]
    ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]
    onChange(updated.map((f, i) => ({ ...f, displayOrder: i })))
  }

  function updateField(index: number, updates: Partial<CustomFieldFormData>) {
    const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f))
    onChange(updated)
  }

  return (
    <div>
      <div className="space-y-4" role="list" aria-label="Custom fields">
        {fields.map((field, index) => (
          <div
            key={index}
            role="listitem"
            className="rounded-lg border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Field {index + 1}</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveField(index, 'up')}
                  disabled={index === 0}
                  aria-label={`Move field ${index + 1} up`}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveField(index, 'down')}
                  disabled={index === fields.length - 1}
                  aria-label={`Move field ${index + 1} down`}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeField(index)}
                  aria-label={`Remove field ${index + 1}: ${field.label || 'unnamed'}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={`field-label-${index}`}>
                  Label <span aria-hidden="true" className="text-red-500">*</span>
                </Label>
                <Input
                  id={`field-label-${index}`}
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="Field label"
                  className="mt-1"
                  aria-required="true"
                />
              </div>

              <div>
                <Label htmlFor={`field-type-${index}`}>Field Type</Label>
                <select
                  id={`field-type-${index}`}
                  value={field.fieldType}
                  onChange={(e) => updateField(index, { fieldType: e.target.value as FieldType })}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor={`field-placeholder-${index}`}>Placeholder</Label>
                <Input
                  id={`field-placeholder-${index}`}
                  value={field.placeholder}
                  onChange={(e) => updateField(index, { placeholder: e.target.value })}
                  placeholder="Placeholder text"
                  className="mt-1"
                />
              </div>

              {field.fieldType === 'DROPDOWN' && (
                <div>
                  <Label htmlFor={`field-options-${index}`}>
                    Options <span className="text-xs text-muted-foreground">(comma-separated)</span>
                  </Label>
                  <Input
                    id={`field-options-${index}`}
                    value={field.options}
                    onChange={(e) => updateField(index, { options: e.target.value })}
                    placeholder="Option 1, Option 2, Option 3"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Switch
                id={`field-required-${index}`}
                checked={field.required}
                onCheckedChange={(checked) => updateField(index, { required: checked })}
                aria-describedby={`field-required-desc-${index}`}
              />
              <Label htmlFor={`field-required-${index}`} className="cursor-pointer">
                Required
              </Label>
              <span id={`field-required-desc-${index}`} className="sr-only">
                Toggle whether this field is required
              </span>
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-6 border rounded-lg">
          No custom fields yet. Add one below.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addField}
        disabled={fields.length >= 10}
        className="mt-3"
      >
        <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
        Add Field {fields.length >= 10 ? '(max 10)' : `(${fields.length}/10)`}
      </Button>
    </div>
  )
}
