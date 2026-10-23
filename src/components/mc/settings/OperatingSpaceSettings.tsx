import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useOperatingSpaceSetup } from '@/hooks/useOperatingSpaceSetup';
import type { OperatingSpace, SpaceCommand, SpaceInput } from '@/lib/operatingSpaceSetup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const emptySpace: SpaceInput = { key: '', name_en: '', name_ru: '', is_active: true };

export function OperatingSpaceSettings() {
  const { activeCompany } = useActiveCompany();
  const { user } = useAuth();
  return activeCompany && user
    ? <SpaceSetupForm key={`${user.id}:${activeCompany.company_id}`} companyId={activeCompany.company_id} />
    : null;
}

function SpaceSetupForm({ companyId }: { companyId: string }) {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const t = (en: string, russian: string) => ru ? russian : en;
  const { data, isLoading, error, refetch, change } = useOperatingSpaceSetup(companyId);
  const [draft, setDraft] = useState<SpaceInput>(emptySpace);
  const [target, setTarget] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [saved, setSaved] = useState(false);
  const name = (space: OperatingSpace) => (ru ? space.name_ru : space.name_en);

  const run = async (command: SpaceCommand) => {
    setSaveError(false); setSaved(false);
    try {
      await change.mutateAsync(command);
      setSaved(true);
      return true;
    } catch {
      setSaveError(true);
      return false;
    }
  };

  if (error) return <div role="alert" className="space-y-3">
    <p className="text-sm text-destructive">{t('Could not load operating spaces', 'Не удалось загрузить рабочие пространства')}</p>
    <Button variant="outline" onClick={() => refetch()}>{t('Retry', 'Повторить')}</Button>
  </div>;
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data) return <p className="text-sm text-muted-foreground">{t('Company access is required.', 'Требуется доступ к компании.')}</p>;
  const targetSpace = data.spaces.find(space => space.id === target && space.is_active);

  return <div className="space-y-5">
    <p className="text-sm text-muted-foreground">
      {t('Create spaces before adding properties or members. Creating a space does not change existing access rules.',
        'Создайте пространства до добавления объектов или участников. Создание пространства не меняет действующие правила доступа.')}
    </p>
    {saveError && <p role="alert" className="text-sm text-destructive">
      {t('Could not confirm the change. Your entries remain in the form; refresh before trying again.',
        'Не удалось подтвердить изменение. Введённые значения сохранены; обновите данные перед повторной попыткой.')}
      <Button type="button" variant="link" onClick={() => refetch()}>{t('Refresh', 'Обновить')}</Button>
    </p>}
    {saved && <p role="status" className="text-sm">{t('Change saved', 'Изменение сохранено')}</p>}
    <fieldset disabled={change.isPending} className="space-y-5 min-w-0">
      {data.spaces.length === 0
        ? <p className="text-sm">{t('No operating spaces yet. Create your first space below.', 'Рабочих пространств пока нет. Создайте первое ниже.')}</p>
        : <div className="space-y-2">
          {data.spaces.map(space => <Card key={space.id}><CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium break-words">{name(space)}</p>
              <Badge variant="outline">{space.is_active ? t('Active', 'Активно') : t('Inactive', 'Неактивно')}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => { setDraft({ ...space }); setSaved(false); }}>{t('Rename', 'Переименовать')} {name(space)}</Button>
              <Button type="button" variant="outline" onClick={() => run({ type: 'save', space: { ...space, is_active: !space.is_active } })}>
                {space.is_active ? t('Deactivate', 'Деактивировать') : t('Activate', 'Активировать')} {name(space)}
              </Button>
            </div>
          </CardContent></Card>)}
        </div>}
      <form className="space-y-3" onSubmit={async event => {
        event.preventDefault();
        const values = { ...draft, key: draft.key.trim(), name_en: draft.name_en.trim(), name_ru: draft.name_ru.trim() };
        if (!/^[a-z0-9][a-z0-9_-]{1,62}$/.test(values.key) || !values.name_en || !values.name_ru) return;
        if (await run({ type: 'save', space: values })) setDraft(emptySpace);
      }}>
        <h3 className="font-medium">{draft.id ? t('Edit space', 'Редактировать пространство') : t('Create space', 'Создать пространство')}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1 min-w-0">
            <Label htmlFor="space-key">{t('Space key', 'Ключ пространства')}</Label>
            <Input id="space-key" value={draft.key} disabled={Boolean(draft.id)} required minLength={2} maxLength={63}
              pattern="[a-z0-9][a-z0-9_-]{1,62}" onChange={event => setDraft({ ...draft, key: event.target.value })} />
          </div>
          <div className="space-y-1 min-w-0">
            <Label htmlFor="space-name-en">{t('Name (EN)', 'Название (EN)')}</Label>
            <Input id="space-name-en" value={draft.name_en} required maxLength={160} onChange={event => setDraft({ ...draft, name_en: event.target.value })} />
          </div>
          <div className="space-y-1 min-w-0">
            <Label htmlFor="space-name-ru">{t('Name (RU)', 'Название (RU)')}</Label>
            <Input id="space-name-ru" value={draft.name_ru} required maxLength={160} onChange={event => setDraft({ ...draft, name_ru: event.target.value })} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{draft.id ? t('Save space', 'Сохранить пространство') : t('Create space', 'Создать пространство')}</Button>
          {draft.id && <Button type="button" variant="ghost" onClick={() => setDraft(emptySpace)}>{t('Cancel', 'Отмена')}</Button>}
        </div>
      </form>

      {data.spaces.some(space => space.is_active) && <section className="space-y-4 border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="space-target">{t('Configure space', 'Настроить пространство')}</Label>
          <Select value={target} onValueChange={value => { setTarget(value); setSelectedProperties([]); setReason(''); setSaved(false); }}>
            <SelectTrigger id="space-target"><SelectValue placeholder={t('Select a space', 'Выберите пространство')} /></SelectTrigger>
            <SelectContent>{data.spaces.filter(space => space.is_active).map(space =>
              <SelectItem key={space.id} value={space.id}>{name(space)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {targetSpace && <>
          <section className="space-y-2">
            <h3 className="font-medium">{t('Company members', 'Участники компании')}</h3>
            {data.members.length === 0
              ? <p className="text-sm text-muted-foreground">{t('No company members available. The space can remain empty.', 'Участников компании пока нет. Пространство может оставаться пустым.')}</p>
              : data.members.map(member => {
                const granted = data.grants.some(grant => grant.operating_space_id === targetSpace.id && grant.company_member_id === member.id && grant.is_active);
                return <label key={member.id} className="flex min-h-11 items-center gap-3 text-sm break-all">
                  <input type="checkbox" checked={granted} disabled={!member.is_active && !granted}
                    onChange={event => run({ type: 'grant', spaceId: targetSpace.id, memberId: member.id, active: event.target.checked })} />
                  <span>{member.display_name || member.user_id} · {member.role}{!member.is_active ? t(' (inactive)', ' (неактивен)') : ''}</span>
                </label>;
              })}
          </section>
          <section className="space-y-3">
            <h3 className="font-medium">{t('Property assignments', 'Объекты пространства')}</h3>
            <p className="text-sm text-muted-foreground">{t('Select each related parent and child explicitly. Other assignments stay unchanged.', 'Явно выберите связанные родительские и дочерние объекты. Остальные назначения не изменятся.')}</p>
            {data.properties.length === 0
              ? <p className="text-sm text-muted-foreground">{t('No company properties available. You can add them later.', 'Объектов компании пока нет. Их можно добавить позже.')}</p>
              : <>
                <div className="max-h-64 overflow-y-auto space-y-2 border p-3">
                  {data.properties.map(property => {
                    const current = data.assignments.find(row => row.property_id === property.id);
                    const currentSpace = data.spaces.find(space => space.id === current?.operating_space_id);
                    return <label key={property.id} className="flex min-h-11 items-center gap-3 text-sm">
                      <input type="checkbox" checked={selectedProperties.includes(property.id)} onChange={event =>
                        setSelectedProperties(values => event.target.checked ? [...values, property.id] : values.filter(id => id !== property.id))} />
                      <span className="min-w-0 break-words">{(ru ? property.title_ru || property.title_en : property.title_en || property.title_ru) || property.id}
                        {currentSpace && <span className="block text-xs text-muted-foreground">{t('Current space: ', 'Текущее пространство: ')}{name(currentSpace)}</span>}
                      </span>
                    </label>;
                  })}
                </div>
                <Label htmlFor="space-assignment-reason">{t('Reason for assignment', 'Причина назначения')}</Label>
                <Input id="space-assignment-reason" value={reason} onChange={event => setReason(event.target.value)} />
                <Button type="button" disabled={!selectedProperties.length || !reason.trim()} onClick={async () => {
                  if (await run({ type: 'assign', spaceId: targetSpace.id, propertyIds: selectedProperties, reason })) {
                    setSelectedProperties([]); setReason('');
                  }
                }}>{t('Assign selected properties', 'Назначить выбранные объекты')}</Button>
              </>}
          </section>
        </>}
      </section>}
    </fieldset>
  </div>;
}

