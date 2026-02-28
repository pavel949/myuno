import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useDetectDuplicates, DuplicateGroup } from '@/hooks/useCrmDuplicates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CrmDuplicatesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const detect = useDetectDuplicates();

  const companyId = activeCompany?.company_id;

  const handleScan = () => {
    if (companyId) {
      detect.mutate(companyId);
    }
  };

  const duplicates = detect.data?.duplicates || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Поиск дубликатов' : 'Duplicate Detection'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Найдите и объедините дублирующиеся контакты' : 'Find and merge duplicate contacts'}
          </p>
        </div>
        <Button onClick={handleScan} disabled={detect.isPending || !companyId}>
          {detect.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          {isRu ? 'Сканировать' : 'Scan Now'}
        </Button>
      </div>

      {detect.isSuccess && duplicates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle className="h-12 w-12 text-success" />
            <p className="text-lg font-medium">{isRu ? 'Дубликатов не найдено!' : 'No duplicates found!'}</p>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Ваша база контактов чистая' : 'Your contact database is clean'}
            </p>
          </CardContent>
        </Card>
      )}

      {duplicates.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isRu ? `Найдено ${duplicates.length} групп дубликатов` : `Found ${duplicates.length} duplicate groups`}
          </p>
          {duplicates.map((group, idx) => (
            <DuplicateGroupCard key={idx} group={group} isRu={isRu} />
          ))}
        </div>
      )}

      {!detect.isSuccess && !detect.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Users className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              {isRu ? 'Нажмите "Сканировать" для поиска дубликатов' : 'Click "Scan Now" to detect duplicates'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DuplicateGroupCard({ group, isRu }: { group: DuplicateGroup; isRu: boolean }) {
  const reasonLabels: Record<string, string> = {
    email: 'Email',
    phone: isRu ? 'Телефон' : 'Phone',
    name: isRu ? 'Имя' : 'Name',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            {group.contacts.length} {isRu ? 'контактов совпадают' : 'contacts match'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {group.match_reasons.map(r => (
              <Badge key={r} variant="secondary" className="text-xs">
                {reasonLabels[r] || r}
              </Badge>
            ))}
            <Badge variant={group.confidence >= 90 ? 'destructive' : 'outline'} className="text-xs">
              {group.confidence}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {group.contacts.map(c => (
            <div key={c.id} className="py-2 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{c.first_name} {c.last_name}</span>
                {c.company_name && <span className="text-muted-foreground ml-2">({c.company_name})</span>}
              </div>
              <div className="flex gap-4 text-muted-foreground text-xs">
                {c.email && <span>{c.email}</span>}
                {c.phone && <span>{c.phone}</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
