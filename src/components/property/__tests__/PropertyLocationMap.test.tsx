import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyLocationMap } from '../PropertyLocationMap';
const state = vi.hoisted(() => ({ hasKey: true, isLoaded: true, loadError: undefined as Error | undefined, renderedError: false, language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/GoogleMapsContext', () => ({ useGoogleMaps: () => state }));
vi.mock('@react-google-maps/api', () => ({ GoogleMap: () => <div data-testid="map">{state.renderedError && <div className="gm-err-container">This page can't load Google Maps correctly.</div>}</div>, Marker: () => null }));
beforeEach(() => { state.hasKey = true; state.isLoaded = true; state.loadError = undefined; state.renderedError = false; state.language = 'en'; });
afterEach(cleanup);
describe('property map failure recovery', () => {
  it('replaces a provider-rendered failure even when the script reports loaded', async () => {
    state.renderedError = true;
    render(<PropertyLocationMap lat={8.02} lng={98.3} address="Layan, Phuket" />);
    await waitFor(() => expect(screen.queryByTestId('map')).toBeNull());
    expect(screen.getByText('Map temporarily unavailable')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=8.02,98.3');
    expect(screen.getByText('Layan, Phuket')).toBeVisible();
  });
  it('recovers when Google inserts an error after the map initially renders', async () => {
    render(<PropertyLocationMap lat={8.02} lng={98.3} />);
    const error = document.createElement('div');
    error.className = 'gm-err-message';
    screen.getByTestId('map').appendChild(error);
    await waitFor(() => expect(screen.queryByTestId('map')).toBeNull());
    expect(screen.getByText('Map temporarily unavailable')).toBeVisible();
  });
  it.each([['en', 'Map temporarily unavailable'], ['ru', 'Карта временно недоступна'], ['th', 'แผนที่ไม่พร้อมใช้งานชั่วคราว']])('uses guest-facing localized recovery for auth failure in %s', (language, label) => {
    state.language = language;
    state.loadError = new Error('auth failed: check API key restrictions');
    state.isLoaded = false;
    const { container } = render(<PropertyLocationMap address="Layan & beach" />);
    expect(screen.getByText(label)).toBeVisible();
    expect(screen.queryByText(/API key/)).toBeNull();
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=Layan%20%26%20beach');
  });
  it('uses the address when coordinates are invalid', () => {
    state.hasKey = false;
    render(<PropertyLocationMap lat={NaN} lng={500} address="Phuket" />);
    expect(screen.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=Phuket');
  });
  it('retains a working map and external map link', () => {
    render(<PropertyLocationMap lat={8.02} lng={98.3} />);
    expect(screen.getByTestId('map')).toBeVisible();
    expect(screen.queryByText('Map temporarily unavailable')).toBeNull();
    expect(screen.getByRole('link', { name: 'Open in Google Maps' })).toBeVisible();
  });
});
