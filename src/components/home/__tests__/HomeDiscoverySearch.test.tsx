import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeDiscoverySearch } from '../HomeDiscoverySearch';
const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('@/hooks/usePropertyQuickFilters', () => ({ usePropertyQuickFilters: () => ({ districts: [{ id: 'a', valueKey: 'layan', labelRu: 'Лаян', labelEn: 'Layan' }], isLoading: false }) }));

vi.mock('@/hooks/usePropertyFilterOptions', () => ({ usePropertyFilterOptions: () => ({ propertyTypes: [{ id: 'villa', labelRu: 'Вилла', labelEn: 'Villa' }, { id: 'condo', labelRu: 'Кондо', labelEn: 'Condo' }], isLoading: false }) }));

describe('Home discovery catalogue handoff', () => {
  beforeEach(() => navigate.mockClear());
  it('preserves district, dates and guests in the existing rental URL contract', () => {
    render(<HomeDiscoverySearch />);
    fireEvent.change(screen.getByLabelText('Тип жилья'), { target: { value: 'villa' } });
    fireEvent.change(screen.getByLabelText('Выберите район'), { target: { value: 'layan' } });
    fireEvent.input(screen.getByLabelText('Заезд'), { target: { value: '2027-02-10' } });
    fireEvent.input(screen.getByLabelText('Выезд'), { target: { value: '2027-02-15' } });
    fireEvent.change(screen.getByLabelText('Количество гостей'), { target: { value: '4' } });
    fireEvent.submit(screen.getByRole('form'));
    const url = new URL(navigate.mock.calls[0][0], 'https://myuno.app');
    expect(url.pathname).toBe('/property/search');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ mode: 'rent', tenancy: 'short', district: 'layan', guests: '4', types: 'villa' });
    expect(new Date(url.searchParams.get('checkIn')!).getDate()).toBe(10);
    expect(new Date(url.searchParams.get('checkOut')!).getDate()).toBe(15);
  });
  it('keeps purchase separate from rental dates and guests after switching modes', () => {
    render(<HomeDiscoverySearch />);
    fireEvent.input(screen.getByLabelText('Заезд'), { target: { value: '2027-02-10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Покупка' }));
    expect(screen.queryByLabelText('Заезд')).toBeNull();
    fireEvent.submit(screen.getByRole('form'));
    const params = new URL(navigate.mock.calls[0][0], 'https://myuno.app').searchParams;
    expect(Object.fromEntries(params)).toEqual({ mode: 'buy' });
  });
  it('keeps the holiday search rental-only and hands off condo type', () => {
    render(<HomeDiscoverySearch rentalOnly />);
    expect(screen.queryByRole('button', { name: 'Покупка' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Тип жилья'), { target: { value: 'condo' } });
    fireEvent.submit(screen.getByRole('form'));
    const params = new URL(navigate.mock.calls[0][0], 'https://myuno.app').searchParams;
    expect(Object.fromEntries(params)).toMatchObject({ mode: 'rent', types: 'condo' });
  });
  it('clears an incompatible checkout when arrival is moved later', () => {
    render(<HomeDiscoverySearch />);
    fireEvent.input(screen.getByLabelText('Заезд'), { target: { value: '2027-02-10' } });
    fireEvent.input(screen.getByLabelText('Выезд'), { target: { value: '2027-02-15' } });
    fireEvent.input(screen.getByLabelText('Заезд'), { target: { value: '2027-02-20' } });
    expect(screen.getByLabelText('Выезд')).toHaveValue('');
    expect(screen.getByLabelText('Выезд')).toHaveAttribute('min', '2027-02-21');
    expect(screen.getByLabelText('Выезд')).toBeRequired();
  });
});
