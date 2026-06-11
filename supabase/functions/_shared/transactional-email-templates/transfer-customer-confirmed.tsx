import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  subjectText?: string
  title?: string
  orderNumber?: string
  greet?: string
  confirmedLine?: string
  meetingPointLabel?: string
  meetingPointName?: string
  meetingPointPhoto?: string
  meetingPointDescription?: string
  meetingPointMapUrl?: string
  operatorContactLabel?: string
  operatorName?: string
  operatorWa?: string
  operatorWaLink?: string
}

const Email = ({
  title = 'Booking confirmed',
  orderNumber = '—',
  greet = '',
  confirmedLine = '',
  meetingPointLabel = '',
  meetingPointName = '',
  meetingPointPhoto = '',
  meetingPointDescription = '',
  meetingPointMapUrl = '',
  operatorContactLabel = '',
  operatorName = '',
  operatorWa = '',
  operatorWaLink = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${title} #${orderNumber}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerBox}>
          <Heading style={h1}>✅ {title}</Heading>
          <Text style={headerSub}>#{orderNumber}</Text>
        </Section>
        <Section style={card}>
          {greet ? <Text style={row}>{greet}</Text> : null}
          {confirmedLine ? <Text style={row}>{confirmedLine}</Text> : null}

          {meetingPointName ? (
            <>
              <Heading as="h3" style={h3}>{meetingPointLabel}</Heading>
              <Text style={rowBold}>{meetingPointName}</Text>
              {meetingPointPhoto ? (
                <Img src={meetingPointPhoto} alt="Meeting point" style={photo} />
              ) : null}
              {meetingPointDescription ? (
                <Section style={infoBox}><Text style={infoText}>{meetingPointDescription}</Text></Section>
              ) : null}
              {meetingPointMapUrl ? (
                <Text style={row}><Link href={meetingPointMapUrl} style={linkStyle}>Google Maps →</Link></Text>
              ) : null}
            </>
          ) : null}

          <Heading as="h3" style={h3}>{operatorContactLabel}</Heading>
          <Text style={rowBold}>{operatorName}</Text>
          {operatorWaLink ? (
            <Text style={row}>
              WhatsApp: <Link href={operatorWaLink} style={linkStyle}>+{operatorWa}</Link>
            </Text>
          ) : null}
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
    (data?.subjectText as string) || `✅ Transfer #${(data?.orderNumber as string) || ''} confirmed`,
  displayName: 'Transfer: Booking confirmed (customer)',
  previewData: {
    subjectText: '✅ Трансфер #TR-001 подтверждён',
    title: 'Бронирование подтверждено',
    orderNumber: 'TR-001',
    greet: 'Здравствуйте, Иван!',
    confirmedLine: 'Оператор Klod подтвердил ваш трансфер. Сумма к оплате: ฿2,500.',
    meetingPointLabel: '📍 Точка встречи',
    meetingPointName: 'Зал прилёта, выход 4',
    meetingPointPhoto: '',
    meetingPointDescription: 'Водитель будет с табличкой myUNO',
    meetingPointMapUrl: 'https://maps.google.com/?q=8.1132,98.3169',
    operatorContactLabel: '📱 Контакт оператора',
    operatorName: 'Klod',
    operatorWa: '66 99 999 9999',
    operatorWaLink: 'https://wa.me/66999999999',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const headerBox = { background: '#059669', padding: '24px', marginBottom: 0 }
const h1 = { margin: 0, color: '#ffffff', fontSize: '22px', fontWeight: 700 as const }
const headerSub = { margin: '6px 0 0', color: '#d1fae5', fontSize: '14px' }
const card = { background: '#ffffff', border: '1px solid #e5e7eb', borderTop: 'none', padding: '20px' }
const h3 = { margin: '18px 0 8px', color: '#0A2240', fontSize: '15px' }
const row = { margin: '6px 0', color: '#1C1916', fontSize: '14px' }
const rowBold = { margin: '6px 0', color: '#1C1916', fontSize: '14px', fontWeight: 700 as const }
const photo = { maxWidth: '100%', margin: '8px 0' } as const
const infoBox = { background: '#fffbeb', padding: '12px', margin: '8px 0' }
const infoText = { margin: 0, color: '#92400e', fontSize: '13px' }
const linkStyle = { color: '#0A2240', textDecoration: 'underline' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const footer = { color: '#6b7280', fontSize: '12px', textAlign: 'center' as const, margin: 0 }
