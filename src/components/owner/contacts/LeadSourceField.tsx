import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCrmOption, type CrmCustomOption } from '@/hooks/useCrmSettings';
import { Plus } from 'lucide-react';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 64) || 'source';
}

interface Props {
  companyId: string;
  isRu: boolean;
  leadSources: CrmCustomOption[];
  value: string;
  onValueChange: (v: string) => void;
}

export function LeadSourceField({ companyId, isRu, leadSources, value, onValueChange }: Props) {
  const createOption = useCreateCrmOption();
  const [open, setOpen] = useState(false);
  const [labelEn, setLabelEn] = useState('');
  const [labelRu, setLabelRu] = useState('');
  const [valueOverride, setValueOverride] = useState('');

  const handleCreate = async () => {
    const en = labelEn.trim();
    const ru = labelRu.trim() || en;
    if (!en) return;
    const slug = valueOverride.trim() ? slugify(valueOverride) : slugify(en);
    const sort_order = (leadSources[leadSources.length - 1]?.sort_order ?? 0) + 1;
    await createOption.mutateAsync({
      company_id: companyId,
      category: 'lead_source',
      value: slug,
      label_en: en,
      label_ru: ru,
      short_en: null,
      short_ru: null,
      color: '#78716c',
      icon: null,
      probability: null,
      is_system: false,
      is_active: true,
      sort_order,
    } as Omit<CrmCustomOption, 'id'>);
    onValueChange(slug);
    setOpen(false);
    setLabelEn('');
    setLabelRu('');
    setValueOverride('');
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 min-w-0">
        <Label>{isRu ? 'Источник' : 'Source'}</Label>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {leadSources.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {isRu ? s.label_ru : s.label_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setOpen(true)} title={isRu ? 'Новый источник' : 'Add source'}>
        <Plus className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isRu ? 'Новый источник лида' : 'New lead source'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>{isRu ? 'Название (EN) *' : 'Name (EN) *'}</Label>
              <Input value={labelEn} onChange={(e) => setLabelEn(e.target.value)} placeholder="Exhibition 2026" />
            </div>
            <div>
              <Label>{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
              <Input value={labelRu} onChange={(e) => setLabelRu(e.target.value)} placeholder={isRu ? 'Выставка 2026' : 'Optional'} />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">{isRu ? 'Код (латиница, опц.)' : 'Code slug (optional)'}</Label>
              <Input value={valueOverride} onChange={(e) => setValueOverride(e.target.value)} placeholder={slugify(labelEn || 'source')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleCreate} disabled={!labelEn.trim() || createOption.isPending}>
              {createOption.isPending ? '…' : isRu ? 'Создать' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
