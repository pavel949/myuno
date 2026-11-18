import { createRef } from 'react';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MapLibreMap, MapLibreMapHandle } from './MapLibreMap';

const mock = vi.hoisted(() => ({
  fail: false,
  fit: vi.fn(),
  fly: vi.fn(),
  setStyle: vi.fn(),
  options: [] as Array<Record<string, unknown>>,
  events: {} as Record<string, () => void>,
  elements: [] as HTMLElement[],
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('maplibre-gl', () => ({ default: {
  Map: class {
    constructor(options: Record<string, unknown>) {
      mock.options.push(options);
      if (mock.fail) { (options.container as HTMLElement).appendChild(document.createElement('canvas')); throw new Error('WebGL unavailable'); }
    }
    on(name: string, handler: () => void) { mock.events[name] = handler; }
    off() {}
    remove() {}
    addControl() {}
    loaded() { return true; }
    getLayer() { return false; }
    setStyle = mock.setStyle;
    fitBounds = mock.fit;
    flyTo = mock.fly;
    getZoom() { return 11; }
  },
  Marker: class {
    constructor({ element }: { element: HTMLElement }) { mock.elements.push(element); }
    setLngLat() { return this; }
    addTo() { return this; }
    remove() {}
  },
  LngLatBounds: class { extend() { return this; } },
  NavigationControl: class {},
  ScaleControl: class {},
  addProtocol: vi.fn(),
} }));

const center = { lat: 7.98, lng: 98.31 };
const markers = [
  { id: 'a', ...center, title: 'Квартира' },
  { id: 'b', lat: 8.01, lng: 98.35, title: 'Вилла' },
];
beforeEach(() => {
  mock.fail = false;
  mock.fit.mockClear(); mock.fly.mockClear(); mock.setStyle.mockClear();
  mock.options.length = 0; mock.elements.length = 0;
  mock.events = {};
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});
describe('MapLibreMap safe baseline', () => {
  it('uses the verified own PMTiles archive and its Latin place labels', () => {
    render(<MapLibreMap center={center} markers={markers} />);
    expect(mock.options[0].style).toMatchObject({ sources: { omt: { url: expect.stringMatching(/^pmtiles:\/\/.*phuket\.zip$/) } } });
    expect(mock.options[0].style).toMatchObject({ glyphs: `${window.location.origin}/map-glyphs/noto-sans-regular/{range}.pbf?fontstack={fontstack}` });
    const style = mock.options[0].style as { layers: Array<{ id: string; layout?: Record<string, unknown> }> };
    expect(style.layers.find((layer) => layer.id === 'place-labels')?.layout?.['text-field']).toEqual(['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]);
    expect(validateStyleMin(mock.options[0].style as Parameters<typeof validateStyleMin>[0])).toEqual([]);
    act(() => mock.events.load());
    expect(screen.getByText('Карта онлайн')).toBeInTheDocument();
  });
  it('falls back only after an actual archive loading error', () => {
    render(<MapLibreMap center={center} />);
    act(() => mock.events.error());
    expect(mock.setStyle).toHaveBeenCalledWith('https://tiles.openfreemap.org/styles/liberty');
    act(() => mock.events.error());
    expect(screen.getByText(/Не удалось загрузить фон карты/)).toBeInTheDocument();
  });
  it('contains a WebGL initialization failure and offers an explicit retry', () => {
    mock.fail = true;
    render(<MapLibreMap center={center} />);
    expect(screen.getByText(/В этом браузере недоступна графика карты/)).toBeInTheDocument();
    expect(document.querySelectorAll('canvas')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(document.querySelectorAll('canvas')).toHaveLength(0);
    mock.fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(mock.options).toHaveLength(3);
    act(() => mock.events.load());
    expect(screen.getByText('Карта онлайн')).toBeInTheDocument();
  });
  it('does not refit bounds when a marker is selected', () => {
    const { rerender } = render(<MapLibreMap center={center} markers={markers} />);
    expect(mock.fit).toHaveBeenCalledTimes(1);
    rerender(<MapLibreMap center={center} markers={markers} activeMarkerId="a" />);
    expect(mock.fit).toHaveBeenCalledTimes(1);
    expect(mock.elements.at(-2)?.getAttribute('aria-pressed')).toBe('true');
  });
  it('omits invalid coordinates and keeps marker buttons operable', () => {
    const click = vi.fn();
    render(<MapLibreMap center={center} markers={[markers[0], { id: 'bad', lat: NaN, lng: 98 }]} onMarkerClick={click} />);
    expect(mock.elements).toHaveLength(1);
    expect(mock.elements[0].style.width).toBe('44px');
    mock.elements[0].click();
    expect(click).toHaveBeenCalledWith(markers[0]);
  });
  it('never presents a connection loss as guaranteed offline support', () => {
    render(<MapLibreMap center={center} />);
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByText('Нет сети. Карта и предложения могут быть неполными.')).toBeInTheDocument();
  });
  it('applies coverage only when explicitly supplied and filters outlier markers', () => {
    const bounds = [[98.2, 7.7], [98.55, 8.25]] as const;
    const { unmount } = render(<MapLibreMap center={center} coverageBounds={bounds} markers={[markers[0], { id: 'bangkok', lat: 13.75, lng: 100.5 }]} />);
    expect(mock.options[0].maxBounds).toEqual(bounds);
    expect(mock.elements).toHaveLength(1);
    expect(mock.fly).toHaveBeenCalledWith(expect.objectContaining({ center: [center.lng, center.lat] }));
    unmount();
    render(<MapLibreMap center={center} />);
    expect(mock.options.at(-1)).not.toHaveProperty('maxBounds');
  });
  it('does not jump or place a user marker outside coverage', () => {
    const getCurrentPosition = vi.fn((success) => success({ coords: { latitude: 13.75, longitude: 100.5, accuracy: 10 } }));
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } });
    const ref = createRef<MapLibreMapHandle>();
    render(<MapLibreMap ref={ref} center={center} coverageBounds={[[98.2, 7.7], [98.55, 8.25]]} />);
    mock.fly.mockClear();
    act(() => ref.current?.locate());
    expect(mock.fly).not.toHaveBeenCalled();
    expect(mock.elements).toHaveLength(0);
    expect(screen.getByText(/Вы за пределами доступной карты/)).toBeInTheDocument();
    getCurrentPosition.mockImplementation((success) => success({ coords: { latitude: center.lat, longitude: center.lng, accuracy: 10 } }));
    act(() => ref.current?.locate());
    expect(mock.fly).toHaveBeenCalledWith(expect.objectContaining({ center: [center.lng, center.lat] }));
    expect(mock.elements).toHaveLength(1);
  });
  it('guards imperative navigation without restricting callers that have no coverage', () => {
    const ref = createRef<MapLibreMapHandle>();
    const { unmount } = render(<MapLibreMap ref={ref} center={center} coverageBounds={[[98.2, 7.7], [98.55, 8.25]]} />);
    mock.fly.mockClear();
    act(() => ref.current?.flyTo(13.75, 100.5));
    expect(mock.fly).not.toHaveBeenCalled();
    expect(screen.getByText(/Эта точка за пределами доступной карты/)).toBeInTheDocument();
    unmount();
    render(<MapLibreMap ref={ref} center={center} />);
    mock.fly.mockClear();
    act(() => ref.current?.flyTo(13.75, 100.5));
    expect(mock.fly).toHaveBeenCalledWith(expect.objectContaining({ center: [100.5, 13.75] }));
  });

});
