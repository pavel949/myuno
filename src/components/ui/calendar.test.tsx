import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DateRange } from 'react-day-picker';
import { Calendar } from './calendar';

const october = new Date(2026, 9, 1);
const dayButton = (day: number) => {
  const button = document.querySelector<HTMLButtonElement>(`[data-day="2026-10-${String(day).padStart(2, '0')}"] button`);
  expect(button).not.toBeNull();
  return button!;
};

describe('shared calendar after DayPicker migration', () => {
  it('selects a real date, keeps disabled days blocked and moves keyboard focus', () => {
    function Single() {
      const [selected, setSelected] = useState<Date>();
      return <Calendar mode="single" defaultMonth={october} selected={selected} onSelect={setSelected}
        disabled={new Date(2026, 9, 14)} modifiers={{ checkoutOnly: new Date(2026, 9, 15) }} />;
    }
    render(<Single />);
    expect(dayButton(14)).toBeDisabled();
    const day = dayButton(15);
    expect(day.closest('td')).toHaveClass('rdp-checkout-only');
    fireEvent.click(day);
    expect(day.closest('td')).toHaveAttribute('aria-selected', 'true');
    day.focus();
    fireEvent.keyDown(day, { key: 'ArrowRight', code: 'ArrowRight' });
    expect(dayButton(16)).toHaveFocus();
  });

  it('renders a controlled range and preserves month navigation', () => {
    function Range() {
      const [selected, setSelected] = useState<DateRange>();
      return <Calendar mode="range" defaultMonth={october} selected={selected} onSelect={setSelected} />;
    }
    render(<Range />);
    fireEvent.click(dayButton(15));
    fireEvent.click(dayButton(18));
    expect(dayButton(15).closest('td')).toHaveClass('day-range-start');
    expect(dayButton(18).closest('td')).toHaveClass('day-range-end');
    expect(dayButton(16).closest('td')).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByRole('grid', { name: /November 2026/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }));
    expect(screen.getByRole('grid', { name: /October 2026/ })).toBeInTheDocument();
  });
});
