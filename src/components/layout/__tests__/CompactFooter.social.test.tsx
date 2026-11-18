import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CompactFooter } from '../CompactFooter';
const state = vi.hoisted(() => ({desktop:false,data:{} as Record<string,string>}));
vi.mock('@/hooks/usePlatformSocialLinks',()=>({usePlatformSocialLinks:()=>({data:state.data})}));
vi.mock('@/hooks/useBreakpoint',()=>({useBreakpoint:()=>({isLargeDesktop:state.desktop})}));
vi.mock('@/hooks/usePWAInstall',()=>({usePWAInstall:()=>({isInstalled:true,canInstall:false,isIOS:false,install:vi.fn()})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
afterEach(cleanup);
describe('configured social profiles in the app footer',()=>{
  it.each([false,true])('shows all saved profiles on desktop=%s',desktop=>{
    state.desktop=desktop;state.data={youtube:'https://youtube.com/@synthetic',instagram:'https://instagram.com/synthetic',linkedin:'https://linkedin.com/company/synthetic',facebook:'https://facebook.com/synthetic'};
    render(<MemoryRouter><CompactFooter /></MemoryRouter>);
    for(const [label,key] of [['YouTube','youtube'],['Instagram','instagram'],['LinkedIn','linkedin'],['Facebook','facebook']]){
      const link=screen.getByRole('link',{name:label});expect(link).toHaveAttribute('href',state.data[key]);expect(link).toHaveAttribute('target','_blank');expect(link).toHaveAttribute('rel','noopener noreferrer');
    }
    expect(screen.getByRole('link',{name:'Telegram'})).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'WhatsApp'})).toBeInTheDocument();
  });
  it('hides blank profiles without substituting hardcoded Instagram',()=>{
    state.data={};render(<MemoryRouter><CompactFooter /></MemoryRouter>);
    for(const name of ['YouTube','Instagram','LinkedIn','Facebook'])expect(screen.queryByRole('link',{name})).toBeNull();
  });
});
