import { describe, expect, it } from 'vitest';
import { canLoadPublicTelemetry, sanitizePublicTelemetry } from './publicTelemetry';
const ready = { enabled: true, production: true, consent: true, href: 'https://www.myuno.app/' };

describe('optional public telemetry boundary', () => {
  it('requires explicit enablement, production and consent before SDK loading', () => {
    expect(canLoadPublicTelemetry(ready)).toBe(true);
    for (const key of ['enabled', 'production', 'consent'] as const) expect(canLoadPublicTelemetry({ ...ready, [key]: false })).toBe(false);
  });
  it.each(['/admin', '/mc/calendar', '/owner', '/vendor', '/my/stays', '/auth', '/property/private-id', '/unknown'])('does not load or send on private/unknown route %s', path => {
    const href = `https://www.myuno.app${path}`;
    expect(canLoadPublicTelemetry({ ...ready, href })).toBe(false);
    expect(sanitizePublicTelemetry({ url: href }, href, true)).toBeNull();
    expect(sanitizePublicTelemetry({ url: ready.href }, href, true)).toBeNull();
  });
  it.each(['http://www.myuno.app/', 'https://localhost/', 'https://unrelated.example/', 'https://www.myuno.app/?token=secret', 'https://www.myuno.app/#access_token=secret'])('does not inject scripts from unsafe initial context %s', href => {
    expect(canLoadPublicTelemetry({ ...ready, href })).toBe(false);
  });
  it('removes query/hash data without changing the public pathname', () => {
    const event = { url: 'https://www.myuno.app/property/search?name=private#access_token=secret', type: 'pageview' };
    expect(sanitizePublicTelemetry(event, ready.href, true)).toEqual({ ...event, url: 'https://www.myuno.app/property/search' });
  });
  it('drops queued events after consent is withdrawn or current route becomes private', () => {
    const event = { url: ready.href };
    expect(sanitizePublicTelemetry(event, ready.href, false)).toBeNull();
    expect(sanitizePublicTelemetry(event, 'https://www.myuno.app/mc/bookings', true)).toBeNull();
  });
  it('rejects foreign origins, malformed inputs and non-public guide slugs', () => {
    for (const url of ['https://evil.example/', 'https://www.myuno.app/area/private-person']) expect(sanitizePublicTelemetry({ url }, ready.href, true)).toBeNull();
    expect(sanitizePublicTelemetry({ url: ready.href }, 'invalid', true)).toBeNull();
  });
});
