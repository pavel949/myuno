import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    
    expect(container.textContent).toContain('Child content');
  });

  it('renders error UI when child throws', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(container.textContent).toContain('Something went wrong');
    // ErrorBoundary shows user-friendly message, not technical error details (by design)
    expect(container.textContent).toContain('try again');
  });

  it('renders custom fallback when provided', () => {
    const { container } = render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(container.textContent).toContain('Custom fallback');
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('shows try again button when error occurs', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(container.textContent).toContain('Something went wrong');
    
    // Check that try again button exists
    const tryAgainButton = container.querySelector('button');
    expect(tryAgainButton).toBeTruthy();
    expect(tryAgainButton?.textContent).toContain('Try again');
  });

  it('detects chunk loading errors', () => {
    const ChunkError = () => {
      throw new Error('Failed to fetch dynamically imported module');
    };
    
    const { container } = render(
      <ErrorBoundary>
        <ChunkError />
      </ErrorBoundary>
    );
    
    expect(container.textContent).toContain('Connection issue');
    // Should have reload button for chunk errors
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
