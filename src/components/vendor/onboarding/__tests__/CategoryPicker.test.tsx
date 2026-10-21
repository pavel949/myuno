import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoryPicker } from '../CategoryPicker';
import { VERTICAL_GROUPS } from '@/lib/verticalGroups';

const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/ui/dynamic-icon', () => ({ DynamicIcon: () => <svg aria-hidden="true" /> }));
afterEach(cleanup);

describe.each([
  { language: 'en', group: 'Other', category: 'Other business' },
  { language: 'ru', group: 'Другое', category: 'Другой бизнес' },
])('$language vendor intake', labels => {
  it('retains existing groups and sends the catch-all through the existing category callback', async () => {
    state.language = labels.language;
    const onChange = vi.fn();
    const { rerender } = render(<CategoryPicker value="" onChange={onChange} />);
    for (const group of VERTICAL_GROUPS.filter(group => group.id !== 'help')) {
      expect(screen.getByRole('button', { name: new RegExp(labels.language === 'ru' ? group.labelRu : group.labelEn) })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button', { name: new RegExp(labels.group) }));
    fireEvent.click(await screen.findByRole('button', { name: labels.category }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('other', labels.category);
    rerender(<CategoryPicker value="other" onChange={onChange} />);
    expect(await screen.findByText(labels.category)).toBeInTheDocument();
  });
});
