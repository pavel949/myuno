import { describe, expect, it } from 'vitest';
import { stripeConfigStatus, stripeKeyMode } from '../../../supabase/functions/_shared/stripe-config';

const env = (values: Record<string, string>) => (name: string) => values[name];

describe('stripe configuration status', () => {
  it('classifies keys by prefix and treats anything else as missing', () => {
    expect(stripeKeyMode('sk_live_synthetic')).toBe('live');
    expect(stripeKeyMode('rk_test_synthetic')).toBe('test');
    for (const value of [undefined, null, '', '  ', 'pk_live_synthetic', 'live']) expect(stripeKeyMode(value)).toBe('missing');
  });
  it('is ready only with a secret key and a webhook secret', () => {
    expect(stripeConfigStatus(env({ STRIPE_SECRET_KEY: 'sk_test_synthetic', STRIPE_WEBHOOK_SECRET: 'whsec_synthetic' }))).toEqual({ secret_key: 'test', webhook_secret: true, ready: true });
    expect(stripeConfigStatus(env({ STRIPE_SECRET_KEY: 'sk_live_synthetic' }))).toEqual({ secret_key: 'live', webhook_secret: false, ready: false });
    expect(stripeConfigStatus(env({ STRIPE_WEBHOOK_SECRET: 'whsec_synthetic' }))).toEqual({ secret_key: 'missing', webhook_secret: true, ready: false });
  });
});
