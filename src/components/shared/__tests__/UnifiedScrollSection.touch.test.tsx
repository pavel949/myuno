import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { UnifiedScrollSection } from '../UnifiedScrollSection';
afterEach(cleanup);
it('preserves native touch gestures while retaining scroll layout and child actions', () => {
 const { container } = render(<UnifiedScrollSection showFadeIndicators={false}><a href="#synthetic-service">Synthetic service</a></UnifiedScrollSection>);
 const rail = container.querySelector('section > div') as HTMLDivElement;
 expect(rail.style.touchAction).toBe('');
 expect(rail).toHaveClass('overflow-x-auto', 'overscroll-x-contain');
 expect(screen.getByRole('link', { name: 'Synthetic service' })).toHaveAttribute('href', '#synthetic-service');
});
