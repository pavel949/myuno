import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaxonomyDefinitions, VERTICAL_CONFIG, type TaxonomyVertical } from '@/hooks/useTaxonomyDefinitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onCreated: (key: string) => void; }

export default function TaxonomyCreateDialog({open, onOpenChange, onCreated}: Props) {
  const {language}=useLanguage();
  const t=(en:string,ru:string)=>language==='ru'?ru:en;
  const {definitions,create,isCreating,isLoading,isError}=useTaxonomyDefinitions();
  const [key,setKey]=useState('');
  const [nameEn,setNameEn]=useState('');
  const [nameRu,setNameRu]=useState('');
  const [vertical,setVertical]=useState<TaxonomyVertical>('general');
  const [hierarchy,setHierarchy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const busy=isCreating||submitting;
  const close=(next:boolean)=>{if(!busy)onOpenChange(next);};
  const save=async(event:React.FormEvent)=>{
    event.preventDefault();
    if(busy||isLoading||isError)return;
    const normalized=key.trim();
    if(!/^[a-z][a-z0-9_]{1,63}$/.test(normalized)||!nameEn.trim()){
      setError(t('Enter a code using lowercase letters, digits and underscores, and an English name.','Укажите код из строчных латинских букв, цифр и подчёркиваний и название на английском.'));return;
    }
    if(definitions.some(d=>d.type_key.toLowerCase()===normalized)){
      setError(t('This code already exists. Open the existing reference list.','Этот код уже существует. Откройте существующий справочник.'));return;
    }
    setSubmitting(true);setError(null);
    try{
      await create({type_key:normalized,name_en:nameEn.trim(),name_ru:nameRu.trim(),
        vertical,supports_hierarchy:hierarchy,icon:'📋',metadata_schema:{},
        is_system:false,is_active:true,sort_order:Math.max(0,...definitions.map(d=>d.sort_order??0))+1});
      onCreated(normalized);onOpenChange(false);
    }catch{
      setError(t('The reference list was not saved. Check access or try again.','Справочник не сохранён. Проверьте доступ или повторите попытку.'));
    }finally{setSubmitting(false);}
  };
  return <Dialog open={open} onOpenChange={close}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{t('New reference list','Новый справочник')}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="taxonomy-new-code">{t('Code','Код')}</Label>
          <Input id="taxonomy-new-code" value={key} onChange={e=>setKey(e.target.value)} autoComplete="off" disabled={busy} required/>
        </div>
        <div className="space-y-2"><Label htmlFor="taxonomy-new-en">{t('English name','Название на английском')}</Label>
          <Input id="taxonomy-new-en" value={nameEn} onChange={e=>setNameEn(e.target.value)} disabled={busy} required/>
        </div>
        <div className="space-y-2"><Label htmlFor="taxonomy-new-ru">{t('Russian name','Название на русском')}</Label>
          <Input id="taxonomy-new-ru" value={nameRu} onChange={e=>setNameRu(e.target.value)} disabled={busy}/>
        </div>
        <div className="space-y-2"><Label htmlFor="taxonomy-new-area">{t('Area','Направление')}</Label>
          <select id="taxonomy-new-area" className="flex min-h-11 w-full rounded-md border bg-background px-3 text-sm" value={vertical} disabled={busy} onChange={e=>setVertical(e.target.value as TaxonomyVertical)}>
            {Object.entries(VERTICAL_CONFIG).map(([value,label])=><option value={value} key={value}>{language==='ru'?label.labelRu:label.labelEn}</option>)}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={hierarchy} disabled={busy} onChange={e=>setHierarchy(e.target.checked)}/>{t('Allow nested values','Разрешить вложенные значения')}</label>
        {(error||isError)&&<p role="alert" className="text-sm text-destructive">{error||t('Could not verify existing reference lists. Retry loading them before creating one.','Не удалось проверить существующие справочники. Сначала повторите их загрузку.')}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={()=>close(false)}>{t('Cancel','Отмена')}</Button>
          <Button type="submit" disabled={busy||isLoading||isError}>{busy?t('Saving…','Сохраняем…'):t('Create reference list','Создать справочник')}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
