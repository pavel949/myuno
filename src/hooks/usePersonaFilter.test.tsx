import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it } from 'vitest';
import { usePersonaFilter } from './usePersonaFilter';

const matchesNothing = [{ id: 'unmatched', tags: ['not-a-persona-tag'] }];

function Probe() {
  const { applyFilter, clearPersona, personaTags } = usePersonaFilter();
  const location = useLocation();
  const matching = [{ id: 'matched', tags: [personaTags[0]?.toUpperCase() ?? ''] }, ...matchesNothing];
  return <>
    <output data-testid="legacy">{applyFilter(matchesNothing, item => item.tags).map(item => item.id).join(',')}</output>
    <output data-testid="strict">{applyFilter(matchesNothing, item => item.tags, { strict: true }).map(item => item.id).join(',')}</output>
    <output data-testid="match">{applyFilter(matching, item => item.tags, { strict: true }).map(item => item.id).join(',')}</output>
    <output data-testid="location">{location.search}{location.hash}</output>
    <button onClick={clearPersona}>Search without scenario</button>
  </>;
}

it('only changes no-match behavior for opted-in catalogues and removes only persona on reset', () => {
  render(<MemoryRouter initialEntries={['/flowers?persona=family&q=roses#catalog']}><Probe /></MemoryRouter>);
  expect(screen.getByTestId('legacy')).toHaveTextContent('unmatched');
  expect(screen.getByTestId('strict')).toBeEmptyDOMElement();
  expect(screen.getByTestId('match')).toHaveTextContent(/^matched$/);
  fireEvent.click(screen.getByRole('button', { name: 'Search without scenario' }));
  expect(screen.getByTestId('location')).toHaveTextContent('?q=roses#catalog');
  expect(screen.getByTestId('strict')).toHaveTextContent('unmatched');
});
