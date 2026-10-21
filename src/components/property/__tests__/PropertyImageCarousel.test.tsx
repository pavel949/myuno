import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PropertyImageCarousel } from '../PropertyImageCarousel';
const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
vi.mock('embla-carousel-react', () => ({ default: () => [vi.fn(), undefined] }));
afterEach(() => { cleanup(); locale.language = 'en'; });
describe('real property gallery fallback', () => {
  it('skips a failed first image to the next actual gallery image', () => {
    render(<PropertyImageCarousel images={['/bad.jpg', '/actual.jpg']} alt="Home" />);
    fireEvent.error(screen.getByRole('img', { name: 'Home' }));
    expect(screen.getByRole('img', { name: 'Home' })).toHaveAttribute('src', '/actual.jpg');
  });
  it.each(['en', 'ru', 'th'])('uses a neutral localized placeholder after all images fail (%s)', language => {
    locale.language = language;
    const { container } = render(<PropertyImageCarousel images={['/bad.jpg', '/also-bad.jpg']} />);
    fireEvent.error(container.querySelector('img')!);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img')).toHaveAccessibleName(language === 'ru' ? 'Фото недоступно' : language === 'th' ? 'ไม่มีรูปภาพ' : 'Photo unavailable');
  });
  it('resets failed state when the property gallery changes', () => {
    const { rerender } = render(<PropertyImageCarousel images={['/bad.jpg']} alt="First" />);
    fireEvent.error(screen.getByRole('img', { name: 'First' }));
    rerender(<PropertyImageCarousel images={['/new-home.jpg', '/bad.jpg']} alt="Second" />);
    expect(screen.getByRole('img', { name: 'Second' })).toHaveAttribute('src', '/new-home.jpg');
  });
  it('retries the image when the parent switches property identity with the same gallery', () => {
    const { rerender } = render(<PropertyImageCarousel key="first-property" images={['/shared.jpg']} alt="First" />);
    fireEvent.error(screen.getByRole('img', { name: 'First' }));
    rerender(<PropertyImageCarousel key="second-property" images={['/shared.jpg']} alt="Second" />);
    expect(screen.getByRole('img', { name: 'Second' })).toHaveAttribute('src', '/shared.jpg');
  });
  it('handles image failures after carousel activation without a replacement photo', () => {
    const { container } = render(<PropertyImageCarousel images={['/bad.jpg', '/actual.jpg']} />);
    fireEvent.mouseEnter(container.firstElementChild!);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toHaveAttribute('src', '/actual.jpg');
  });
  it('does not request empty URLs or duplicate failed URLs', () => {
    const { container } = render(<PropertyImageCarousel images={['', '/bad.jpg', '/bad.jpg']} />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img')).toHaveAccessibleName('Photo unavailable');
  });
});
