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
  Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Section {
  label: string
  value: string
}

interface Props {
  title?: string
  subtitle?: string
  sections?: Section[]
  ctaText?: string
  ctaUrl?: string
}

const Email = ({
  title = 'New onboarding completed',
  subtitle = '',
  sections = [],
  ctaText,
  ctaUrl,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title}{subtitle ? ` — ${subtitle}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>{title}</Heading>
          {subtitle ? <Text style={sub}>{subtitle}</Text> : null}
        </Section>
        <Section style={card}>
          {sections.map((s) => (
            <div key={s.label} style={row}>
              <Text style={rowLabel}>{s.label}</Text>
              <Text style={rowValue}>{s.value}</Text>
            </div>
          ))}
        </Section>
        {ctaText && ctaUrl ? (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={ctaUrl} style={btn}>{ctaText}</Button>
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
  subject: (data: Record<string, unknown>) =>
    (data?.title as string) ?? 'New onboarding completed',
  displayName: 'Admin: Onboarding notification',
  previewData: {
    title: 'New onboarding completed',
    subtitle: 'Investor · Invest · 12 months +',
    sections: [
      { label: 'Persona', value: 'Investor' },
      { label: 'Goal', value: 'Invest' },
      { label: 'Timeframe', value: '12 months +' },
      { label: 'Email', value: 'qa@myuno.app' },
    ],
    ctaText: 'Open admin CRM',
    ctaUrl: 'https://myuno.app/admin/crm/leads',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px' }
const header = { padding: '0 0 16px' }
const h1 = { margin: 0, color: '#0A2240', fontSize: '22px', fontWeight: 700 }
const sub = { margin: '6px 0 0', color: '#6b7280', fontSize: '14px' }
const card = { background: '#F7F5F1', padding: '18px', border: '1px solid #e5e7eb' }
const row = { marginBottom: '10px' }
const rowLabel = { margin: 0, color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const rowValue = { margin: '2px 0 0', color: '#1C1916', fontSize: '15px' }
const btn = { backgroundColor: '#0A2240', color: '#ffffff', padding: '12px 24px', textDecoration: 'none', fontWeight: 700 }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const footer = { color: '#6b7280', fontSize: '12px', textAlign: 'center' as const, margin: 0 }
