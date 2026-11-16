import { beforeEach, describe, expect, it } from 'vitest';
import { clearServiceRequestDraft, saveServiceRequestDraft, takeServiceRequestDraft, type ServiceRequestDraft } from './serviceRequestDraft';

const draft: ServiceRequestDraft = {
  name: 'Synthetic Guest',
  phone: '+66 000 000 000',
  address: 'Synthetic address',
  preferredDate: '2026-12-01',
  preferredTime: 'morning',
  problemDescription: 'Leaking tap',
  contactMethod: 'whatsapp',
};

describe('service request draft', () => {
  beforeEach(() => sessionStorage.clear());

  it('restores the saved form once and then forgets it', () => {
    saveServiceRequestDraft('ac-repair', draft);
    expect(takeServiceRequestDraft('ac-repair')).toEqual(draft);
    expect(takeServiceRequestDraft('ac-repair')).toBeNull();
  });

  it('keeps drafts of different services apart', () => {
    saveServiceRequestDraft('ac-repair', draft);
    expect(takeServiceRequestDraft('cleaning')).toBeNull();
    expect(takeServiceRequestDraft('ac-repair')).toEqual(draft);
  });

  it('ignores malformed or incomplete stored data', () => {
    sessionStorage.setItem('myuno:service-request-draft:ac-repair', '{not json');
    expect(takeServiceRequestDraft('ac-repair')).toBeNull();
    sessionStorage.setItem('myuno:service-request-draft:ac-repair', JSON.stringify({ name: 'only a name' }));
    expect(takeServiceRequestDraft('ac-repair')).toBeNull();
    sessionStorage.setItem('myuno:service-request-draft:ac-repair', JSON.stringify({ ...draft, name: 42 }));
    expect(takeServiceRequestDraft('ac-repair')).toBeNull();
  });

  it('drops unknown fields instead of spreading them into the form', () => {
    sessionStorage.setItem('myuno:service-request-draft:ac-repair', JSON.stringify({ ...draft, __proto__: { polluted: true }, extra: 'x' }));
    expect(takeServiceRequestDraft('ac-repair')).toEqual(draft);
  });

  it('clears a draft after the request is sent', () => {
    saveServiceRequestDraft('ac-repair', draft);
    clearServiceRequestDraft('ac-repair');
    expect(takeServiceRequestDraft('ac-repair')).toBeNull();
  });
});
