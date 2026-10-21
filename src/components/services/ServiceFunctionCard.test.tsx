import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceFunctionCard } from './ServiceFunctionCard';
import { HOME_SERVICE_FUNCTIONS } from '@/lib/config/homeServiceFunctions';
import type { LocalizedServiceFunction } from '@/hooks/useServiceFunctions';
let language = 'en';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language }) }));
const raw = HOME_SERVICE_FUNCTIONS[0];
const fn: LocalizedServiceFunction = {
  ...raw, name: raw.nameEn, description: raw.descriptionEn,
  estimatedTime: raw.estimatedTimeEn, includes: raw.includesEn, raw,
};
beforeEach(() => { language = 'en'; });
describe('catalogue request row', () => {
  it('exposes one named action without nested buttons or decorative emoji', () => {
    const onClick = vi.fn();
    render(<ServiceFunctionCard fn={fn} catalogue onClick={onClick} />);
    const button = screen.getByRole('button', { name: `${fn.name} Request service` });
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(within(button).getByText('Request service')).toBeVisible();
    expect(button).toHaveAccessibleDescription(`${fn.includes.slice(0, 3).join(' · ')} from ฿${fn.basePrice.toLocaleString()} ${fn.estimatedTime}`);
    expect(screen.queryByText(fn.icon)).toBeNull();
    expect(button).toHaveClass('focus-visible:ring-2');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
  it('retains urgent request meaning without claiming confirmed availability', () => {
    render(<ServiceFunctionCard fn={{ ...fn, isUrgent: true }} catalogue />);
    expect(screen.getByText('Urgent request')).toBeVisible();
    expect(screen.queryByText('Book')).toBeNull();
  });
  it('keeps the visible Russian request action', () => {
    language = 'ru';
    render(<ServiceFunctionCard fn={fn} catalogue />);
    expect(screen.getByRole('button', { name: `${fn.name} Оставить заявку` })).toBeVisible();
  });
  it('does not change other compact placements', () => {
    render(<ServiceFunctionCard fn={fn} compact />);
    expect(screen.getByText(fn.icon)).toBeVisible();
    expect(screen.queryByTestId('service-request-card')).toBeNull();
  });
});
