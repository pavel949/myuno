import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { useUrlSearchDraft } from './useUrlSearchDraft';

afterEach(cleanup);

it('keeps multiword typing urgent through older URL acknowledgments and restores Back/Forward bookmarks', async () => {
  const writes: (() => void)[] = [];
  function Catalogue() {
    const location = useLocation();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [text, update] = useUrlSearchDraft(params.get('q') ?? '', next => {
      const nextParams = new URLSearchParams(params);
      if (next) nextParams.set('q', next); else nextParams.delete('q');
      writes.push(() => navigate({ pathname: location.pathname, search: nextParams.toString(), hash: location.hash }, { replace: true, state: location.state }));
    });
    return <>
      <input type="search" aria-label="Find a service" value={text} onChange={event => update(event.target.value)} />
      <button onClick={() => writes.shift()?.()}>Commit</button>
      <button onClick={() => navigate(-1)}>Back</button>
      <button onClick={() => navigate(1)}>Forward</button>
      <output>{location.search}{location.hash} {location.state?.source}</output>
    </>;
  }
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[
    '/services?q=previous', { pathname: '/services', search: '?category=home&q=deep', hash:'#results', state:{ source:'fixture' } },
  ]}><Catalogue /></MemoryRouter>);
  const field = screen.getByRole<HTMLInputElement>('searchbox');
  expect(field.value).toBe('deep');
  field.focus();
  for (const value of ['z', 'zz-no-match', 'zz-no-match two words']) {
    fireEvent.change(field, { target: { value } });
    expect(field.value).toBe(value);
  }
  expect(field).toHaveFocus();
  const commit = screen.getByRole('button', { name: 'Commit' });
  fireEvent.click(commit);
  await screen.findByText('?category=home&q=z#results fixture');
  expect(field.value).toBe('zz-no-match two words');
  fireEvent.click(commit);
  await screen.findByText('?category=home&q=zz-no-match#results fixture');
  expect(field.value).toBe('zz-no-match two words');
  fireEvent.click(commit);
  await screen.findByText('?category=home&q=zz-no-match+two+words#results fixture');
  expect(field).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  await waitFor(() => expect(field.value).toBe('previous'));
  fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
  await waitFor(() => expect(field.value).toBe('zz-no-match two words'));
  fireEvent.change(field, { target: { value: '' } });
  expect(field.value).toBe('');
  fireEvent.click(commit);
  await screen.findByText('?category=home#results fixture');
  expect(field.value).toBe('');
});
