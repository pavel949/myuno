import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { GoogleMapsProvider, useGoogleMaps } from '../GoogleMapsContext';

const mocks = vi.hoisted(() => ({
  get: vi.fn<() => string | null>(),
  fetch: vi.fn<() => Promise<string | null>>(),
  load: vi.fn<(language: string) => Promise<void>>(),
  language: 'en',
}));

vi.mock('@/lib/googleMaps', () => ({
  fetchGoogleMapsKey: mocks.fetch,
  getGoogleMapsKey: mocks.get,
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: mocks.language }),
}));
vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: class {
    constructor(private opts: { language: string }) {}
    load() { return mocks.load(this.opts.language); }
  },
}));

function Consumer({ id }: { id: string }) {
  const info = useGoogleMaps();
  return <output data-testid={id}>{info.isLoaded ? info.language : info.loadError ? 'unavailable' : 'loading'}</output>;
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  mocks.language = 'en';
});

it('does not fetch the key or load Google before a consumer is present', async () => {
  mocks.get.mockReturnValue(null);
  mocks.fetch.mockResolvedValue('synthetic-map-key');
  mocks.load.mockResolvedValue(undefined);
  const tree = (showMaps: boolean) => (
    <StrictMode>
      <GoogleMapsProvider>
        <div>Public landing fixture</div>
        {showMaps && <><Consumer id="first" /><Consumer id="second" /></>}
      </GoogleMapsProvider>
    </StrictMode>
  );
  const view = render(tree(false));
  await act(async () => {});
  expect(screen.getByText('Public landing fixture')).toBeInTheDocument();
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.load).not.toHaveBeenCalled();
  view.rerender(tree(true));
  await waitFor(() => expect(screen.getByTestId('first')).toHaveTextContent('en'));
  expect(screen.getByTestId('second')).toHaveTextContent('en');
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  expect(mocks.load).toHaveBeenCalledExactlyOnceWith('en');
  view.rerender(tree(false));
  view.rerender(tree(true));
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  expect(mocks.load).toHaveBeenCalledTimes(1);
});

it('keeps missing-key fallback and does not import the script for a missing key', async () => {
  mocks.get.mockReturnValue(null);
  mocks.fetch.mockResolvedValue(null);
  render(<GoogleMapsProvider><Consumer id="missing" /></GoogleMapsProvider>);
  await waitFor(() => expect(screen.getByTestId('missing')).toHaveTextContent('unavailable'));
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  expect(mocks.load).not.toHaveBeenCalled();
});

it('retries a failed localized load once in English and retains the fallback', async () => {
  mocks.get.mockReturnValue('synthetic-map-key');
  mocks.language = 'ru';
  mocks.load.mockRejectedValueOnce(Error('synthetic RU failure')).mockResolvedValueOnce(undefined);
  render(<GoogleMapsProvider><Consumer id="fallback" /></GoogleMapsProvider>);
  await waitFor(() => expect(screen.getByTestId('fallback')).toHaveTextContent('en'));
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.load.mock.calls).toEqual([['ru'], ['en']]);
});
