import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.fieldResponse.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.customField.deleteMany()
  await prisma.paymentPage.deleteMany()
  await prisma.adminUser.deleteMany()

  // Create admin user
  const passwordHash = await bcrypt.hash('password123', 12)
  await prisma.adminUser.create({
    data: {
      email: 'admin@quickpay.com',
      passwordHash,
    },
  })
  console.log('Created admin user: admin@quickpay.com')

  // Create Yoga Class page
  const yogaPage = await prisma.paymentPage.create({
    data: {
      slug: 'yoga-class',
      title: 'Yoga Class Payment',
      description: 'Register and pay for your yoga class session.',
      brandColor: '#FF6900',
      logoUrl: 'https://s45903.pcdn.co/wp-content/uploads/2018/12/logo-full.png',
      headerMessage: 'Welcome to our Yoga Class Registration',
      footerMessage: 'Questions? Contact us at yoga@example.com',
      amountMode: 'FIXED',
      fixedAmount: 25.0,
      glCodes: JSON.stringify(['4100-YOGA']),
      isActive: true,
      emailTemplate:
        'Thank you {payerName}! Your yoga class payment of ${amount} has been received. Transaction ID: {transactionId}. Date: {date}. We look forward to seeing you in class!',
    },
  })

  // Create Yoga Class custom fields
  const yogaFields = await Promise.all([
    prisma.customField.create({
      data: {
        pageId: yogaPage.id,
        label: 'Student Name',
        fieldType: 'TEXT',
        required: true,
        placeholder: 'Enter your full name',
        displayOrder: 0,
      },
    }),
    prisma.customField.create({
      data: {
        pageId: yogaPage.id,
        label: 'Class Date',
        fieldType: 'DATE',
        required: true,
        displayOrder: 1,
      },
    }),
    prisma.customField.create({
      data: {
        pageId: yogaPage.id,
        label: 'Membership Type',
        fieldType: 'DROPDOWN',
        options: JSON.stringify(['Monthly', 'Annual']),
        required: true,
        displayOrder: 2,
      },
    }),
    prisma.customField.create({
      data: {
        pageId: yogaPage.id,
        label: 'Special Requests',
        fieldType: 'TEXT',
        required: false,
        placeholder: 'Any special requests or notes',
        displayOrder: 3,
      },
    }),
  ])
  console.log('Created Yoga Class page with custom fields')

  // Create Community Donation page
  const donationPage = await prisma.paymentPage.create({
    data: {
      slug: 'community-donation',
      title: 'Community Donation',
      description: 'Support our community initiatives with a donation of any amount.',
      brandColor: '#FF6900',
      logoUrl: 'https://s45903.pcdn.co/wp-content/uploads/2018/12/logo-full.png',
      headerMessage: 'Your generosity makes a difference',
      footerMessage: 'All donations are tax-deductible. Thank you for your support!',
      amountMode: 'OPEN',
      glCodes: JSON.stringify(['5200-DONATE']),
      isActive: true,
    },
  })

  // Create Donation custom fields
  const donationFields = await Promise.all([
    prisma.customField.create({
      data: {
        pageId: donationPage.id,
        label: 'Donor Name',
        fieldType: 'TEXT',
        required: true,
        placeholder: 'Your name or organization',
        displayOrder: 0,
      },
    }),
    prisma.customField.create({
      data: {
        pageId: donationPage.id,
        label: 'Message',
        fieldType: 'TEXT',
        required: false,
        placeholder: 'Leave a message with your donation (optional)',
        displayOrder: 1,
      },
    }),
  ])
  console.log('Created Community Donation page with custom fields')

  // Seed transactions
  const yogaTransactions = [
    {
      amount: 25.0,
      paymentMethod: 'card',
      status: 'SUCCESS',
      payerEmail: 'john.doe@example.com',
      payerName: 'John Doe',
      stripePaymentIntentId: 'pi_test_yoga_001',
      glCode: '4100-YOGA',
      daysAgo: 3,
      fieldValues: [
        { fieldIndex: 0, value: 'John Doe' },
        { fieldIndex: 1, value: '2024-01-15' },
        { fieldIndex: 2, value: 'Monthly' },
        { fieldIndex: 3, value: 'Please have a mat ready' },
      ],
    },
    {
      amount: 25.0,
      paymentMethod: 'apple_pay',
      status: 'SUCCESS',
      payerEmail: 'jane.smith@example.com',
      payerName: 'Jane Smith',
      stripePaymentIntentId: 'pi_test_yoga_002',
      glCode: '4100-YOGA',
      daysAgo: 7,
      fieldValues: [
        { fieldIndex: 0, value: 'Jane Smith' },
        { fieldIndex: 1, value: '2024-01-11' },
        { fieldIndex: 2, value: 'Annual' },
        { fieldIndex: 3, value: '' },
      ],
    },
    {
      amount: 25.0,
      paymentMethod: 'google_pay',
      status: 'SUCCESS',
      payerEmail: 'bob.johnson@example.com',
      payerName: 'Bob Johnson',
      stripePaymentIntentId: 'pi_test_yoga_003',
      glCode: '4100-YOGA',
      daysAgo: 12,
      fieldValues: [
        { fieldIndex: 0, value: 'Bob Johnson' },
        { fieldIndex: 1, value: '2024-01-06' },
        { fieldIndex: 2, value: 'Monthly' },
        { fieldIndex: 3, value: 'Beginner level please' },
      ],
    },
    {
      amount: 25.0,
      paymentMethod: 'card',
      status: 'FAILED',
      payerEmail: 'alice.brown@example.com',
      payerName: 'Alice Brown',
      stripePaymentIntentId: 'pi_test_yoga_004',
      glCode: '4100-YOGA',
      daysAgo: 15,
      fieldValues: [
        { fieldIndex: 0, value: 'Alice Brown' },
        { fieldIndex: 1, value: '2024-01-03' },
        { fieldIndex: 2, value: 'Monthly' },
        { fieldIndex: 3, value: '' },
      ],
    },
    {
      amount: 25.0,
      paymentMethod: 'card',
      status: 'SUCCESS',
      payerEmail: 'charlie.wilson@example.com',
      payerName: 'Charlie Wilson',
      stripePaymentIntentId: 'pi_test_yoga_005',
      glCode: '4100-YOGA',
      daysAgo: 20,
      fieldValues: [
        { fieldIndex: 0, value: 'Charlie Wilson' },
        { fieldIndex: 1, value: '2023-12-29' },
        { fieldIndex: 2, value: 'Annual' },
        { fieldIndex: 3, value: '' },
      ],
    },
    {
      amount: 25.0,
      paymentMethod: 'card',
      status: 'PENDING',
      payerEmail: 'diana.lee@example.com',
      payerName: 'Diana Lee',
      stripePaymentIntentId: 'pi_test_yoga_006',
      glCode: '4100-YOGA',
      daysAgo: 1,
      fieldValues: [
        { fieldIndex: 0, value: 'Diana Lee' },
        { fieldIndex: 1, value: '2024-01-17' },
        { fieldIndex: 2, value: 'Monthly' },
        { fieldIndex: 3, value: '' },
      ],
    },
  ]

  const donationTransactions = [
    {
      amount: 50.0,
      paymentMethod: 'card',
      status: 'SUCCESS',
      payerEmail: 'emily.chen@example.com',
      payerName: 'Emily Chen',
      stripePaymentIntentId: 'pi_test_donate_001',
      glCode: '5200-DONATE',
      daysAgo: 2,
      fieldValues: [
        { fieldIndex: 0, value: 'Emily Chen' },
        { fieldIndex: 1, value: 'Keep up the great work!' },
      ],
    },
    {
      amount: 100.0,
      paymentMethod: 'apple_pay',
      status: 'SUCCESS',
      payerEmail: 'frank.garcia@example.com',
      payerName: 'Frank Garcia',
      stripePaymentIntentId: 'pi_test_donate_002',
      glCode: '5200-DONATE',
      daysAgo: 5,
      fieldValues: [
        { fieldIndex: 0, value: 'Frank Garcia' },
        { fieldIndex: 1, value: 'Happy to support the community' },
      ],
    },
    {
      amount: 25.0,
      paymentMethod: 'card',
      status: 'SUCCESS',
      payerEmail: 'grace.kim@example.com',
      payerName: 'Grace Kim',
      stripePaymentIntentId: 'pi_test_donate_003',
      glCode: '5200-DONATE',
      daysAgo: 10,
      fieldValues: [
        { fieldIndex: 0, value: 'Grace Kim' },
        { fieldIndex: 1, value: '' },
      ],
    },
    {
      amount: 75.0,
      paymentMethod: 'google_pay',
      status: 'SUCCESS',
      payerEmail: 'henry.park@example.com',
      payerName: 'Henry Park',
      stripePaymentIntentId: 'pi_test_donate_004',
      glCode: '5200-DONATE',
      daysAgo: 18,
      fieldValues: [
        { fieldIndex: 0, value: 'Henry Park' },
        { fieldIndex: 1, value: 'For the youth programs' },
      ],
    },
    {
      amount: 200.0,
      paymentMethod: 'card',
      status: 'PENDING',
      payerEmail: 'iris.johnson@example.com',
      payerName: 'Iris Johnson',
      stripePaymentIntentId: 'pi_test_donate_005',
      glCode: '5200-DONATE',
      daysAgo: 3,
      fieldValues: [
        { fieldIndex: 0, value: 'Iris Johnson' },
        { fieldIndex: 1, value: 'Anonymous donor' },
      ],
    },
    {
      amount: 30.0,
      paymentMethod: 'card',
      status: 'FAILED',
      payerEmail: 'jack.lee@example.com',
      payerName: 'Jack Lee',
      stripePaymentIntentId: 'pi_test_donate_006',
      glCode: '5200-DONATE',
      daysAgo: 25,
      fieldValues: [
        { fieldIndex: 0, value: 'Jack Lee' },
        { fieldIndex: 1, value: '' },
      ],
    },
  ]

  // Create yoga transactions
  for (const txData of yogaTransactions) {
    const tx = await prisma.transaction.create({
      data: {
        pageId: yogaPage.id,
        amount: txData.amount,
        paymentMethod: txData.paymentMethod,
        status: txData.status,
        payerEmail: txData.payerEmail,
        payerName: txData.payerName,
        stripePaymentIntentId: txData.stripePaymentIntentId,
        glCode: txData.glCode,
        createdAt: subDays(new Date(), txData.daysAgo),
      },
    })
    for (const fv of txData.fieldValues) {
      if (fv.value) {
        await prisma.fieldResponse.create({
          data: {
            transactionId: tx.id,
            fieldId: yogaFields[fv.fieldIndex].id,
            value: fv.value,
          },
        })
      }
    }
  }

  // Create donation transactions
  for (const txData of donationTransactions) {
    const tx = await prisma.transaction.create({
      data: {
        pageId: donationPage.id,
        amount: txData.amount,
        paymentMethod: txData.paymentMethod,
        status: txData.status,
        payerEmail: txData.payerEmail,
        payerName: txData.payerName,
        stripePaymentIntentId: txData.stripePaymentIntentId,
        glCode: txData.glCode,
        createdAt: subDays(new Date(), txData.daysAgo),
      },
    })
    for (const fv of txData.fieldValues) {
      if (fv.value) {
        await prisma.fieldResponse.create({
          data: {
            transactionId: tx.id,
            fieldId: donationFields[fv.fieldIndex].id,
            value: fv.value,
          },
        })
      }
    }
  }

  console.log(`Created ${yogaTransactions.length + donationTransactions.length} transactions`)
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
