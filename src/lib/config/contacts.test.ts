import { describe, expect, it } from 'vitest';
import { COMPANY_CONTACTS, getTelLink, getWhatsAppUrl } from './contacts';

describe('primary customer contact', () => {
  it('routes calls and WhatsApp to the approved Pavel number', () => {
    expect(COMPANY_CONTACTS.phone.raw).toBe('+66954243332');
    expect(getTelLink()).toBe('tel:+66954243332');
    expect(getWhatsAppUrl()).toBe('https://wa.me/66954243332');
    expect(COMPANY_CONTACTS.social.whatsapp).toBe(getWhatsAppUrl());
    expect(new URL(getWhatsAppUrl('Hello & привет')).searchParams.get('text')).toBe('Hello & привет');
  });
  it('identifies Pavel with English and Russian contact languages', () => {
    expect(COMPANY_CONTACTS.contactPerson).toBe('Pavel');
    expect(COMPANY_CONTACTS.contactLanguages).toEqual(['en', 'ru']);
  });
});