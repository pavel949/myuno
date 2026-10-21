import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getServiceRequestConfirmationNote } from './serviceRequestCopy';

describe('service request confirmation copy', () => {
  it.each([
    ['ru', 'Цена, время и исполнитель требуют подтверждения после отправки заявки.'],
    ['en', 'Price, time and provider require confirmation after you submit your request.'],
    ['th', 'ราคา เวลา และผู้ให้บริการต้องได้รับการยืนยันหลังจากส่งคำขอ'],
  ])('states pending arrangements without an ETA in %s', (language, expected) => {
    expect(getServiceRequestConfirmationNote(language)).toBe(expected);
    expect(getServiceRequestConfirmationNote(language)).not.toMatch(/30|guarantee|гарант/);
  });
  it('falls back to English for unsupported locales', () => {
    expect(getServiceRequestConfirmationNote('fr')).toBe(getServiceRequestConfirmationNote('en'));
  });
  it.each(['ServiceFunctionOrder', 'ServiceOrderSuccess'])('uses the factual localized note on %s', page => {
    const source = readFileSync(`${process.cwd()}/src/pages/services/${page}.tsx`, 'utf8');
    expect(source).toContain('getServiceRequestConfirmationNote(language)');
    expect(source).not.toMatch(/within 30 minutes|в течение 30 минут/);
  });
});
