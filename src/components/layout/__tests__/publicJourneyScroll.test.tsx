import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { ScrollToTop } from '../ScrollToTop';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('public journey history scroll', () => {
  it('restores the original search position on Back and keeps new detail entries at the top', () => {
    let y = 0;
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y });
    const scrollTo = vi.fn((_x: number, value: number) => { y = value; });
    vi.stubGlobal('scrollTo', scrollTo);
    const disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnect; });
    function Journey() {
      const navigate = useNavigate();
      return <><ScrollToTop /><button onClick={() => navigate('/property/unit')}>Open</button><button onClick={() => navigate(-1)}>Back</button><button onClick={() => navigate(1)}>Forward</button></>;
    }
    render(<MemoryRouter initialEntries={['/property/search?view=map']}><Journey /></MemoryRouter>);
    y = 720;
    fireEvent.click(screen.getByText('Open'));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
    fireEvent.click(screen.getByText('Back'));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 720);
    fireEvent.click(screen.getByText('Forward'));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
    expect(disconnect).toHaveBeenCalled();
  });
});
