import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchModerationDetail, type ModerationDetailType } from '@/lib/adminModeration';
import { pickLang } from '@/lib/i18n/pickLang';

export function ModerationDetailDialog({selection,onClose,onReturnFocus}:{selection:{id:string;type:ModerationDetailType;actorId:string}|null;onClose:()=>void;onReturnFocus?:()=>void}) {
  const {user}=useAuth();
  const {language}=useLanguage();
  const active=!!selection && user?.id===selection.actorId;
  const query=useQuery({queryKey:['moderation-detail',user?.id,selection?.type,selection?.id],
    enabled:active, retry:false, staleTime:0,
    queryFn:()=>fetchModerationDetail(selection!.type,selection!.id)});
  const text=(en:string,ru:string,th:string)=>pickLang(language,{en,ru,th});
  const record=active && query.data?.id===selection?.id && query.data?.type===selection?.type ? query.data:null;
  return <Dialog open={active} onOpenChange={open=>{if(!open)onClose();}}>
    <DialogContent onCloseAutoFocus={event=>{event.preventDefault();onReturnFocus?.();}} className="max-w-2xl max-h-[85dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>{text('Review persisted content','Проверка сохранённого контента','ตรวจสอบเนื้อหาที่บันทึก')}</DialogTitle>
        <DialogDescription>{text('Read-only content preview. Close to refresh the queue before making a decision. This is not a specialized editor.','Просмотр без редактирования. Закройте окно, чтобы обновить очередь перед решением. Это не специализированный редактор.','ดูเนื้อหาอย่างเดียว ปิดเพื่อรีเฟรชคิวก่อนตัดสินใจ ไม่ใช่เครื่องมือแก้ไขเฉพาะทาง')}</DialogDescription></DialogHeader>
      {query.isFetching ? <p role="status">{text('Loading record…','Загрузка записи…','กำลังโหลดรายการ…')}</p> : query.isError || !record ? <div role="alert"><p>{text('Exact record could not be loaded. Access or content may have changed.','Не удалось загрузить точную запись. Доступ или контент могли измениться.','โหลดรายการที่ระบุไม่ได้ สิทธิ์หรือเนื้อหาอาจเปลี่ยนแปลง')}</p><Button onClick={()=>{void query.refetch();}}>{text('Retry','Повторить','ลองอีกครั้ง')}</Button></div> : <div className="space-y-4 min-w-0 break-words">
        <p className="text-xs">{record.type} · {record.id}</p>
        <h3 className="text-lg font-semibold">{(language==='ru'?record.name_ru||record.name_en:record.name_en||record.name_ru)||text('Name not provided','Название не указано','ไม่ได้ระบุชื่อ')}</h3>
        <p className="whitespace-pre-wrap">{(language==='ru'?record.description_ru||record.description_en:record.description_en||record.description_ru)||text('Description not provided','Описание не указано','ไม่ได้ระบุรายละเอียด')}</p>
        <dl><dt>{text('Stored price / currency','Сохранённая цена / валюта','ราคาที่บันทึก / สกุลเงิน')}</dt><dd>{record.price ?? '—'} / {record.currency || '—'}</dd><dt>{text('Approval / active','Проверка / активность','การอนุมัติ / เปิดใช้งาน')}</dt><dd>{record.approval_status || '—'} / {record.is_active===null?'—':String(record.is_active)}</dd><dt>{text('Updated','Обновлено','อัปเดต')}</dt><dd>{record.updated_at || '—'}</dd></dl>
        <p>{text('Saved image references','Сохранённые ссылки на изображения','ลิงก์รูปภาพที่บันทึก')}</p>
        {record.images.length ? <ul className="space-y-2">{record.images.map((url,index)=><li key={`${index}-${url}`} className="text-xs break-all">{url}</li>)}</ul>:<p>{text('No image references provided','Ссылки на изображения не указаны','ไม่ได้ระบุลิงก์รูปภาพ')}</p>}
      </div>}
    </DialogContent>
  </Dialog>;
}
