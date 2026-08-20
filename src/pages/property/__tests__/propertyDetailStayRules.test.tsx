/**
 * Smoke test for the PropertyDetail stay-rules / sleeping-arrangements blocks.
 *
 * Guards two regressions:
 *  1. The PropertyDetail module still compiles and imports cleanly (barrel of
 *     ~80 sub-components), so a missing export cannot ship unnoticed.
 *  2. Partial or malformed rental-terms data renders the known rows and hides
 *     the rest instead of crashing the page.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StayRulesSection } from '@/components/property/StayRulesSection';
import { PropertySleepingArrangements } from '@/components/property/PropertySleepingArrangements';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: () => {}, t: (k: string) => k }),
}));

describe('PropertyDetail stay rules', () => {
  it('imports the PropertyDetail page module without throwing', async () => {
    const mod = await import('../PropertyDetail');
    expect(mod.default).toBeTypeOf('function');
  }, 30_000); // large module graph: generous timeout keeps CI stable

  it('renders only the stay-rule rows that are present', () => {
    render(<StayRulesSection minStayNights={3} bookingWindowMonths={12} />);

    expect(screen.getByText('Stay rules')).toBeInTheDocument();
    expect(screen.getByText('Minimum stay')).toBeInTheDocument();
    expect(screen.getByText('3 nights')).toBeInTheDocument();
    expect(screen.getByText('12 months')).toBeInTheDocument();
    expect(screen.queryByText('Maximum stay')).not.toBeInTheDocument();
    expect(screen.queryByText('Advance notice')).not.toBeInTheDocument();
  });

  it('hides the stay-rules section when every field is absent or unusable', () => {
    const { container } = render(
      <StayRulesSection
        minStayNights={null}
        maxStayNights={0}
        advanceNoticeHours={undefined}
        preparationDays={'' as unknown as number}
        bookingWindowMonths={'not-a-number' as unknown as number}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no props are passed at all', () => {
    const { container } = render(<StayRulesSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders sleeping arrangements from structured rooms', () => {
    render(
      <PropertySleepingArrangements
        rooms={[
          { id: 'r1', name: 'Master bedroom', beds: [{ type: 'king', count: 1 }] },
          { id: 'r2', beds: [{ type: 'single', count: 2 }] },
          { id: 'r3', beds: [] },
        ]}
      />,
    );

    expect(screen.getByText("Where you'll sleep")).toBeInTheDocument();
    expect(screen.getByText('Master bedroom')).toBeInTheDocument();
    expect(screen.getByText('1 king bed')).toBeInTheDocument();
    expect(screen.getByText('2 single beds')).toBeInTheDocument();
    expect(screen.getByText('Bedroom 2')).toBeInTheDocument();
  });

  it('survives malformed rooms payloads', () => {
    for (const rooms of [
      undefined,
      null,
      'not json',
      '[]',
      [null, 'x', 42],
      [{ beds: 'nope' }],
      [{ beds: [null, {}, { type: 'unknown_bed', count: 'x' }] }],
      { a: { beds: [{ type: 'queen' }] } },
    ]) {
      expect(() =>
        render(<PropertySleepingArrangements rooms={rooms as unknown} />),
      ).not.toThrow();
    }
  });
});
