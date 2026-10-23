import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PublicTelemetry } from './PublicTelemetry';
const state = vi.hoisted(() => ({ consent: true, notify: null as null | (() => void), views: vi.fn(), speed: vi.fn() }));
vi.mock('@/lib/cookieConsent', () => ({
  hasCookieConsent: () => state.consent,
  subscribeCookieConsent: (listener: () => void) => { state.notify = listener; return () => { state.notify = null; }; },
}));
vi.mock('@vercel/analytics/react', () => ({ Analytics: (props: unknown) => { state.views(props); return null; } }));
vi.mock('@vercel/speed-insights/react', () => ({ SpeedInsights: (props: unknown) => { state.speed(props); return null; } }));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); state.consent = true; state.views.mockClear(); state.speed.mockClear(); });
describe('public instrumentation lifecycle', () => {
  it('does not mount either SDK with the default disabled configuration', async () => {
    vi.stubEnv('PROD', true); vi.stubEnv('VITE_VERCEL_TELEMETRY_ENABLED', '');
    render(<BrowserRouter><PublicTelemetry /></BrowserRouter>);
    await act(async () => {});
    expect(state.views).not.toHaveBeenCalled(); expect(state.speed).not.toHaveBeenCalled();
  });
  it('blocks both SDKs without analytics consent', async () => {
    vi.stubEnv('PROD', true); vi.stubEnv('VITE_VERCEL_TELEMETRY_ENABLED', 'true'); state.consent = false;
    render(<BrowserRouter><PublicTelemetry /></BrowserRouter>);
    await act(async () => {});
    expect(state.views).not.toHaveBeenCalled(); expect(state.speed).not.toHaveBeenCalled();
  });
  it('loads both SDKs only after consent and drops late events after navigation or withdrawal', async () => {
    vi.stubEnv('PROD', true); vi.stubEnv('VITE_VERCEL_TELEMETRY_ENABLED', 'true');
    vi.stubGlobal('location', new URL('https://www.myuno.app/'));
    state.consent = false;
    render(<BrowserRouter><PublicTelemetry /></BrowserRouter>);
    expect(state.views).not.toHaveBeenCalled();
    await act(async () => { state.consent = true; state.notify?.(); });
    await waitFor(() => expect(state.views).toHaveBeenCalled());
    expect(state.speed).toHaveBeenCalled();
    const props = state.views.mock.calls.at(-1)?.[0] as { beforeSend: (event: {url: string}) => unknown };
    expect(props.beforeSend({ url: 'https://www.myuno.app/?token=secret' })).toEqual({ url: 'https://www.myuno.app/' });
    vi.stubGlobal('location', new URL('https://www.myuno.app/mc/calendar'));
    expect(props.beforeSend({ url: 'https://www.myuno.app/' })).toBeNull();
    state.consent = false;
    expect(props.beforeSend({ url: 'https://www.myuno.app/' })).toBeNull();
  });
  it('subscribes to consent changes and cleans up the subscription on unmount', async () => {
    const view = render(<BrowserRouter><PublicTelemetry /></BrowserRouter>);
    expect(state.notify).toEqual(expect.any(Function));
    await act(async () => { state.consent = false; state.notify?.(); });
    view.unmount(); expect(state.notify).toBeNull();
  });
});
