import { Eye } from 'lucide-react';
import { pickLang } from '@/lib/i18n/pickLang';

export const ADMIN_EDITOR_HEADER = 'shrink-0 px-4 pb-3 pt-5 text-left sm:px-6';
export const ADMIN_EDITOR_BODY = 'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 sm:px-6';
export const ADMIN_EDITOR_FOOTER = 'shrink-0 flex flex-row flex-wrap justify-end gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6';

type DraftPreviewProps = {
  language: Parameters<typeof pickLang>[0];
  title?: string | null;
  description?: string | null;
};

/** Intentionally accept only public-facing display text, never an editor record. */
export function AdminDraftPreview({ language, title, description }: DraftPreviewProps) {
  return (
    <details className="min-w-0 border border-border bg-muted/30 px-3">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">
        <Eye aria-hidden="true" className="mr-2 inline size-4 align-text-bottom" />
        {pickLang(language, { en: 'Preview draft', ru: 'Предпросмотр черновика', th: 'ดูตัวอย่างฉบับร่าง' })}
      </summary>
      <div className="space-y-2 border-t border-border pb-3 pt-2 [overflow-wrap:anywhere]">
        <p className="text-xs text-muted-foreground">
          {pickLang(language, {
            en: 'Text only. This preview does not save or publish changes.',
            ru: 'Только текст. Предпросмотр не сохраняет и не публикует изменения.',
            th: 'แสดงเฉพาะข้อความ ตัวอย่างนี้จะไม่บันทึกหรือเผยแพร่การแก้ไข',
          })}
        </p>
        <p className="font-medium">{title?.trim() || pickLang(language, { en: 'No title yet', ru: 'Название ещё не указано', th: 'ยังไม่มีชื่อ' })}</p>
        {description?.trim() && <p className="whitespace-pre-wrap text-sm">{description}</p>}
      </div>
    </details>
  );
}
