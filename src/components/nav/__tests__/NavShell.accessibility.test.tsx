import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { NavShell } from '../NavShell';
vi.mock('@/contexts/LanguageContext', () => ({useLanguage:()=>({language:'ru'})}));
vi.mock('../TopBar', () => ({TopBar:()=> <header>Navigation</header>}));
vi.mock('../BottomBar', () => ({BottomBar:()=> <nav>Mobile navigation</nav>}));
vi.mock('../SideRail', () => ({SideRail:()=>null}));
vi.mock('../ContextualFAB', () => ({ContextualFAB:()=> <button>Quick actions</button>}));
function Location(){const loc=useLocation();return <output data-testid="location">{loc.pathname+loc.search+loc.hash}</output>;}
it('moves keyboard focus to the main landmark without changing search history', () => {
 render(<MemoryRouter initialEntries={['/services?q=cleaning']}><NavShell role="guest"><Location/></NavShell></MemoryRouter>);
 fireEvent.click(screen.getByRole('link',{name:'Перейти к содержимому'}));
 expect(screen.getByRole('main')).toHaveFocus();
 expect(screen.getByTestId('location')).toHaveTextContent('/services?q=cleaning');
});

it.each(['/mc/rates', '/mc/rates/?property=p1'])('keeps the mobile quick action off the rates calendar at %s', path => {
  render(<MemoryRouter initialEntries={[path]}><NavShell role="owner"><Location /></NavShell></MemoryRouter>);
  expect(screen.queryByRole('button', { name: 'Quick actions' })).not.toBeInTheDocument();
  expect(screen.getByRole('navigation')).toHaveTextContent('Mobile navigation');
});

it('still shows the quick action on the owner dashboard', () => {
  render(<MemoryRouter initialEntries={['/mc']}><NavShell role="owner"><Location /></NavShell></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Quick actions' })).toBeInTheDocument();
});
