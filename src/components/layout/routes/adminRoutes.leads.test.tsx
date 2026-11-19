import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { adminRoutes } from './adminRoutes';

vi.mock('../pageRegistry', async (importOriginal) => ({
  ...await importOriginal<typeof import('../pageRegistry')>(),
  AdminInbox: function InboxFixture() {
    const { pathname, search, hash } = useLocation();
    const navigate = useNavigate();
    return <>
      <output aria-label="Matched inbox">{pathname}{search}{hash}</output>
      <button type="button" onClick={() => navigate(-1)}>Back</button>
    </>;
  },
}));

describe('legacy admin leads link', () => {
  it('opens the request inbox and preserves canonical source, ID, and fragment without a back-loop', async () => {
    render(
      <MemoryRouter initialEntries={['/before', '/admin/leads?source=consultation_requests&request=lead-1#detail']}>
        <Routes>
          <Route path="/before" element={<p>Previous page</p>} />
          {adminRoutes}
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByLabelText('Matched inbox')).toHaveTextContent(
      '/admin/inbox?source=consultation_requests&request=lead-1#detail',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Previous page')).toBeInTheDocument();
  });
});
