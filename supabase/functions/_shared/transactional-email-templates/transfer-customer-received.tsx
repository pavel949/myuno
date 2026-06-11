import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  title?: string
  orderNumber?: string
  orderLabel?: string
  routeLabel?: string
  routeValue?: string
  dateLabel?: string
  dateValue?: string
  operatorLine?: string
  amountLabel?: string
  amountValue?: string
  subjectText?: string
}

const Email = ({
  title = 'Your transfer request has been received',
  orderNumber = '—',
  orderLabel = 'Booking number',
  routeLabel = 'Route',
  routeValue = '',
  dateLabel = 'Date',
  dateValue = '',
  operatorLine = '',
  amountLabel = 'Total',
  amountValue = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${title} — #${orderNumber}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>{title}</Heading>
        </Section>
        <Section style={card}>
          <Text style={row}><b>{orderLabel}:</b> #{orderNumber}</Text>
          {routeValue ? <Text style={row}><b>{routeLabel}:</b> {routeValue}</Text> : null}
          {dateValue ? <Text style={row}><b>{dateLabel}:</b> {dateValue}</Text> : null}
          {operatorLine ? <Text style={row}>{operatorLine}</Text> : null}
          {amountValue ? <Text style={row}><b>{amountLabel}:</b> {amountValue}</Text> : null}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>myUNO Platform · Phuket, Thailand</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) =>
    (data?.subjectText as string) || `Booking #${(data?.orderNumber as string) || ''} received`,
  displayName: 'Transfer: Booking received (customer)',
  previewData: {
    subjectText: 'Заявка #TR-001 принята — ждём подтверждения оператора',
    title: 'Спасибо! Заявка на трансфер принята',
    orderNumber: 'TR-001',
    orderLabel: 'Номер заявки',
    routeLabel: 'Маршрут',
    routeValue: 'Аэропорт Пхукета → Отель Marriott',
    dateLabel: 'Дата',
    dateValue: '12 июн. 2026 14:30 ICT',
    operatorLine: 'Оператор Klod свяжется с вами в течение ~30 минут для подтверждения.',
    amountLabel: 'Сумма',
    amountValue: '฿2,500',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const header = { padding: '0 0 16px' }
const h1 = { margin: 0, color: '#0A2240', fontSize: '22px', fontWeight: 700 }
const card = { background: '#F7F5F1', padding: '18px', border: '1px solid #e5e7eb' }
const row = { margin: '6px 0', color: '#1C1916', fontSize: '14px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const footer = { color: '#6b7280', fontSize: '12px', textAlign: 'center' as const, margin: 0 }
