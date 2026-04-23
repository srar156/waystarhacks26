'use client'

import type { CustomField } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface CustomFieldRendererProps {
  fields: CustomField[]
  values: Record<string, string>
  onChange: (fieldId: string, value: string) => void
  errors?: Record<string, string>
}

export function CustomFieldRenderer({
  fields,
  values,
  onChange,
  errors,
}: CustomFieldRendererProps) {
  const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="space-y-4">
      {sorted.map((field) => {
        const fieldId = field.id
        const value = values[fieldId] || ''
        const error = errors?.[fieldId]

        return (
          <div key={fieldId}>
            {field.fieldType === 'CHECKBOX' ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`custom-${fieldId}`}
                  checked={value === 'true'}
                  onCheckedChange={(checked) =>
                    onChange(fieldId, checked ? 'true' : 'false')
                  }
                  aria-required={field.required}
                  aria-invalid={!!error}
                />
                <Label htmlFor={`custom-${fieldId}`} className="cursor-pointer">
                  {field.label}
                  {field.required && (
                    <span aria-hidden="true" className="text-red-500 ml-0.5">
                      *
                    </span>
                  )}
                </Label>
              </div>
            ) : (
              <>
                <Label htmlFor={`custom-${fieldId}`}>
                  {field.label}
                  {field.required && (
                    <span aria-hidden="true" className="text-red-500 ml-0.5">
                      *
                    </span>
                  )}
                </Label>

                {field.fieldType === 'DROPDOWN' ? (
                  <select
                    id={`custom-${fieldId}`}
                    value={value}
                    onChange={(e) => onChange(fieldId, e.target.value)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-required={field.required}
                    aria-invalid={!!error}
                  >
                    <option value="">Select…</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.fieldType === 'DATE' ? (
                  <Input
                    id={`custom-${fieldId}`}
                    type="date"
                    value={value}
                    onChange={(e) => onChange(fieldId, e.target.value)}
                    className="mt-1"
                    aria-required={field.required}
                    aria-invalid={!!error}
                  />
                ) : field.fieldType === 'NUMBER' ? (
                  <Input
                    id={`custom-${fieldId}`}
                    type="number"
                    value={value}
                    onChange={(e) => onChange(fieldId, e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="mt-1"
                    aria-required={field.required}
                    aria-invalid={!!error}
                  />
                ) : (
                  <Input
                    id={`custom-${fieldId}`}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(fieldId, e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="mt-1"
                    aria-required={field.required}
                    aria-invalid={!!error}
                  />
                )}
              </>
            )}

            {error && (
              <span role="alert" className="text-xs text-red-500 mt-1 block">
                {error}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
