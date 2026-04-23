# QuickPay by Waystar

A full-stack payment platform built with **Next.js 14**, **Stripe**, **Prisma**, and **NextAuth**. QuickPay enables organizations to create branded, configurable payment pages with custom fields, GL code tracking, and comprehensive reporting.

---

## ✨ Features

- **Admin Dashboard** — Summary metrics, transaction tables, and charts
- **Payment Page Builder** — WYSIWYG-style form with live preview panel
- **Custom Fields** — Text, Number, Dropdown, Date, Checkbox with drag-to-reorder
- **Stripe Payments** — PaymentElement with Apple Pay / Google Pay via Payment Request API
- **Amount Modes** — Fixed, Range (min/max), or Open (payer enters amount)
- **GL Codes** — General Ledger code tagging per transaction for accounting
- **Email Confirmations** — Template-based emails with variable interpolation
- **Distribution Tools** — Direct link, embed code, and QR code generation
- **Dark Mode** — Persisted via `localStorage` with system preference detection
- **Responsive Design** — Mobile-first with sidebar sheet on small screens
- **Accessibility** — ARIA attributes, focus management, keyboard navigation, screen reader labels

---

## 🛠 Tech Stack

| Layer       | Technology                             |
|-------------|----------------------------------------|
| Framework   | Next.js 14 (App Router)                |
| Language    | TypeScript                             |
| Styling     | Tailwind CSS + `tailwindcss-animate`   |
| UI Library  | shadcn/ui (Radix primitives)           |
| Database    | SQLite via Prisma ORM                  |
| Auth        | NextAuth.js (Credentials provider)     |
| Payments    | Stripe (PaymentElement + server-side)  |
| Charts      | Recharts                               |
| Email       | Nodemailer (SMTP or console fallback)  |
| QR Codes    | `qrcode` library                       |
| Icons       | Lucide React                           |

---

## 📦 Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable                            | Required | Description                              | Example                                 |
|-------------------------------------|----------|------------------------------------------|-----------------------------------------|
| `DATABASE_URL`                      | ✅       | Prisma database connection string        | `file:./dev.db`                         |
| `NEXTAUTH_SECRET`                   | ✅       | Secret for JWT signing                   | `your-secret-key-here`                  |
| `NEXTAUTH_URL`                      | ✅       | App base URL                             | `http://localhost:3000`                 |
| `STRIPE_SECRET_KEY`                 | ✅       | Stripe secret key (server-side)          | `sk_test_...`                           |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`| ✅       | Stripe publishable key (client-side)     | `pk_test_...`                           |
| `SMTP_HOST`                         | ❌       | SMTP server hostname                     | `smtp.gmail.com`                        |
| `SMTP_PORT`                         | ❌       | SMTP server port                         | `587`                                   |
| `SMTP_USER`                         | ❌       | SMTP auth username                       | `user@gmail.com`                        |
| `SMTP_PASS`                         | ❌       | SMTP auth password                       | `app-password`                          |
| `SMTP_FROM`                         | ❌       | From address for emails                  | `noreply@quickpay.waystar.com`          |

> **Note:** If SMTP is not configured, confirmation emails are logged to the server console.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to database (creates SQLite file)
npx prisma db push

# 4. Seed demo data
npx prisma db seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🔑 Demo Credentials

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@quickpay.com`|
| Password | `password123`      |

The seed script creates:
- 1 admin user
- 2 payment pages (Yoga Class, Community Donation)
- 12 sample transactions with field responses

---

## 📡 API Documentation

### Authentication

All admin API endpoints require an authenticated session (NextAuth JWT cookie).

### Payment Pages

| Method   | Endpoint                       | Auth   | Description                      |
|----------|--------------------------------|--------|----------------------------------|
| `GET`    | `/api/payment-pages`           | No     | List all payment pages           |
| `POST`   | `/api/payment-pages`           | ✅     | Create a new payment page        |
| `GET`    | `/api/payment-pages/[id]`      | No     | Get page by ID with transactions |
| `PUT`    | `/api/payment-pages/[id]`      | ✅     | Update a payment page            |
| `PATCH`  | `/api/payment-pages/[id]`      | ✅     | Toggle page active status        |
| `DELETE` | `/api/payment-pages/[id]`      | ✅     | Delete a payment page            |
| `GET`    | `/api/pages/slug/[slug]`       | No     | Get page config by slug (public) |

#### POST/PUT Body

```json
{
  "slug": "yoga-class",
  "title": "Yoga Class Payment",
  "description": "Pay for your yoga session",
  "brandColor": "#FF6900",
  "logoUrl": "https://example.com/logo.png",
  "headerMessage": "Welcome!",
  "footerMessage": "Contact us at ...",
  "amountMode": "FIXED",
  "fixedAmount": "25.00",
  "minAmount": "",
  "maxAmount": "",
  "glCodes": ["4100-YOGA"],
  "isActive": true,
  "emailTemplate": "Thank you {payerName}!...",
  "customFields": [
    {
      "label": "Student Name",
      "fieldType": "TEXT",
      "options": [],
      "required": true,
      "placeholder": "Enter name",
      "displayOrder": 0
    }
  ]
}
```

### Transactions

| Method | Endpoint                    | Auth | Description                           |
|--------|-----------------------------|------|---------------------------------------|
| `GET`  | `/api/transactions`         | ✅   | List transactions with summary stats  |
| `GET`  | `/api/transactions/summary` | ✅   | Aggregated stats with filter support  |
| `GET`  | `/api/transactions/export`  | ✅   | Export filtered transactions as CSV   |

**Query Parameters:** `pageId`, `status`, `method`, `startDate`, `endDate`, `limit`, `offset`

### Payments

| Method | Endpoint                       | Auth | Description                          |
|--------|--------------------------------|------|--------------------------------------|
| `POST` | `/api/payments/create-intent`  | No   | Create Stripe PaymentIntent          |
| `POST` | `/api/payments/confirm`        | No   | Save transaction + send email        |
| `POST` | `/api/stripe/create-intent`    | No   | Combined create + confirm (alt flow) |

#### POST /api/payments/create-intent Body

```json
{
  "pageId": "clq...",
  "amount": 25.00
}
```

#### POST /api/payments/confirm Body

```json
{
  "pageId": "clq...",
  "amount": 25.00,
  "payerName": "John Doe",
  "payerEmail": "john@example.com",
  "stripePaymentIntentId": "pi_...",
  "paymentMethod": "card",
  "glCode": "4100-YOGA",
  "fieldResponses": [
    { "fieldId": "clq...", "value": "John Doe" }
  ]
}
```

---

## 🗄 Database Schema

```
AdminUser
├── id (cuid)
├── email (unique)
├── passwordHash
└── createdAt

PaymentPage
├── id (cuid)
├── slug (unique)
├── title, description
├── brandColor, logoUrl
├── headerMessage, footerMessage
├── amountMode (FIXED | RANGE | OPEN)
├── fixedAmount, minAmount, maxAmount
├── glCodes (JSON string array)
├── isActive
├── emailTemplate
├── createdAt, updatedAt
├── customFields → CustomField[]
└── transactions → Transaction[]

CustomField
├── id, pageId (FK → PaymentPage, cascade delete)
├── label, fieldType (TEXT|NUMBER|DROPDOWN|DATE|CHECKBOX)
├── options (JSON), required, placeholder
├── displayOrder
└── fieldResponses → FieldResponse[]

Transaction
├── id, pageId (FK → PaymentPage)
├── amount (Decimal), paymentMethod, status
├── payerEmail, payerName
├── stripePaymentIntentId, glCode
├── createdAt
└── fieldResponses → FieldResponse[]

FieldResponse
├── id
├── transactionId (FK → Transaction, cascade delete)
├── fieldId (FK → CustomField)
└── value (string)
```

---

## 🌐 Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "QuickPay full-stack app"
git push origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set **Framework Preset** to **Next.js**

### 3. Environment Variables

Add all variables from the table above in **Settings → Environment Variables**.

> **Important:** For production, replace `DATABASE_URL` with a hosted PostgreSQL connection string (e.g., Supabase, Neon, PlanetScale). Update `prisma/schema.prisma` provider from `sqlite` to `postgresql`.

### 4. Build Settings

| Setting        | Value                                 |
|----------------|---------------------------------------|
| Build Command  | `npx prisma generate && next build`   |
| Output Dir     | `.next`                               |
| Install Command| `npm install --legacy-peer-deps`      |

### 5. Post-Deploy

```bash
# Run migrations on production
npx prisma db push

# Seed production data (optional)
npx prisma db seed
```

---

## 💳 Payment Processor

**Stripe** was chosen as the payment processor for the following reasons:

- **Best sandbox tooling** — Stripe's test mode provides realistic test card numbers and instant feedback, making development and demo easy
- **Stripe Elements** — Pre-built, PCI-compliant UI components that handle card input securely without sensitive data touching our server
- **Payment Request API** — Native support for Apple Pay and Google Pay through `PaymentRequestButtonElement`, automatically detecting digital wallet availability
- **Server-side PaymentIntents** — Secure server-to-server payment confirmation with amount validation before charging

---

## 📂 Project Structure

```
├── app/
│   ├── admin/
│   │   ├── login/page.tsx                # Login page
│   │   └── (dashboard)/
│   │       ├── layout.tsx                # Sidebar layout
│   │       ├── page.tsx                  # Dashboard
│   │       ├── pages/
│   │       │   ├── page.tsx              # All pages list
│   │       │   ├── new/page.tsx          # Create page
│   │       │   └── [id]/
│   │       │       ├── edit/page.tsx     # Edit page
│   │       │       └── distribute/page.tsx
│   │       └── reports/page.tsx          # Reports + filters + CSV export
│   ├── pay/[slug]/page.tsx               # Public payment page
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── pages/slug/[slug]/route.ts    # Public: get page by slug
│   │   ├── payment-pages/
│   │   │   ├── route.ts                  # List / Create
│   │   │   └── [id]/route.ts            # Get / Update / Delete / Toggle
│   │   ├── payments/
│   │   │   ├── create-intent/route.ts    # Create Stripe PaymentIntent
│   │   │   └── confirm/route.ts          # Save transaction + email
│   │   ├── transactions/
│   │   │   ├── route.ts                  # List with filters + pagination
│   │   │   ├── summary/route.ts          # Aggregated stats
│   │   │   └── export/route.ts           # CSV export
│   │   └── stripe/create-intent/route.ts # Combined create + confirm
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                          # Redirects to /admin
├── components/
│   ├── admin/                            # Admin UI components
│   │   ├── AdminHeader.tsx               # Header with dark mode toggle
│   │   ├── AdminSidebar.tsx              # Nav with Waystar logo
│   │   ├── CustomFieldBuilder.tsx        # Add/remove/reorder fields
│   │   ├── DistributePage.tsx            # URL, embed, QR code
│   │   ├── LivePreview.tsx               # Real-time page preview
│   │   ├── PageCard.tsx                  # Payment page card
│   │   ├── PageForm.tsx                  # Full page config form
│   │   ├── ReportsCharts.tsx             # Recharts visualizations
│   │   ├── SummaryCards.tsx              # Dashboard metrics
│   │   ├── ThemeToggle.tsx               # Dark/light mode toggle
│   │   └── TransactionTable.tsx          # Transaction data table
│   ├── payment/                          # Public payment components
│   │   ├── CustomFieldRenderer.tsx       # Dynamic field rendering
│   │   ├── PaymentForm.tsx               # Stripe Elements + PR Button
│   │   ├── PaymentSuccess.tsx            # Success confirmation screen
│   │   └── StripeWrapper.tsx             # Stripe Elements provider
│   └── ui/                              # shadcn/ui components (17 files)
├── lib/
│   ├── auth.ts                           # NextAuth config
│   ├── email.ts                          # Nodemailer + templates
│   ├── prisma.ts                         # Prisma client singleton
│   ├── stripe.ts                         # Stripe client
│   └── utils.ts                          # Helpers (cn, format, slugify)
├── prisma/
│   ├── schema.prisma                     # Database schema
│   └── seed.ts                           # Demo data seed
├── types/index.ts                        # TypeScript interfaces
└── middleware.ts                         # NextAuth route protection
```

---

## ♿ Accessibility (WCAG 2.1 AA)

- **Labels:** Every `<input>`, `<select>`, and `<textarea>` has a visible `<label>` with matching `htmlFor`/`id`
- **Fieldset/Legend:** Form sections grouped with `<fieldset>` and `<legend>` ("Your Information", "Payment Amount", "Payment Information")
- **Error Handling:** Error messages use `role="alert"`, linked to inputs via `aria-describedby`, with unique IDs per field
- **Aria-live Region:** `aria-live="polite"` region announces form validation errors to screen readers
- **Required Fields:** `aria-required="true"` on required inputs, visual asterisk with `aria-hidden="true"`
- **Invalid State:** `aria-invalid="true"` set on fields with validation errors
- **Focus Management:** Focus moves to success/error result container after form submission; first error field focused on validation failure
- **Skip Navigation:** "Skip to payment form" link at top of public payment page
- **Keyboard Navigation:** All interactive elements reachable via Tab, logical tab order, Enter/Space activates buttons
- **Focus Indicators:** `ring-2 ring-offset-2` visible focus rings on all focusable elements
- **Semantic HTML:** Proper heading hierarchy (h1 > h2 > h3), `<header>`, `<main>`, `<footer>`, `<nav>` landmarks
- **Status Indicators:** Transaction status uses text label + icon + color (never color alone)
- **Image Alt Text:** All images have descriptive `alt` text; decorative icons use `aria-hidden="true"`
- **Color Contrast:** Orange #FF6900 used for large text/buttons (meets 3:1); body text Dark #1A1A2E on white meets 4.5:1
- **`aria-current="page"`:** Active navigation items marked for screen readers

---

## ⚠️ Known Limitations & Future Improvements

### Current Limitations

1. **SQLite in development** — Not suitable for production concurrent access. Switch to PostgreSQL for deployment.
2. **No webhook handler** — Stripe webhooks for async payment status updates are not implemented. Payments are confirmed server-side synchronously.
3. **No file uploads** — Logo URLs must be externally hosted; no built-in image upload.
4. **Single admin model** — No role-based access control or multi-tenant support.
5. **Basic pagination** — Transaction list uses limit/offset. Large datasets would benefit from cursor-based pagination.
6. **Email delivery** — Without SMTP config, emails are console-logged only.
7. **No rate limiting** — API endpoints lack rate limiting; add middleware for production.
8. **Stripe test mode** — Uses test keys by default. Replace with live keys for real payments.

### Future Improvements

- Stripe webhook integration for reliable payment status tracking
- Image upload for logos (S3/Cloudflare R2)
- Role-based admin access (admin, viewer, editor)
- Recurring payment support
- Multi-currency support
- Audit log for admin actions
- Real-time dashboard updates via WebSocket/SSE
- Advanced PDF receipt generation
- A/B testing for payment page variants

---

## 📜 License

MIT © Waystar


### Authentication

All admin API endpoints require an authenticated session (NextAuth JWT cookie).

### Payment Pages

| Method   | Endpoint                       | Auth   | Description                     |
|----------|--------------------------------|--------|---------------------------------|
| `GET`    | `/api/payment-pages`           | No     | List all payment pages          |
| `POST`   | `/api/payment-pages`           | ✅     | Create a new payment page       |
| `GET`    | `/api/payment-pages/[id]`      | No     | Get page by ID with transactions|
| `PUT`    | `/api/payment-pages/[id]`      | ✅     | Update a payment page           |
| `PATCH`  | `/api/payment-pages/[id]`      | ✅     | Toggle page active status       |
| `DELETE` | `/api/payment-pages/[id]`      | ✅     | Delete a payment page           |

#### POST/PUT Body

```json
{
  "slug": "yoga-class",
  "title": "Yoga Class Payment",
  "description": "Pay for your yoga session",
  "brandColor": "#FF6900",
  "logoUrl": "https://example.com/logo.png",
  "headerMessage": "Welcome!",
  "footerMessage": "Contact us at ...",
  "amountMode": "FIXED",
  "fixedAmount": "25.00",
  "minAmount": "",
  "maxAmount": "",
  "glCodes": ["4100-YOGA"],
  "isActive": true,
  "emailTemplate": "Thank you {payerName}!...",
  "customFields": [
    {
      "label": "Student Name",
      "fieldType": "TEXT",
      "options": [],
      "required": true,
      "placeholder": "Enter name",
      "displayOrder": 0
    }
  ]
}
```

### Transactions

| Method | Endpoint             | Auth | Description                          |
|--------|----------------------|------|--------------------------------------|
| `GET`  | `/api/transactions`  | ✅   | List transactions with summary stats |

**Query Parameters:** `pageId`, `status`, `method`, `limit`

### Stripe Payment

| Method | Endpoint                    | Auth | Description                     |
|--------|-----------------------------|------|---------------------------------|
| `POST` | `/api/stripe/create-intent` | No   | Create PaymentIntent and charge |

#### POST Body

```json
{
  "pageId": "clq...",
  "amount": 25.00,
  "payerName": "John Doe",
  "payerEmail": "john@example.com",
  "paymentMethodId": "pm_...",
  "paymentMethod": "card",
  "glCode": "4100-YOGA",
  "fieldResponses": [
    { "fieldId": "clq...", "value": "John Doe" }
  ]
}
```

---

## 🗄 Database Schema

```
AdminUser
├── id (cuid)
├── email (unique)
├── passwordHash
└── createdAt

PaymentPage
├── id (cuid)
├── slug (unique)
├── title, description
├── brandColor, logoUrl
├── headerMessage, footerMessage
├── amountMode (FIXED | RANGE | OPEN)
├── fixedAmount, minAmount, maxAmount
├── glCodes (JSON string array)
├── isActive
├── emailTemplate
├── createdAt, updatedAt
├── customFields → CustomField[]
└── transactions → Transaction[]

CustomField
├── id, pageId (FK)
├── label, fieldType (TEXT|NUMBER|DROPDOWN|DATE|CHECKBOX)
├── options (JSON), required, placeholder
├── displayOrder
└── fieldResponses → FieldResponse[]

Transaction
├── id, pageId (FK)
├── amount, paymentMethod, status
├── payerEmail, payerName
├── stripePaymentIntentId, glCode
├── createdAt
└── fieldResponses → FieldResponse[]

FieldResponse
├── id, transactionId (FK), fieldId (FK)
└── value
```

---

## 🌐 Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "QuickPay full-stack app"
git push origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set **Framework Preset** to **Next.js**

### 3. Environment Variables

Add all variables from the table above in **Settings → Environment Variables**.

> **Important:** For production, replace `DATABASE_URL` with a hosted PostgreSQL connection string (e.g., Supabase, Neon, PlanetScale). Update `prisma/schema.prisma` provider from `sqlite` to `postgresql`.

### 4. Build Settings

| Setting        | Value           |
|----------------|-----------------|
| Build Command  | `npx prisma generate && next build` |
| Output Dir     | `.next`         |
| Install Command| `npm install`   |

### 5. Post-Deploy

```bash
# Run migrations on production
npx prisma db push

# Seed production data (optional)
npx prisma db seed
```

---

## 📂 Project Structure

```
├── app/
│   ├── admin/
│   │   ├── login/page.tsx              # Login page
│   │   └── (dashboard)/
│   │       ├── layout.tsx              # Sidebar layout
│   │       ├── page.tsx                # Dashboard
│   │       ├── pages/
│   │       │   ├── page.tsx            # All pages list
│   │       │   ├── new/page.tsx        # Create page
│   │       │   └── [id]/
│   │       │       ├── edit/page.tsx   # Edit page
│   │       │       └── distribute/page.tsx
│   │       └── reports/page.tsx        # Reports + charts
│   ├── pay/[slug]/page.tsx             # Public payment page
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── payment-pages/
│   │   │   ├── route.ts               # List / Create
│   │   │   └── [id]/route.ts          # Get / Update / Delete
│   │   ├── transactions/route.ts       # Transaction list + summary
│   │   └── stripe/create-intent/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                        # Redirects to /admin
├── components/
│   ├── admin/                          # Admin UI components
│   ├── payment/                        # Public payment components
│   └── ui/                             # shadcn/ui components
├── lib/
│   ├── auth.ts                         # NextAuth config
│   ├── email.ts                        # Nodemailer + templates
│   ├── prisma.ts                       # Prisma client singleton
│   ├── stripe.ts                       # Stripe client
│   └── utils.ts                        # Helpers
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/index.ts                      # TypeScript interfaces
└── middleware.ts                        # Auth middleware
```

---

## ♿ Accessibility Notes

- All form inputs have associated `<label>` elements
- Error messages use `role="alert"` for screen reader announcements
- Interactive elements have `aria-label` descriptions
- Color contrast meets WCAG 2.1 AA standards in both themes
- Keyboard navigation supported for all interactive elements
- Focus management on form validation errors
- Skip-to-content patterns via semantic HTML structure
- `aria-current="page"` on active navigation items

---

## ⚠️ Limitations

1. **SQLite in development** — Not suitable for production concurrent access. Switch to PostgreSQL for deployment.
2. **No webhook handler** — Stripe webhooks for async payment status updates are not implemented. All payments are confirmed server-side synchronously.
3. **No file uploads** — Logo URLs must be externally hosted; no built-in image upload.
4. **Single admin model** — No role-based access control or multi-tenant support.
5. **No pagination** — Transaction list loads all records (capped at 100). Large datasets may need cursor-based pagination.
6. **Email delivery** — Without SMTP config, emails are console-logged only.
7. **No rate limiting** — API endpoints lack rate limiting; add middleware for production.
8. **Stripe test mode** — Uses test keys by default. Replace with live keys for real payments.

---

## 📜 License

MIT © Waystar
