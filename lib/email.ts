import nodemailer from 'nodemailer'

interface EmailData {
  to: string
  payerName: string
  amount: number
  transactionId: string
  date: string
  customFields: Record<string, string>
  template?: string | null
}

const defaultTemplate = `Thank you {payerName}! Your payment of $\{amount} has been received. Transaction ID: {transactionId}. Date: {date}`

function buildTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function renderTemplate(template: string, data: EmailData): string {
  const customFieldsText = Object.entries(data.customFields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  return template
    .replace(/\{payerName\}/g, data.payerName)
    .replace(/\{amount\}/g, data.amount.toFixed(2))
    .replace(/\{transactionId\}/g, data.transactionId)
    .replace(/\{date\}/g, data.date)
    .replace(/\{customFields\}/g, customFieldsText)
}

export async function sendConfirmationEmail(data: EmailData): Promise<void> {
  const template = data.template || defaultTemplate
  const body = renderTemplate(template, data)

  const transport = buildTransport()

  if (!transport) {
    console.log('=== EMAIL (SMTP not configured, logging to console) ===')
    console.log(`To: ${data.to}`)
    console.log(`Subject: Payment Confirmation - Transaction ${data.transactionId}`)
    console.log(`Body:\n${body}`)
    console.log('=== END EMAIL ===')
    return
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@quickpay.waystar.com',
    to: data.to,
    subject: `Payment Confirmation - Transaction ${data.transactionId}`,
    text: body,
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap;">${body}</pre>`,
  })
}
