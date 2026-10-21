import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnderlineInput } from './UnderlineInput';

afterEach(cleanup);
describe('UnderlineInput accessible field identity', () => {
  it('connects each visible label to its unique input', () => {
    render(<><UnderlineInput label="New password" type="password" value="" onChange={vi.fn()} /><UnderlineInput label="Confirm password" type="password" value="" onChange={vi.fn()} /></>);
    const password = screen.getByLabelText('New password');
    const confirmation = screen.getByLabelText('Confirm password');
    expect(password).toHaveAttribute('type', 'password');
    expect(password.id).toBeTruthy();
    expect(password.id).not.toBe(confirmation.id);
  });
  it('preserves caller identity and description while exposing validation errors', () => {
    const { rerender } = render(<UnderlineInput id="employee-email" label="Email" value="" onChange={vi.fn()} aria-describedby="email-help" error="Required" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'employee-email');
    expect(input).toHaveAttribute('aria-describedby', 'email-help employee-email-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById('employee-email-error')).toHaveTextContent('Required');
    rerender(<UnderlineInput id="employee-email" label="Email" value="" onChange={vi.fn()} aria-describedby="email-help" />);
    expect(input).toHaveAttribute('aria-describedby', 'email-help');
    expect(input).not.toHaveAttribute('aria-invalid');
  });
});
