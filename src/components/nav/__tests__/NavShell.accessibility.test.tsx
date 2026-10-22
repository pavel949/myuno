import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { NavShell } from '../NavShell';
vi.mock('@/contexts/LanguageContext', () => ({useLanguage:()=>({language:'ru'})}));
vi.mock('../TopBar', () => ({TopBar:()=> <header>Navigation</header>}));
vi.mock('../BottomBar', () => ({BottomBar:()=> <nav>Mobile navigation</nav>}));
vi.mock('../SideRail', () => ({SideRail:()=>null}));
vi.mock('../ContextualFAB', () => ({ContextualFAB:()=>null}));
function Location(){const loc=useLocation();return <output data-testid="location">{loc.pathname+loc.search+loc.hash}</output>;}
it('moves keyboard focus to the main landmark without changing search history', () => {
 render(<MemoryRouter initialEntries={['/services?q=cleaning']}><NavShell role="guest"><Location/></NavShell></MemoryRouter>);
 fireEvent.click(screen.getByRole('link',{name:'Перейти к содержимому'}));
 expect(screen.getByRole('main')).toHaveFocus();
 expect(screen.getByTestId('location')).toHaveTextContent('/services?q=cleaning');
});
