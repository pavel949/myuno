import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useDetectDuplicates, DuplicateGroup } from '@/hooks/useCrmDuplicates';
import { useUpdateContact, useDeleteContact } from '@/hooks/useCrmContacts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Users, AlertTriangle, CheckCircle, Merge, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CrmDuplicatesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const detect = useDetectDuplicates();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const companyId = activeCompany?.company_id;
  const [mergedGroups, setMergedGroups] = useState<Set<number>>(new Set());

  const handleScan = () => {
    if (companyId) {
      detect.mutate(companyId);
      setMergedGroups(new Set());
    }
  };

  const handleMerge = async (group: DuplicateGroup, keepIdx: number, groupIdx: number) => {
    const keepContact = group.contacts[keepIdx];
    const toDelete = group.contacts.filter((_, i) => i !== keepIdx);

    try {
      // Merge data from duplicates into the kept contact (non-null fields)
      const mergeFields: Record<string, any> = {};
      for (const dup of toDelete) {
        if (dup.email && !keepContact.email) mergeFields.email = dup.email;
        if (dup.phone && !keepContact.phone) mergeFields.phone = dup.phone;
        if (dup.company_name && !keepContact.company_name) mergeFields.company_name = dup.company_name;
      }

      if (Object.keys(mergeFields).length > 0) {
        await updateContact.mutateAsync({ id: keepContact.id, ...mergeFields } as any);
      }

      // Delete duplicates
      for (const dup of toDelete) {
        await deleteContact.mutateAsync(dup.id);
      }

      setMergedGroups(prev => new Set(prev).add(groupIdx));
      toast.success(isRu ? `Объединено! Оставлен: ${keepContact.first_name} ${keepContact.last_name}` : `Merged! Kept: ${keepContact.first_name} ${keepContact.last_name}`);
    } catch {
      toast.error(isRu ? 'Ошибка при объединении' : 'Merge failed');
    }
  };

  const duplicates = detect.data?.duplicates || [];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Поиск дубликатов' : 'Duplicate Detection'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Найдите и объедините дублирующиеся контакты' : 'Find and merge duplicate contacts'}
          </p>
        </div>
        <Button onClick={handleScan} disabled={detect.isPending || !companyId} className="shrink-0">
          {detect.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          {isRu ? 'Сканировать' : 'Scan Now'}
        </Button>
      </div>

      {detect.isSuccess && duplicates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle className="h-12 w-12 text-success" />
            <p className="text-lg font-medium">{isRu ? 'Дубликатов не найдено!' : 'No duplicates found!'}</p>
            <p className="text-sm text-muted-foreground">{isRu ? 'Ваша база контактов чистая' : 'Your contact database is clean'}</p>
          </CardContent>
        </Card>
      )}

      {duplicates.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isRu ? `Найдено ${duplicates.length} групп дубликатов` : `Found ${duplicates.length} duplicate groups`}
          </p>
          {duplicates.map((group, idx) => (
            <DuplicateGroupCard
              key={idx}
              group={group}
              groupIdx={idx}
              isRu={isRu}
              onMerge={handleMerge}
              isMerged={mergedGroups.has(idx)}
            />
          ))}
        </div>
      )}

      {!detect.isSuccess && !detect.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Users className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isRu ? 'Нажмите "Сканировать" для поиска дубликатов' : 'Click "Scan Now" to detect duplicates'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DuplicateGroupCard({ group, groupIdx, isRu, onMerge, isMerged }: { group: DuplicateGroup; groupIdx: number; isRu: boolean; onMerge: (group: DuplicateGroup, keepIdx: number, groupIdx: number) => void; isMerged: boolean }) {
  const [selectedKeep, setSelectedKeep] = useState(0);

  const reasonLabels: Record<string, string> = {
    email: 'Email',
    phone: isRu ? 'Телефон' : 'Phone',
    name: isRu ? 'Имя' : 'Name',
  };

  if (isMerged) {
    return (
      <Card className="opacity-50">
        <CardContent className="flex items-center justify-center py-6 gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          <span className="text-sm font-medium">{isRu ? 'Объединено' : 'Merged'}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            {group.contacts.length} {isRu ? 'контактов совпадают' : 'contacts match'}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {group.match_reasons.map(r => (
              <Badge key={r} variant="secondary" className="text-xs">{reasonLabels[r] || r}</Badge>
            ))}
            <Badge variant={group.confidence >= 90 ? 'destructive' : 'outline'} className="text-xs">{group.confidence}%</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="divide-y">
          {group.contacts.map((c, i) => (
            <div key={c.id} className={cn('py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm', selectedKeep === i && 'bg-success/5 rounded-lg px-2')}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedKeep(i)}
                  className={cn('shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors', selectedKeep === i ? 'border-success bg-success text-white' : 'border-muted-foreground/30')}
                >
                  {selectedKeep === i && <CheckCircle className="h-3 w-3" />}
                </button>
                <div>
                  <span className="font-medium">{c.first_name} {c.last_name}</span>
                  {c.company_name && <span className="text-muted-foreground ml-2">({c.company_name})</span>}
                </div>
              </div>
              <div className="flex gap-4 text-muted-foreground text-xs">
                {c.email && <span className="truncate max-w-[200px]">{c.email}</span>}
                {c.phone && <span>{c.phone}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {isRu ? 'Выберите контакт для сохранения, остальные будут удалены' : 'Select contact to keep, others will be deleted'}
          </p>
          <Button size="sm" onClick={() => onMerge(group, selectedKeep, groupIdx)}>
            <Merge className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Объединить' : 'Merge'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
