export type AmountMode = 'FIXED' | 'RANGE' | 'OPEN'
export type FieldType = 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE' | 'CHECKBOX'
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING'

export interface CustomField {
  id: string
  pageId: string
  label: string
  fieldType: FieldType
  options: string[]
  required: boolean
  placeholder: string | null
  displayOrder: number
}

export interface PaymentPage {
  id: string
  slug: string
  title: string
  description: string | null
  brandColor: string
  logoUrl: string | null
  headerMessage: string | null
  footerMessage: string | null
  amountMode: AmountMode
  fixedAmount: number | null
  minAmount: number | null
  maxAmount: number | null
  glCodes: string[]
  isActive: boolean
  emailTemplate: string | null
  createdAt: string
  updatedAt: string
  customFields: CustomField[]
}

export interface FieldResponse {
  id: string
  transactionId: string
  fieldId: string
  value: string
  field?: CustomField
}

export interface Transaction {
  id: string
  pageId: string
  amount: number
  paymentMethod: string
  status: TransactionStatus
  payerEmail: string
  payerName: string
  stripePaymentIntentId: string | null
  glCode: string | null
  createdAt: string
  page?: { title: string; slug: string }
  fieldResponses?: FieldResponse[]
}

export interface TransactionSummary {
  totalCount: number
  totalAmount: number
  avgAmount: number
  successRate: number
  byGlCode: { glCode: string; count: number; amount: number }[]
  byPaymentMethod: { method: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

export interface PageFormData {
  slug: string
  title: string
  description: string
  brandColor: string
  logoUrl: string
  headerMessage: string
  footerMessage: string
  amountMode: AmountMode
  fixedAmount: string
  minAmount: string
  maxAmount: string
  glCodes: string[]
  isActive: boolean
  emailTemplate: string
}

export interface CustomFieldFormData {
  id?: string
  label: string
  fieldType: FieldType
  options: string
  required: boolean
  placeholder: string
  displayOrder: number
}
