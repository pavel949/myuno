import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NbLightbox } from '@/components/newbuilds/NbLightbox';
import { WishlistButton } from '@/components/market/WishlistButton';
import { DealPriorityStars } from '@/components/owner/sales/DealPriorityStars';
import ResetPassword from '@/pages/auth/ResetPassword';

const state = vi.hoisted(() => ({
  language: 'en', saved: false, toggleWishlist: vi.fn(), updateUser: vi.fn(), signOut: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ signOut: state.signOut }) }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: state.language,
    t: (key: string) => ({
      en: { 'auth.showPassword': 'Show password', 'auth.hidePassword': 'Hide password' },
      ru: { 'auth.showPassword': 'Показать пароль', 'auth.hidePassword': 'Скрыть пароль' },
      th: { 'auth.showPassword': 'แสดงรหัสผ่าน', 'auth.hidePassword': 'ซ่อนรหัสผ่าน' },
    }[state.language as 'en' | 'ru' | 'th'][key as 'auth.showPassword' | 'auth.hidePassword']),
  }),
}));
vi.mock('@/hooks/useUserCollections', () => ({
  useUserCollections: () => ({ isInWishlist: () => state.saved, toggleWishlist: state.toggleWishlist }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: 'synthetic-user' } } } }), updateUser: state.updateUser } },
}));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: () => null }));
vi.mock('@/components/uno/BrandWordmark', () => ({ BrandWordmark: () => <span>myUNO</span> }));
afterEach(cleanup);
beforeEach(() => { state.language = 'en'; state.saved = false; vi.clearAllMocks(); });

const labels = [
  { language: 'en', close: 'Close', next: 'Next image', previous: 'Previous image', open: 'Open image', second: 'Image 2', priority: 'Priority 2', show: 'Show password', hide: 'Hide password' },
  { language: 'ru', close: 'Закрыть', next: 'Следующее фото', previous: 'Предыдущее фото', open: 'Открыть фото', second: 'Фото 2', priority: 'Приоритет 2', show: 'Показать пароль', hide: 'Скрыть пароль' },
  { language: 'th', close: 'ปิด', next: 'รูปภาพถัดไป', previous: 'รูปภาพก่อนหน้า', open: 'เปิดรูปภาพ', second: 'รูปภาพ 2', priority: 'ลำดับความสำคัญ 2', show: 'แสดงรหัสผ่าน', hide: 'ซ่อนรหัสผ่าน' },
];

describe.each(labels)('$language accessible controls', labels => {
  beforeEach(() => { state.language = labels.language; });
  it('names lightbox actions and keeps photo selection and close behaviour', () => {
    const onClose = vi.fn();
    render(<NbLightbox images={['/synthetic-first.jpg', '/synthetic-second.jpg']} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: labels.next }));
    expect(screen.getByRole('button', { name: labels.second })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: labels.open })).toHaveAttribute('href', '/synthetic-second.jpg');
    fireEvent.click(screen.getByRole('button', { name: labels.previous }));
    expect(screen.getByRole('button', { name: labels.second })).not.toHaveAttribute('aria-current');
    fireEvent.click(screen.getByRole('button', { name: labels.second }));
    expect(screen.getByRole('link', { name: labels.open })).toHaveAttribute('href', '/synthetic-second.jpg');
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: labels.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('announces the selected priority and preserves clearing it', () => {
    const onChange = vi.fn();
    const { rerender } = render(<DealPriorityStars priority={2} onChange={onChange} />);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: labels.priority, pressed: true }));
    expect(onChange).toHaveBeenCalledWith(0);
    rerender(<DealPriorityStars priority={0} onChange={onChange} />);
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: labels.priority }));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });
  it('names the reset-password visibility toggle without submitting a password', async () => {
    render(<MemoryRouter><ResetPassword /></MemoryRouter>);
    const show = await screen.findByRole('button', { name: labels.show, pressed: false });
    expect(screen.getByLabelText(labels.language === 'ru' ? 'Новый пароль' : 'New password')).toHaveAttribute('name', 'new-password');
    expect(screen.getByLabelText(labels.language === 'ru' ? 'Подтвердите пароль' : 'Confirm password')).toHaveAttribute('name', 'confirm-password');
    fireEvent.click(show);
    expect(screen.getByRole('button', { name: labels.hide, pressed: true })).toBeInTheDocument();
    expect(document.querySelector('input[name="new-password"]')).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: labels.hide }));
    expect(document.querySelector('input[name="new-password"]')).toHaveAttribute('type', 'password');
    expect(state.updateUser).not.toHaveBeenCalled();
    expect(state.signOut).not.toHaveBeenCalled();
  });
});

it.each(['icon', 'full'] as const)('exposes wishlist state in the %s variant and preserves the item id', variant => {
  const { rerender } = render(<WishlistButton productId="synthetic-product" variant={variant} />);
  fireEvent.click(screen.getByRole('button', { pressed: false }));
  expect(state.toggleWishlist).toHaveBeenCalledWith('synthetic-product');
  state.saved = true;
  rerender(<WishlistButton productId="synthetic-product" variant={variant} />);
  expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
});

it('keeps read-only priority controls disabled', () => {
  render(<DealPriorityStars priority={1} />);
  for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
});
