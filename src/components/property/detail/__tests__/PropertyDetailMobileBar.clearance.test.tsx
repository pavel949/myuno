import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyDetailMobileBar } from '../PropertyDetailMobileBar';
import { FLOATING_OFFSET } from '@/lib/nav/floatingStack';
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: String }) }));
vi.mock('@/components/property', () => ({ MessageHostButton: () => <button>Request rental</button> }));
let top = 700, height = 140;
const observers: { callback: ResizeObserverCallback; disconnect: ReturnType<typeof vi.fn> }[] = [];
const variable = '--property-detail-action-clearance';
beforeEach(() => {
  top = 700; height = 140; observers.length = 0;
  vi.stubGlobal('innerHeight', 900);
  const original = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute('data-property-detail-action-bar') ? { x: 0, y: top, top, height, bottom: top + height, width: 390, left: 0, right: 390, toJSON: () => ({}) } : original.call(this);
  });
  vi.stubGlobal('ResizeObserver', class {
    disconnect = vi.fn();
    constructor(callback: ResizeObserverCallback) { observers.push({ callback, disconnect: this.disconnect }); }
    observe() {}
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.documentElement.style.removeProperty(variable); });
const mount = () => render(<PropertyDetailMobileBar propertyId="synthetic" isSaleListing={false} salePrice={null} isLongStayOnly guestCount={2} onOpenDatePicker={() => {}} />);
describe('property action clearance', () => {
  it('includes bottom-nav/safe-area space and responds to content reflow', () => {
    mount();
    expect(document.documentElement.style.getPropertyValue(variable)).toBe('200px');
    top = 620; height = 220;
    act(() => observers[0].callback([], {} as ResizeObserver));
    expect(document.documentElement.style.getPropertyValue(variable)).toBe('280px');
    expect(FLOATING_OFFSET.chatAboveStack).toContain('var(--property-detail-action-clearance,0px)');
  });
  it('clears desktop-hidden geometry and remeasures on viewport resize', () => {
    mount(); height = 0; fireEvent(window, new Event('resize'));
    expect(document.documentElement.style.getPropertyValue(variable)).toBe('0px');
    height = 100; top = 720; fireEvent(window, new Event('resize'));
    expect(document.documentElement.style.getPropertyValue(variable)).toBe('180px');
  });
  it('restores the prior owner and ignores callbacks after unmount', () => {
    document.documentElement.style.setProperty(variable, '17px', 'important');
    const { unmount } = mount(); unmount();
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    act(() => observers[0].callback([], {} as ResizeObserver));
    expect(document.documentElement.style.getPropertyValue(variable)).toBe('17px');
    expect(document.documentElement.style.getPropertyPriority(variable)).toBe('important');
  });
  it('removes its variable on route departure when no prior owner existed', () => {
    const { unmount } = mount(); unmount(); fireEvent(window, new Event('resize'));
    expect(document.documentElement.style.getPropertyValue(variable)).toBe('');
  });
});
