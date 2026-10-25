import { cleanup,render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach,expect,it,vi } from 'vitest';
import FullManagement from './FullManagement';
const state=vi.hoisted(()=>({language:'en',submit:vi.fn()}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:state.language})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:null})}));
vi.mock('@/hooks/useConsultationRequests',()=>({useConsultationRequests:()=>({requestFullManagement:{mutateAsync:state.submit}})}));
vi.mock('@/hooks/usePropertyCare',()=>({useOwnerProperties:()=>({data:[]})}));
afterEach(cleanup);
it.each([['en','Individual proposal'],['ru','Индивидуальное предложение'],['th','ข้อเสนอเฉพาะ']])('describes assessment and individual management terms in %s without fixed shares', (language,label)=>{
 state.language=language;const {container}=render(<MemoryRouter><FullManagement/></MemoryRouter>);
 expect(screen.getByText(label)).toBeVisible();expect(container).not.toHaveTextContent(/70%|30%|85%/);expect(state.submit).not.toHaveBeenCalled();
});
