import { cleanup, fireEvent, render as renderControls, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeDiscoverySearch } from '../HomeDiscoverySearch';
const state = vi.hoisted(() => ({ navigate: vi.fn(), mobile: false, language: 'ru' }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => state.mobile }));
vi.mock('@/hooks/usePropertyQuickFilters', () => ({ usePropertyQuickFilters: () => ({ districts: [{ id: 'a', valueKey: 'layan', labelRu: 'Лаян', labelEn: 'Layan' }], isLoading: false }) }));
vi.mock('@/hooks/usePropertyFilterOptions', () => ({ usePropertyFilterOptions: () => ({ propertyTypes: [{ id: 'villa', labelRu: 'Вилла', labelEn: 'Villa' }, { id: 'condo', labelRu: 'Кондо', labelEn: 'Condo' }], isLoading: false }) }));

function render(...args: Parameters<typeof renderControls>) {
  const result = renderControls(...args);
  fireEvent.click(result.container.querySelector('summary')!);
  return result;
}

function choose(label: string, option: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('option', { name: option }));
}
function openDates() { fireEvent.click(screen.getByRole('button', { name: 'Даты проживания' })); }
function day(value: string) {
  // v9 correctly separates the grid cell from its interactive day button.
  return screen.getByRole('dialog').querySelector<HTMLButtonElement>(`[data-day="2026-10-${value.padStart(2, '0')}"] button`)!;
}

describe('Home discovery themed controls and catalogue handoff', () => {
  beforeEach(() => {
    state.navigate.mockClear();
    state.mobile = false;
    state.language = 'ru';
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-18T18:30:00Z')); // Oct 19 in Bangkok, Oct 18 in UTC.
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it.each(['ru', 'en', 'th'])('keeps only primary criteria expanded initially in %s', language => {
    state.language = language;
    const { container } = renderControls(<HomeDiscoverySearch />);
    expect(container.querySelector('details')).not.toHaveAttribute('open');
    expect(screen.getByRole('spinbutton')).not.toBeVisible();
    expect(screen.getByRole('searchbox')).not.toBeVisible();
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
    expect(screen.getByRole('button', { name: language === 'en' ? 'Find a home' : language === 'ru' ? 'Найти жильё' : 'ค้นหาที่พัก' })).toBeVisible();
  });
  it.each([
    ['ru', 'Срок аренды', 'На год', 'Помесячно'],
    ['en', 'Rental duration', 'Yearly', 'Monthly'],
    ['th', 'ระยะเวลาเช่า', 'รายปี', 'รายเดือน'],
  ])('exposes and changes the active rental duration before progressive submission in %s', (language, group, yearly, monthly) => {
    state.language = language;
    renderControls(<HomeDiscoverySearch hideModeSwitch progressive initialParams={new URLSearchParams('mode=rent&tenancy=long')} />);
    const duration = screen.getByRole('group', { name: group });
    expect(within(duration).getByRole('button', { name: yearly })).toBeVisible();
    expect(within(duration).getByRole('button', { name: yearly })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('combobox')).toBeNull();
    fireEvent.click(within(duration).getByRole('button', { name: monthly }));
    fireEvent.submit(screen.getByRole('form'));
    const params = new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams;
    expect(params.get('tenancy')).toBe('medium');
    expect(params.has('district')).toBe(false);
    expect(params.has('guests')).toBe(false);
  });
  it('edits a legacy bedroom bookmark into a minimum threshold without losing secondary state', () => {
    state.language = 'en';
    render(<HomeDiscoverySearch initialParams={new URLSearchParams('f.bedrooms=studio&types=townhouse&guests=4&f.priceLevel=2&source=bookmark')} />);
    choose('Bedrooms', '2+');
    fireEvent.submit(screen.getByRole('form'));
    const params = new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams;
    expect(params.get('bedrooms')).toBe('2+');
    expect(params.has('f.bedrooms')).toBe(false);
    expect(params.get('types')).toBe('townhouse');
    expect(params.get('guests')).toBe('4');
    expect(params.get('f.priceLevel')).toBe('2');
    expect(params.get('source')).toBe('bookmark');
  });
  it('clears both modern and legacy bedroom constraints explicitly', () => {
    state.language = 'en';
    render(<HomeDiscoverySearch initialParams={new URLSearchParams('bedrooms=2%2B&f.bedrooms=4%2B')} />);
    choose('Bedrooms', 'Any');
    fireEvent.submit(screen.getByRole('form'));
    const params = new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams;
    expect(params.has('bedrooms')).toBe(false);
    expect(params.has('f.bedrooms')).toBe(false);
  });
  it.each([['ru', 'Любое', 'Необязательно'], ['en', 'Any', 'Optional'], ['th', 'ไม่ระบุ', 'ไม่บังคับ']])('keeps the optional guest placeholder short and explained in %s', (language, placeholder, hint) => {
    state.language = language;
    render(<HomeDiscoverySearch rentalOnly />);
    const guests = screen.getByRole('spinbutton');
    expect(guests).toHaveAttribute('placeholder', placeholder);
    expect(guests).not.toBeRequired();
    expect(guests).toHaveAccessibleDescription(expect.stringContaining(hint));
    fireEvent.submit(screen.getByRole('form'));
    expect(new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams.has('guests')).toBe(false);
  });
  it('uses app controls and preserves type, district, dates and guests in the rental URL', () => {
    const { container } = render(<HomeDiscoverySearch />);
    expect(container.querySelector('input[type="date"]')).toBeNull();
    choose('Тип жилья', 'Вилла');
    choose('Выберите район', 'Лаян');
    openDates();
    fireEvent.click(day('20'));
    fireEvent.click(day('25'));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.change(screen.getByLabelText('Количество гостей'), { target: { value: '4' } });
    fireEvent.submit(screen.getByRole('form'));
    const url = new URL(state.navigate.mock.calls[0][0], 'https://myuno.app');
    expect(url.pathname).toBe('/property/search');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ mode: 'rent', tenancy: 'short', district: 'layan', guests: '4', types: 'villa' });
    expect(url.searchParams.get('checkIn')).toBe('2026-10-20');
    expect(url.searchParams.get('checkOut')).toBe('2026-10-25');
  });
  it('keeps purchase separate from rental dates and guests', () => {
    render(<HomeDiscoverySearch />);
    openDates();
    fireEvent.click(day('20'));
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    fireEvent.click(screen.getByRole('button', { name: 'Покупка' }));
    expect(screen.queryByRole('button', { name: 'Даты проживания' })).toBeNull();
    fireEvent.submit(screen.getByRole('form'));
    expect(Object.fromEntries(new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams)).toEqual({ mode: 'buy' });
  });
  it('keeps holiday search rental-only and supports undated search', () => {
    render(<HomeDiscoverySearch rentalOnly />);
    expect(screen.queryByRole('button', { name: 'Покупка' })).toBeNull();
    choose('Тип жилья', 'Кондо');
    fireEvent.submit(screen.getByRole('form'));
    expect(Object.fromEntries(new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams)).toMatchObject({ mode: 'rent', types: 'condo' });
  });
  it('keeps an unspecified guest count blank and does not silently add a restriction', () => {
    render(<HomeDiscoverySearch />);
    expect(screen.getByLabelText('Количество гостей')).toHaveValue(null);
    fireEvent.submit(screen.getByRole('form'));
    expect(new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams.has('guests')).toBe(false);
  });
  it('allows clearing an explicit guest restriction', () => {
    render(<HomeDiscoverySearch initialParams={new URLSearchParams('guests=4')} />);
    fireEvent.change(screen.getByLabelText('Количество гостей'), { target: { value: '' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams.has('guests')).toBe(false);
  });
  it('keeps rental-only entry points in rent mode even with a purchase bookmark', () => {
    render(<HomeDiscoverySearch rentalOnly initialParams={new URLSearchParams('mode=buy')} />);
    expect(screen.getByLabelText('Количество гостей')).toBeVisible();
    fireEvent.submit(screen.getByRole('form'));
    expect(new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams.get('mode')).toBe('rent');
  });
  it('rejects incomplete/same-day stays, resets old checkout, and allows clearing dates', () => {
    render(<HomeDiscoverySearch />);
    openDates();
    expect(day('18')).toBeDisabled();
    expect(day('19')).not.toBeDisabled();
    expect(day('19').closest('td')).toHaveClass('bg-accent');
    fireEvent.click(day('20'));
    fireEvent.click(day('20'));
    expect(screen.getByText('Выберите дату выезда')).toBeVisible();
    fireEvent.click(day('25'));
    openDates();
    fireEvent.click(day('28'));
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    fireEvent.submit(screen.getByRole('form'));
    expect(state.navigate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeVisible();
    openDates();
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить даты' }));
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    fireEvent.submit(screen.getByRole('form'));
    const params = new URL(state.navigate.mock.calls[0][0], 'https://myuno.app').searchParams;
    expect(params.has('checkIn')).toBe(false);
    expect(params.has('checkOut')).toBe(false);
  });
  it('uses an accessible bottom sheet on mobile with the same date selection', () => {
    state.mobile = true;
    render(<HomeDiscoverySearch />);
    openDates();
    expect(screen.getByRole('dialog', { name: 'Даты проживания' })).toBeVisible();
    expect(screen.getByRole('dialog')).toHaveClass('bottom-0');
    fireEvent.click(day('20'));
    fireEvent.click(day('25'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('accepts keyboard-generated clicks on real day buttons and retains range styling', () => {
    render(<HomeDiscoverySearch />);
    openDates();
    const start = day('20');
    expect(start.tagName).toBe('BUTTON');
    expect(start).toHaveAttribute('type', 'button');
    fireEvent.click(start, { detail: 0 }); // Enter/Space activate the native button with detail=0.
    expect(day('20').closest('td')).toHaveAttribute('aria-selected', 'true');
    expect(day('20').closest('td')).toHaveClass('bg-primary');
    fireEvent.click(day('25'), { detail: 0 });
    openDates();
    expect(day('22').closest('td')).toHaveClass('aria-selected:bg-accent');
    expect(day('25').closest('td')).toHaveClass('day-range-end');
  });
  it.each(['en', 'th'])('localizes picker instructions and headings in %s', language => {
    state.language = language;
    render(<HomeDiscoverySearch />);
    fireEvent.click(screen.getByRole('button', { name: language === 'en' ? 'Stay dates' : 'วันที่เข้าพัก' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText(language === 'en' ? 'Select check-in' : 'เลือกวันเช็กอิน')).toBeVisible();
  });
});

it('progressive search starts without a required district and retains optional refinements', () => {
  state.language = 'ru'; state.navigate.mockClear();
  renderControls(<HomeDiscoverySearch hideModeSwitch progressive />);
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.queryByRole('spinbutton')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Найти жильё' }));
  expect(state.navigate).toHaveBeenCalledWith('/property/search?mode=rent&tenancy=short');
  fireEvent.click(screen.getByRole('button', { name: 'Уточнить поиск' }));
  expect(screen.getAllByRole('combobox')).toHaveLength(3);
  fireEvent.click(screen.getByText('Название и гости'));
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: 'Найти жильё' }));
  expect(state.navigate).toHaveBeenLastCalledWith('/property/search?mode=rent&tenancy=short&guests=4');
});
