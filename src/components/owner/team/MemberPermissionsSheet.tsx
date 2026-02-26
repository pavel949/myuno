import { useLanguage } from '@/contexts/LanguageContext';
import { MODULES, useMemberPermissions, useUpdateMemberPermission, type TeamPermission } from '@/hooks/useTeamPermissions';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ShieldCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
}

export function MemberPermissionsSheet({ open, onOpenChange, userId, userName }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => (isRu ? ru : en);

  const { data: permissions = [], isLoading } = useMemberPermissions(userId);
  const updatePermission = useUpdateMemberPermission();

  const getPerm = (moduleKey: string): TeamPermission | undefined =>
    permissions.find((p) => p.module === moduleKey);

  const handleToggle = (moduleKey: string, field: 'can_view' | 'can_edit', value: boolean) => {
    if (!userId) return;
    const current = getPerm(moduleKey);
    updatePermission.mutate({
      userId,
      module: moduleKey,
      can_view: field === 'can_view' ? value : (current?.can_view ?? true),
      can_edit: field === 'can_edit' ? value : (current?.can_edit ?? false),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t('Permissions', 'Права доступа')}
          </SheetTitle>
          <SheetDescription>{userName}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_60px_60px] gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span>{t('Module', 'Модуль')}</span>
              <span className="text-center">{t('View', 'Вид')}</span>
              <span className="text-center">{t('Edit', 'Ред.')}</span>
            </div>

            {MODULES.map((mod) => {
              const perm = getPerm(mod.key);
              const canView = perm?.can_view ?? false;
              const canEdit = perm?.can_edit ?? false;

              return (
                <div
                  key={mod.key}
                  className="grid grid-cols-[1fr_60px_60px] gap-2 items-center px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {isRu ? mod.labelRu : mod.labelEn}
                  </span>
                  <div className="flex justify-center">
                    <Switch
                      checked={canView}
                      onCheckedChange={(v) => handleToggle(mod.key, 'can_view', v)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={canEdit}
                      onCheckedChange={(v) => handleToggle(mod.key, 'can_edit', v)}
                      disabled={!canView}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
