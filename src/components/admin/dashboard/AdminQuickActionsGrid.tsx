import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';

export function AdminQuickActionsGrid() {
  const { language } = useLanguage();
  return <Surface variant="card" padding="md" className="min-w-0 bg-muted/20">
    <h2 className="mb-3 text-lg font-semibold">{pickLang(language, { en: 'Quick actions', ru: 'Быстрые действия', th: 'การดำเนินการด่วน' })}</h2>
    <div className="space-y-2">
      <Button variant="outline" asChild className="h-auto min-h-11 w-full whitespace-normal py-3"><Link to="/admin/properties?action=new"><Plus className="mr-2 size-4 shrink-0" />{pickLang(language, { en: 'Add property', ru: 'Добавить объект', th: 'เพิ่มที่พัก' })}</Link></Button>
      <Button variant="outline" asChild className="h-auto min-h-11 w-full whitespace-normal py-3"><Link to="/admin/services?action=new"><Plus className="mr-2 size-4 shrink-0" />{pickLang(language, { en: 'Add service', ru: 'Добавить услугу', th: 'เพิ่มบริการ' })}</Link></Button>
    </div>
  </Surface>;
}
