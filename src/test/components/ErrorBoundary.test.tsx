import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const telemetry = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock('@sentry/react', () => telemetry);
beforeEach(() => { telemetry.captureException.mockReset(); });
afterEach(cleanup);

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
    
    expect(container.textContent).toContain('This page failed to load');
    // ErrorBoundary shows user-friendly message, not technical error details (by design)
    expect(container.textContent?.toLowerCase()).toContain('try again');
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
    
    expect(container.textContent).toContain('This page failed to load');
    
    // Check that try again button exists
    const tryAgainButton = container.querySelector('button');
    expect(tryAgainButton).toBeTruthy();
    expect(tryAgainButton?.textContent).toContain('Try again');
  });

  it('reports the original error and React context asynchronously', async () => {
    const onError = vi.fn();
    render(<ErrorBoundary onError={onError}><ThrowError shouldThrow /></ErrorBoundary>);
    await waitFor(() => expect(telemetry.captureException).toHaveBeenCalledWith(onError.mock.calls[0][0], {
      contexts: { react: { componentStack: expect.stringContaining('ThrowError') } },
      tags: { source: 'ErrorBoundary' },
    }));
  });

  it('preserves the fallback and onError callback when telemetry fails', async () => {
    telemetry.captureException.mockImplementation(() => { throw new Error('Telemetry unavailable'); });
    const onError = vi.fn();
    const { container } = render(<ErrorBoundary onError={onError}><ThrowError shouldThrow /></ErrorBoundary>);
    expect(onError).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(telemetry.captureException).toHaveBeenCalledTimes(1));
    expect(container.textContent).toContain('This page failed to load');
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
