import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocationStep } from '../LocationStep';
import { initialFormData } from '@/hooks/property-wizard/initialData';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/property/ProjectLocationPicker', () => ({ ProjectLocationPicker: () => null }));
vi.mock('@/components/shared/GooglePlacesAutocomplete', () => ({ GooglePlacesAutocomplete: () => null }));
afterEach(cleanup);
describe('catalogue-only location fields', () => {
  it.each(['en', 'ru', 'th'])('does not accept access credentials in managed %s drafts', language => {
    state.language = language;
    const { container } = render(<LocationStep formData={initialFormData} updateFormData={vi.fn()} catalogueOnly />);
    expect(container.querySelector('input[type=password]')).toBeNull();
    expect(screen.getByText(language === 'en' ? /Access codes and other private/ : language === 'ru' ? /Коды доступа и другие/ : /ไม่สามารถกรอกรหัสเข้าที่พัก/)).toBeInTheDocument();
  });
  it('preserves the separate independent-author input', () => {
    state.language = 'en'; render(<LocationStep formData={initialFormData} updateFormData={vi.fn()} />);
    expect(screen.getByLabelText('Access code')).toBeInTheDocument();
  });
});
