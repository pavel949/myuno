import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeSearchDateRange } from '../HomeSearchDateRange';
const mode = vi.hoisted(() => ({ mobile: false }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mode.mobile }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(() => { cleanup(); document.body.removeAttribute('data-scroll-locked'); document.body.style.pointerEvents = ''; vi.restoreAllMocks(); mode.mobile = false; });
function mount() {
 render(<><button>Outside</button><div role="dialog" aria-label="Other"><button>Other dialog action</button></div><HomeSearchDateRange checkIn="" checkOut="" onChange={vi.fn()} /></>);
 fireEvent.click(screen.getByRole('button', { name: 'Stay dates' }));
 return screen.getByRole('dialog', { name: 'Stay dates' });
}
describe('calendar-owned early outside clicks', () => {
 it('closes desktop on a primary outside click without changing the click target action', () => {
  const dialog = mount();const action = vi.fn();screen.getByRole('button', { name: 'Outside' }).addEventListener('click', action);
  fireEvent.click(screen.getByRole('button', { name: 'Outside' }));
  expect(dialog).not.toBeInTheDocument();expect(action).toHaveBeenCalledTimes(1);
 });
 it('keeps inside, context clicks, and another dialog outside this local dismissal path', () => {
  const dialog = mount();
  fireEvent.click(dialog);expect(dialog).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Outside' }), { button: 2 });expect(dialog).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Outside' }), { button: 0, ctrlKey: true });expect(dialog).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Other dialog action' }));expect(dialog).toBeInTheDocument();
 });
 it('ignores the trigger in its capture listener and removes the listener on unmount', () => {
  const add = vi.spyOn(document, 'addEventListener');const remove = vi.spyOn(document, 'removeEventListener');const dialog = mount();
  const registration = add.mock.calls.find(([type,,capture]) => type === 'click' && capture === true);expect(registration).toBeDefined();
  const listener = registration![1] as EventListener;const event = new MouseEvent('click', { button: 0 });Object.defineProperty(event, 'target', { value: screen.getByRole('button', { name: 'Stay dates' }) });listener(event);
  expect(dialog).toBeInTheDocument();cleanup();expect(remove).toHaveBeenCalledWith('click', listener, true);
 });
 it('ignores a foreign alertdialog target without swallowing its action', () => {
  const dialog = mount();const action = vi.fn();
  render(<div role="alertdialog" aria-label="Foreign alert"><button onClick={action}>Alert action</button></div>);
  fireEvent.click(screen.getByRole('button', { name: 'Alert action' }));
  expect(dialog).toBeInTheDocument();expect(action).toHaveBeenCalledTimes(1);
 });
 it('ignores an open native curtain and its sibling overlay until the curtain is removed', () => {
  const dialog = mount();
  const curtain = document.createElement('dialog');curtain.open = true;curtain.innerHTML = '<button>Native action</button>';document.body.append(curtain);
  const overlay = document.createElement('div');document.body.append(overlay);
  fireEvent.click(curtain.querySelector('button')!);fireEvent.click(overlay);expect(dialog).toBeInTheDocument();
  curtain.remove();fireEvent.click(overlay);expect(dialog).not.toBeInTheDocument();overlay.remove();
 });
 it.each(['scroll', 'pointer'])('ignores a foreign Radix-style modal sibling overlay with a %s body lock', lock => {
  const dialog = mount();const overlay = document.createElement('div');document.body.append(overlay);
  render(<div role="dialog" aria-label="Foreign modal"><button>Modal action</button></div>);
  if (lock === 'scroll') document.body.setAttribute('data-scroll-locked', '1');
  else document.body.style.pointerEvents = 'none';
  fireEvent.click(overlay);expect(dialog).toBeInTheDocument();
  document.body.removeAttribute('data-scroll-locked');document.body.style.pointerEvents = '';
  // Mounted role=dialog alone is not a blanket modal signal.
  fireEvent.click(overlay);expect(dialog).not.toBeInTheDocument();overlay.remove();
 });
 it('closes mobile only on a primary overlay click, retaining inside and context interaction', () => {
  mode.mobile = true;const dialog = mount();const overlay = document.querySelector('[data-state="open"].inset-0')!;expect(overlay).toBeTruthy();
  fireEvent.click(dialog);expect(dialog).toBeInTheDocument();
  fireEvent.click(overlay, { button: 2 });expect(dialog).toBeInTheDocument();
  fireEvent.click(overlay, { button: 0, ctrlKey: true });expect(dialog).toBeInTheDocument();
  fireEvent.pointerDown(dialog);fireEvent.pointerUp(overlay);fireEvent.click(document.body);expect(dialog).toBeInTheDocument();
  fireEvent.click(overlay);expect(dialog).not.toBeInTheDocument();
 });
});
