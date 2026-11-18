import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import ExperienceCategoriesPage from '../ExperienceCategoriesPage';
const state=vi.hoisted(()=>({create:vi.fn().mockResolvedValue({}),update:vi.fn(),error:null as Error|null}));
vi.mock('@/components/page/PageShell',()=>({PageShell:({children}:{children:React.ReactNode})=><main>{children}</main>}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/hooks/useExperienceCategories',()=>({useAdminExperienceCategories:()=>({categories:[{id:'existing',slug:'island-hopping',name_en:'Island trips',name_ru:'Острова',icon:'🏝️',is_active:true,experience_type:'tour',sort_order:1}],isLoading:false,error:state.error,refetch:vi.fn(),create:state.create,update:state.update,remove:vi.fn(),isCreating:false,isUpdating:false,isDeleting:false})}));
beforeEach(()=>{state.create.mockClear();state.update.mockClear();state.error=null;});afterEach(cleanup);
it('exposes all planned sections without writing data on view',()=>{
 render(<ExperienceCategoriesPage/>);
 expect(screen.getByText('🧘 Wellness & relaxation')).toBeInTheDocument();
 expect(screen.getByText('🎉 Events & celebrations')).toBeInTheDocument();
 expect(state.create).not.toHaveBeenCalled();
});
it('prepares a hidden category in the existing explicit-save editor',async()=>{
 render(<ExperienceCategoriesPage/>);
 const row=screen.getByText('Water parks').parentElement!;
 fireEvent.click(within(row).getByRole('button',{name:'Prepare'}));
 const dialog=screen.getByRole('dialog');
 expect(within(dialog).getByDisplayValue('waterpark')).toBeInTheDocument();
 expect(within(dialog).getByRole('switch')).toHaveAttribute('data-state','unchecked');
 expect(state.create).not.toHaveBeenCalled();
 fireEvent.click(within(dialog).getByRole('button',{name:'Save'}));
 expect(state.create).toHaveBeenCalledWith(expect.objectContaining({slug:'waterpark',is_active:false}));
});
it('finds an existing alias rather than preparing a duplicate',()=>{
 render(<ExperienceCategoriesPage/>);
 const row=screen.getAllByText('Island trips').find(el=>el.tagName==='SPAN')!.parentElement!;
 fireEvent.click(within(row).getByRole('button',{name:'Edit'}));
 expect(within(screen.getByRole('dialog')).getByDisplayValue('island-hopping')).toBeDisabled();
 expect(state.create).not.toHaveBeenCalled();
});
it('blocks template creation after registry read failure',()=>{
 state.error=Error('synthetic');render(<ExperienceCategoriesPage/>);
 expect(screen.getByRole('alert')).toHaveTextContent('avoid duplicates');
 for (const button of screen.getAllByRole('button',{name:'Prepare'})) expect(button).toBeDisabled();
});
