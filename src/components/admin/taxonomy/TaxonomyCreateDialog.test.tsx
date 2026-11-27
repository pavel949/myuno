import {beforeEach,describe,expect,it,vi} from 'vitest';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
const state=vi.hoisted(()=>({definitions:[] as Array<{type_key:string;sort_order:number}>,create:vi.fn(),isError:false}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/hooks/useTaxonomyDefinitions',()=>({
  VERTICAL_CONFIG:{general:{labelEn:'General',labelRu:'Общие'}},
  useTaxonomyDefinitions:()=>({...state,isCreating:false,isLoading:false}),
}));
import TaxonomyCreateDialog from './TaxonomyCreateDialog';
beforeEach(()=>{state.definitions=[];state.isError=false;state.create.mockReset();state.create.mockResolvedValue({id:'new'});});
function open(){
  const onCreated=vi.fn(); const onOpenChange=vi.fn();
  render(<TaxonomyCreateDialog open onOpenChange={onOpenChange} onCreated={onCreated}/>);
  fireEvent.change(screen.getByLabelText('Code'),{target:{value:'vehicle_class'}});
  fireEvent.change(screen.getByLabelText('English name'),{target:{value:'Vehicle class'}});
  return {onCreated,onOpenChange};
}
describe('reference-list authoring',()=>{
  it('creates through the existing writer and opens the saved definition',async()=>{
    const handlers=open();
    fireEvent.click(screen.getByRole('button',{name:'Create reference list'}));
    await waitFor(()=>expect(handlers.onCreated).toHaveBeenCalledWith('vehicle_class'));
    expect(state.create).toHaveBeenCalledTimes(1);
    expect(state.create).toHaveBeenCalledWith(expect.objectContaining({type_key:'vehicle_class',name_en:'Vehicle class',is_system:false}));
    expect(handlers.onOpenChange).toHaveBeenCalledWith(false);
  });
  it('rejects duplicate codes without writing another definition',async()=>{
    state.definitions=[{type_key:'vehicle_class',sort_order:1}];
    const handlers=open();
    fireEvent.click(screen.getByRole('button',{name:'Create reference list'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
    expect(state.create).not.toHaveBeenCalled();expect(handlers.onCreated).not.toHaveBeenCalled();
  });
  it('keeps input on a rejected save and offers retry',async()=>{
    state.create.mockRejectedValueOnce(new Error('forbidden'));
    const handlers=open();
    fireEvent.click(screen.getByRole('button',{name:'Create reference list'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('not saved');
    expect(screen.getByLabelText('Code')).toHaveValue('vehicle_class');
    expect(handlers.onCreated).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Create reference list'}));
    await waitFor(()=>expect(handlers.onCreated).toHaveBeenCalledWith('vehicle_class'));
  });
  it('blocks creation if existing codes could not be verified',()=>{
    state.isError=true;open();
    expect(screen.getByRole('button',{name:'Create reference list'})).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not verify');
    expect(state.create).not.toHaveBeenCalled();
  });
});
