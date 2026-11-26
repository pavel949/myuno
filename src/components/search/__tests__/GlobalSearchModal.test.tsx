import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GlobalSearchModal } from '../GlobalSearchModal';
import { propertyDetailHref } from '@/lib/real-estate/propertyDetailIntent';
import type { SearchResult } from '@/hooks/useGlobalSearch';

function result(id: string, title: string, type: string, path: string): SearchResult {
  return {
    id, titleEn: title, titleRu: title, type, path,
    image: null, price: null, rating: null, locationEn: null, locationRu: null,
  };
}

const rental = result('rental', 'Recorded rental', 'property', propertyDetailHref('rental', 'rent'));
const sale = result('sale', 'Recorded sale', 'property', propertyDetailHref('sale', 'buy'));
const yacht = result('yacht', 'Recorded charter', 'yachts', '/yachts/yacht');
const matches = [rental, sale, yacht];

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useGlobalSearch', () => ({
  useGlobalSearch: (query: string) => ({ results: query ? matches : [] }),
}));

function CurrentRoute() {
  const location = useLocation();
  return <output data-testid="search-location">{location.pathname + location.search}</output>;
}

describe('global catalogue search', () => {
  it('groups the actual listing destinations and supports native keyboard focus through each result', async () => {
    const onOpenChange = vi.fn();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GlobalSearchModal open onOpenChange={onOpenChange} />
        <CurrentRoute />
      </MemoryRouter>,
    );

    const search = screen.getByRole('searchbox', { name: 'Search myUNO' });
    fireEvent.change(search, { target: { value: 'recorded' } });
    expect(await screen.findByRole('heading', { name: 'Rentals 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Buy property 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yachts 1' })).toBeInTheDocument();

    const rentalRow = screen.getByRole('button', { name: /recorded rental/i });
    const saleRow = screen.getByRole('button', { name: /recorded sale/i });
    search.focus();
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    expect(rentalRow).toHaveFocus();
    fireEvent.keyDown(rentalRow, { key: 'ArrowDown' });
    expect(saleRow).toHaveFocus();
    fireEvent.keyDown(saleRow, { key: 'ArrowUp' });
    expect(rentalRow).toHaveFocus();
    fireEvent.keyDown(rentalRow, { key: 'ArrowUp' });
    expect(search).toHaveFocus();

    fireEvent.click(saleRow);
    expect(screen.getByTestId('search-location')).toHaveTextContent(sale.path);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
