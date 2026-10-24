import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PhotoLightbox } from '@/components/property/PhotoLightbox';
import { ImageEditor } from '@/components/upload/ImageEditor';
const locale = vi.hoisted(() => ({ language: 'en' }));
const transport = vi.hoisted(() => vi.fn(() => { throw new Error('Live media transport forbidden'); }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: transport }, storage: { from: transport } } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: locale.language }) }));
afterEach(() => { cleanup(); document.body.style.overflow = ''; vi.clearAllMocks(); locale.language = 'en'; });
const images = ['/synthetic-bright.svg', '/synthetic-dark.svg', '/synthetic-third.svg'];
it('closed or empty viewer does not manufacture photo content', () => {
  const { rerender } = render(<PhotoLightbox images={images} open={false} onClose={vi.fn()} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  rerender(<PhotoLightbox images={[]} open onClose={vi.fn()} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('actual viewer retains keyboard boundaries, captions and thumbnail navigation', () => {
  render(<PhotoLightbox images={images} open onClose={vi.fn()} captions={['Bright room', 'Dark room', 'Third room']} />);
  expect(screen.getByAltText('Bright room')).toHaveAttribute('src', images[0]);
  fireEvent.keyDown(document, { key: 'ArrowLeft' }); expect(screen.getByText('1 / 3')).toBeVisible();
  fireEvent.keyDown(document, { key: 'ArrowRight' }); expect(screen.getByAltText('Dark room')).toHaveAttribute('src', images[1]);
  fireEvent.click(screen.getAllByAltText('')[2].closest('button')!);
  expect(screen.getByAltText('Third room')).toHaveAttribute('src', images[2]);
  fireEvent.keyDown(document, { key: 'ArrowRight' }); expect(screen.getByText('3 / 3')).toBeVisible();
  expect(transport).not.toHaveBeenCalled();
});
it('viewer keeps its initial index, scroll lock and Escape close contract', () => {
  const onClose = vi.fn();const { unmount } = render(<PhotoLightbox images={images} initialIndex={1} open onClose={onClose} />);
  expect(screen.getByText('2 / 3')).toBeVisible();expect(document.body).toHaveAttribute('data-scroll-locked');
  fireEvent.keyDown(document, { key: 'Escape' });expect(onClose).toHaveBeenCalledOnce();
  unmount();expect(document.body.style.overflow).toBe('');
});
it('unchanged-image save closes locally without inventing a saved URL or uploading', () => {
  const onOpenChange = vi.fn(), onSave = vi.fn();
  render(<ImageEditor open onOpenChange={onOpenChange} imageUrl={images[0]} onSave={onSave} userId="synthetic-only" />);
  fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(onOpenChange).toHaveBeenCalledWith(false);expect(onSave).not.toHaveBeenCalled();expect(transport).not.toHaveBeenCalled();
});
it('editor cancellation closes without AI, storage or save callbacks', () => {
  const onOpenChange = vi.fn(), onSave = vi.fn();
  render(<ImageEditor open onOpenChange={onOpenChange} imageUrl={images[0]} onSave={onSave} />);
  fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
  expect(onOpenChange).toHaveBeenCalledWith(false);expect(onSave).not.toHaveBeenCalled();expect(transport).not.toHaveBeenCalled();
});

it('viewer dialog has an explicit accessible name', () => {
  render(<PhotoLightbox images={images} open onClose={vi.fn()} />);
  expect(screen.getByRole('dialog', { name: 'Photo viewer' })).toBeVisible();
});

it('shared dialog contains focus and returns it to the opener after one close callback', async () => {
  const closed = vi.fn();
  function Host() { const [open, setOpen] = useState(false); return <><button onClick={() => setOpen(true)}>Open photos</button><button>Background action</button><PhotoLightbox images={images} open={open} onClose={() => { closed(); setOpen(false); }} /></>; }
  render(<Host />);const opener=screen.getByRole('button', { name: 'Open photos' });opener.focus();fireEvent.click(opener);
  const viewer=screen.getByRole('dialog', { name: 'Photo viewer' });
  await waitFor(() => expect(viewer).toContainElement(document.activeElement as HTMLElement));
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(opener).toHaveFocus());expect(closed).toHaveBeenCalledOnce();
});

it('thumbnail controls announce localized photo names and exactly one current photo', () => {
  locale.language = 'ru';
  render(<PhotoLightbox images={images} open onClose={vi.fn()} />);
  const first = screen.getByRole('button', { name: 'Фото 1 из 3' });
  expect(first).toHaveAttribute('aria-current', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Фото 3 из 3' }));
  expect(first).not.toHaveAttribute('aria-current');
  expect(screen.getByRole('button', { name: 'Фото 3 из 3' })).toHaveAttribute('aria-current', 'true');
  expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
});
