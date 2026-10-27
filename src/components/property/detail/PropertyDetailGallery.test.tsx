import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PropertyDetailGallery } from './PropertyDetailGallery';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(cleanup);
it('keeps supporting photos distinct when the active photo changes and preserves original lightbox indices', () => {
  const open = vi.fn();
  render(<PropertyDetailGallery images={['a.jpg', 'b.jpg', 'c.jpg']} alt="Home" onOpenLightbox={open} />);
  fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
  expect(screen.getAllByRole('img').map(image => image.getAttribute('src'))).toEqual(['b.jpg', 'a.jpg', 'c.jpg']);
  fireEvent.click(screen.getByRole('button', { name: 'Open photo 2' }));
  expect(open).toHaveBeenCalledWith(1);
});
it('removes failed photos and gives a neutral state when all photos fail', () => {
  render(<PropertyDetailGallery images={['a.jpg']} alt="Home" onOpenLightbox={vi.fn()} />);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('status')).toHaveTextContent('Photos have not been published yet');
  expect(screen.queryByRole('button')).toBeNull();
});
