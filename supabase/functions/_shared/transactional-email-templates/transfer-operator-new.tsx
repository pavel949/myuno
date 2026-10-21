import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Attachment {
  url: string
  filename?: string
  kind?: string
}

interface Props {
  orderNumber?: string
  directionLabel?: string
  dateLabel?: string
  flightNumber?: string
  vehicleLine?: string
  pickupRu?: string
  pickupEn?: string
  pickupTh?: string
  dropoffRu?: string
  dropoffEn?: string
  dropoffTh?: string
  notesRu?: string
  notesEn?: string
  notesTh?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerLang?: string
  totalLabel?: string
  paymentMethod?: string
  attachments?: Attachment[]
  confirmUrl?: string
  operatorMissing?: boolean
}

const Email = ({
  orderNumber = '—',
  directionLabel = '',
  dateLabel = '',
  flightNumber = '—',
  vehicleLine = '',
  pickupRu = '',
  pickupEn = '',
  pickupTh = '',
  dropoffRu = '',
  dropoffEn = '',
  dropoffTh = '',
  notesRu = '',
  notesEn = '',
  notesTh = '',
  customerName = '',
  customerPhone = '',
  customerEmail = '',
  customerLang = '',
  totalLabel = '',
  paymentMethod = '',
  attachments = [],
  confirmUrl = '',
  operatorMissing = false,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Transfer #${orderNumber} — ${directionLabel} ${dateLabel}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        {operatorMissing ? (
          <Section style={alert}>
            <Text style={alertText}>🚨 NO ACTIVE OPERATOR — assign manually before customer waits</Text>
          </Section>
        ) : null}
        <Section style={header}>
          <Heading style={h1}>🚗 Transfer #{orderNumber}</Heading>
          <Text style={sub}><b>{directionLabel}</b> · {dateLabel}</Text>
          <Text style={sub}>Flight: {flightNumber} · {vehicleLine}</Text>
        </Section>

        <Section style={card}>
          <Text style={label}>Pickup</Text>
          {pickupRu ? <Text style={value}>🇷🇺 {pickupRu}</Text> : null}
          {pickupEn ? <Text style={value}>🇬🇧 {pickupEn}</Text> : null}
          {pickupTh ? <Text style={value}>🇹🇭 {pickupTh}</Text> : null}
        </Section>

        <Section style={card}>
          <Text style={label}>Drop-off</Text>
          {dropoffRu ? <Text style={value}>🇷🇺 {dropoffRu}</Text> : null}
          {dropoffEn ? <Text style={value}>🇬🇧 {dropoffEn}</Text> : null}
          {dropoffTh ? <Text style={value}>🇹🇭 {dropoffTh}</Text> : null}
        </Section>

        {notesRu || notesEn || notesTh ? (
          <Section style={card}>
            <Text style={label}>Notes</Text>
            {notesRu ? <Text style={value}>🇷🇺 {notesRu}</Text> : null}
            {notesEn ? <Text style={value}>🇬🇧 {notesEn}</Text> : null}
            {notesTh ? <Text style={value}>🇹🇭 {notesTh}</Text> : null}
          </Section>
        ) : null}

        <Section style={card}>
          <Text style={label}>Customer</Text>
          <Text style={value}>{customerName} · {customerPhone} · {customerEmail} · lang={customerLang.toUpperCase()}</Text>
          <Text style={label}>Total</Text>
          <Text style={value}>{totalLabel} ({paymentMethod})</Text>
        </Section>

        {attachments.length ? (
          <Section style={card}>
            <Text style={label}>Attachments</Text>
            {attachments.map((a, i) => (
              <Text key={i} style={value}>
                <Link href={a.url} style={linkStyle}>{a.filename || a.kind || a.url}</Link>
              </Text>
            ))}
          </Section>
        ) : null}

        {confirmUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={confirmUrl} style={btn}>✅ Confirm Booking</Button>
          </Section>
        ) : null}

        <Hr style={hr} />
        <Text style={footer}>myUNO Platform · Phuket, Thailand</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) => {
    const num = (data?.orderNumber as string) || '—'
    const date = (data?.dateLabel as string) || ''
    const prefix = data?.operatorMissing ? '🚨 NO OPERATOR — ' : ''
    return `${prefix}🚗 Transfer #${num} — ${date}`
  },
  displayName: 'Transfer: New booking (operator/admin)',
  previewData: {
    orderNumber: 'TR-001',
    directionLabel: 'Airport → Hotel',
    dateLabel: '12 Jun 2026 14:30 ICT',
    flightNumber: 'TG201',
    vehicleLine: 'Toyota Camry · 3pax · 2 bags',
    pickupRu: 'Аэропорт Пхукета, Терминал T1',
    pickupEn: 'Phuket Airport, Terminal T1',
    pickupTh: 'สนามบินภูเก็ต อาคารผู้โดยสาร T1',
    dropoffRu: 'Отель Marriott, Май Кхао',
    dropoffEn: 'Marriott Hotel, Mai Khao',
    dropoffTh: 'โรงแรม Marriott ไม้ขาว',
    notesRu: '',
    notesEn: '',
    notesTh: '',
    customerName: 'Ivan Petrov',
    customerPhone: '+7 999 000 11 22',
    customerEmail: 'ivan@example.com',
    customerLang: 'ru',
    totalLabel: '฿2,500',
    paymentMethod: 'card',
    attachments: [],
    confirmUrl: 'https://myuno.app/operate/transfers/confirm?id=demo&t=demo',
    operatorMissing: false,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const header = { padding: '0 0 16px' }
const h1 = { margin: 0, color: '#0A2240', fontSize: '22px', fontWeight: 700 }
const sub = { margin: '6px 0 0', color: '#374151', fontSize: '14px' }
const card = { background: '#F7F5F1', padding: '14px 18px', border: '1px solid #e5e7eb', marginBottom: '10px' }
const label = { margin: 0, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const value = { margin: '4px 0 0', color: '#1C1916', fontSize: '14px' }
const alert = { background: '#fee2e2', padding: '14px', marginBottom: '14px' }
const alertText = { margin: 0, color: '#991b1b', fontWeight: 700 as const, fontSize: '14px' }
const btn = { backgroundColor: '#059669', color: '#ffffff', padding: '14px 28px', textDecoration: 'none', fontWeight: 700 as const }
const linkStyle = { color: '#0A2240', textDecoration: 'underline' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const footer = { color: '#6b7280', fontSize: '12px', textAlign: 'center' as const, margin: 0 }
