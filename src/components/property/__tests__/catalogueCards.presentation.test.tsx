import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {OffplanProjectCard} from '../OffplanProjectCard';
import {ResalePropertyCard} from '../ResalePropertyCard';
import type {OffplanProject} from '@/hooks/useOffplanProjects';
import type {ResaleProperty} from '@/hooks/useResaleProperties';
const state=vi.hoisted(()=>({language:'en',toggle:vi.fn(),user:null as null|{id:string}}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:state.language})}));
vi.mock('@/contexts/CurrencyContext',()=>({useCurrency:()=>({formatPrice:(p:number)=>`THB ${p}`})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:state.user})}));
vi.mock('@/hooks/useUserCollections',()=>({useUserCollections:()=>({isInCollection:()=>false,toggleCollection:state.toggle})}));
afterEach(()=>{cleanup();state.language='en';state.user=null;vi.clearAllMocks();});
const project={id:'project',nameEn:'Synthetic project',nameRu:'Тестовый проект',projectStatus:'under_construction',constructionProgress:65,coverImage:'/bright.svg',unitsAvailable:0,priceFrom:5000000,isClearviewRated:false} as OffplanProject;
const resale={id:'resale',title:'Synthetic resale',title_ru:'Тестовая квартира',asking_price:6000000,original_purchase_price:5000000,is_assignment:true,title_type:'freehold'} as ResaleProperty;
function Location(){const l=useLocation();return <output data-testid="location">{l.pathname}</output>;}
function mount(child:React.ReactNode){return render(<MemoryRouter>{child}<Location/></MemoryRouter>);}
describe('catalogue card presentation preserves domain contracts',()=>{
 it.each(['click','native link contract'])('navigates project using %s',action=>{mount(<OffplanProjectCard project={project}/>);const card=screen.getByRole('link',{name:project.nameEn});if(action==='click')fireEvent.click(card);else {card.focus();expect(card).toHaveAttribute('href');fireEvent.click(card);}expect(screen.getByTestId('location')).toHaveTextContent('/property/offplan/project');});
 it.each(['click','native link contract'])('navigates resale using %s',action=>{mount(<ResalePropertyCard property={resale}/>);const card=screen.getByRole('link',{name:resale.title});if(action==='click')fireEvent.click(card);else {card.focus();expect(card).toHaveAttribute('href');fireEvent.click(card);}expect(screen.getByTestId('location')).toHaveTextContent('/property/resale/resale');});
 it('retains custom resale callback instead of navigation',()=>{const cb=vi.fn();mount(<ResalePropertyCard property={resale} onClick={cb}/>);fireEvent.click(screen.getByRole('link'));expect(cb).toHaveBeenCalledOnce();expect(screen.getByTestId('location')).toHaveTextContent('/');});
 it('keeps actual price/premium and never invents ROI',()=>{mount(<ResalePropertyCard property={resale}/>);expect(screen.getByText('THB 6000000')).toBeInTheDocument();expect(screen.getByText('THB 5000000')).toBeInTheDocument();expect(screen.getByText('+20%')).toBeInTheDocument();expect(screen.queryByText(/ROI:/)).not.toBeInTheDocument();});
 it('does not show zero construction progress or completed progress',()=>{const {rerender}=mount(<OffplanProjectCard project={{...project,constructionProgress:0}}/>);expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();rerender(<MemoryRouter><OffplanProjectCard project={{...project,projectStatus:'completed'}}/></MemoryRouter>);expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();});
 it.each(['en','ru'])('names construction progress with its project in %s',language=>{state.language=language;mount(<OffplanProjectCard project={project}/>);expect(screen.getByRole('progressbar',{name:language==='ru'?'Тестовый проект — Прогресс строительства':'Synthetic project — Construction progress'})).toHaveAttribute('aria-valuenow','65');});
 it('keeps unrated disclosure and actual progress',()=>{mount(<OffplanProjectCard project={project}/>);expect(screen.getByText('Not ClearView rated')).toBeInTheDocument();expect(screen.getByText('65%')).toBeInTheDocument();expect(screen.queryByText('BUY')).not.toBeInTheDocument();});
 it.each(['BUY','WATCH','AVOID'] as const)('retains supplied ClearView %s only',rec=>{mount(<OffplanProjectCard project={{...project,isClearviewRated:true,offplanCatalog:{rec} as OffplanProject['offplanCatalog']}}/>);expect(screen.getByText(rec)).toBeInTheDocument();expect(screen.queryByText('Not ClearView rated')).not.toBeInTheDocument();});
 it('nested favourite Enter does not trigger primary project link',()=>{mount(<OffplanProjectCard project={project}/>);fireEvent.keyDown(screen.getByRole('button',{name:'Add to favourites'}),{key:'Enter'});expect(screen.getByTestId('location')).toHaveTextContent('/');expect(state.toggle).not.toHaveBeenCalled();});
 it('preserves authenticated favourite payload without parent navigation',()=>{state.user={id:'synthetic'};mount(<OffplanProjectCard project={project}/>);fireEvent.click(screen.getByRole('button',{name:'Add to favourites'}));expect(state.toggle).toHaveBeenCalledWith('newbuild_project','project',{name:project.nameEn,name_en:project.nameEn,name_ru:project.nameRu,cover_image:'/bright.svg',district:undefined,price:5000000,currency:'THB'});expect(screen.getByTestId('location')).toHaveTextContent('/');});
});
