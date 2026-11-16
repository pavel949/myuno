import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { SectionHeader } from '../SectionHeader';
import { UnifiedSectionHeader } from '@/components/shared/UnifiedSectionHeader';
import { PageSection } from '@/components/page/PageSection';
import { SectionTitle } from '@/components/uno/SectionCard';
function History() { const loc=useLocation(),nav=useNavigate();return <><output data-testid="route">{loc.pathname+loc.search}</output><button onClick={()=>nav(-1)}>Back</button><button onClick={()=>nav(1)}>Forward</button></>; }
afterEach(cleanup);
it('uses real link semantics and preserves query context through history', () => {
 render(<MemoryRouter initialEntries={['/start']}><SectionHeader title="Homes" action={{ label:'All homes',to:'/property/search?mode=rent&district=kamala' }} /><History /></MemoryRouter>);
 fireEvent.click(screen.getByRole('link',{name:'All homes'}));expect(screen.getByTestId('route')).toHaveTextContent('/property/search?mode=rent&district=kamala');
 fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(screen.getByTestId('route')).toHaveTextContent('/start');
 fireEvent.click(screen.getByRole('button',{name:'Forward'}));expect(screen.getByTestId('route')).toHaveTextContent('district=kamala');
});
it('keeps an imperative action a non-submitting button inside a form', () => {
 const action=vi.fn(),submit=vi.fn(e=>e.preventDefault());render(<form onSubmit={submit}><SectionHeader title="Workspace" action={{label:'Refresh',onClick:action}} /></form>);
 fireEvent.click(screen.getByRole('button',{name:'Refresh'}));expect(action).toHaveBeenCalledOnce();expect(submit).not.toHaveBeenCalled();
});
it('preserves UnifiedSectionHeader callback precedence, refs, count and child metadata', () => {
 const callback=vi.fn(),ref=createRef<HTMLDivElement>();render(<MemoryRouter><UnifiedSectionHeader ref={ref} title="Services" count={4} viewAllPath="/services" onViewAll={callback} viewAllLabel="More"><p>Metadata</p></UnifiedSectionHeader></MemoryRouter>);
 expect(ref.current).toBeInstanceOf(HTMLDivElement);expect(screen.getByText('4')).toBeVisible();expect(screen.getByText('Metadata')).toBeVisible();expect(screen.queryByRole('link')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'More'}));expect(callback).toHaveBeenCalledOnce();
});
it('does not remount editable section content when header copy changes', () => {
 const view=render(<PageSection title="Initial"><input aria-label="Draft" defaultValue="" /></PageSection>);fireEvent.change(screen.getByLabelText('Draft'),{target:{value:'Unsaved draft'}});
 view.rerender(<PageSection title="Updated" subtitle="New metadata"><input aria-label="Draft" defaultValue="" /></PageSection>);expect(screen.getByLabelText('Draft')).toHaveValue('Unsaved draft');
});
it('preserves h3 depth and structured title content in the legacy title adapter', () => {
 render(<SectionTitle subtitle="Details"><span>Shared title</span></SectionTitle>);expect(screen.getByRole('heading',{level:3,name:'Shared title'})).toBeVisible();expect(screen.queryByRole('heading',{level:2})).toBeNull();
});
it('keeps public anchor IDs and legacy hidden-zero count behavior', () => {
 render(<MemoryRouter><SectionHeader title="Areas" headingId="areas" density="public" /><UnifiedSectionHeader title="Empty count" count={0} /></MemoryRouter>);expect(screen.getByRole('heading',{name:'Areas'})).toHaveAttribute('id','areas');expect(screen.queryByText('0')).toBeNull();
});
