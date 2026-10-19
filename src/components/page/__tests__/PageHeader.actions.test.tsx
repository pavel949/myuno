import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
const state = vi.hoisted(() => ({ mobile: true }));
vi.mock('@/hooks/useBreakpoint', () => ({ useBreakpoint: () => ({ isMobile: state.mobile }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('@/hooks/useFeedbackSettings', () => ({ getFeedbackSettings: () => ({}) }));
afterEach(cleanup);
describe('PageHeader reachable actions', () => {
  it('keeps explicit mobile secondary actions visible and operable', () => {
    state.mobile = true;
    const open = vi.fn();
    render(<MemoryRouter><PageHeader title="Объект" actions={[{label:'Документы',mobileHidden:false,onClick:open}]}/></MemoryRouter>);
    fireEvent.click(screen.getByRole('button',{name:'Документы'}));
    expect(open).toHaveBeenCalledOnce();
  });
  it('uses a labelled primary action even without an icon', () => {
    state.mobile = true;
    render(<MemoryRouter><PageHeader title="Объект" actions={[{label:'Сохранить',variant:'primary',onClick:vi.fn()}]}/></MemoryRouter>);
    const action=screen.getByRole('button',{name:'Сохранить'});
    expect(action).toHaveAttribute('type','button');
    expect(action.querySelector('span')).not.toHaveClass('hidden');
  });
  it('offers collapsed actions through a localized menu', () => {
    state.mobile = true;
    render(<MemoryRouter><PageHeader title="Объект" showBack actions={[{label:'Архив',onClick:vi.fn()}]}/></MemoryRouter>);
    expect(screen.getByRole('button',{name:'Другие действия'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Назад'})).toBeInTheDocument();
  });
  it('retains all desktop actions and real breadcrumb links', () => {
    state.mobile = false;
    render(<MemoryRouter><PageHeader title="Объект" breadcrumbs={[{label:'Объекты',href:'/mc/properties'}]} actions={[{label:'Архив',mobileHidden:true,onClick:vi.fn()}]}/></MemoryRouter>);
    expect(screen.getByRole('button',{name:'Архив'})).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Объекты'})).toHaveAttribute('href','/mc/properties');
  });
});
