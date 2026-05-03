/**
 * /account/saved-searches — manage saved off-plan searches.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2, Play, Bell, BellOff, Mail, MessageCircle, Settings } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { EmptyState } from '@/components/uno/EmptyState';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNbSavedSearches } from '@/hooks/useNbSavedSearches';
import { toast } from 'sonner';

export default function SavedSearches() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { list, update, remove } = useNbSavedSearches();

  if (!user) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader title={isRu ? 'Сохранённые поиски' : 'Saved searches'} showBack />
          <EmptyState
            icon={Bookmark}
            title={isRu ? 'Войдите в аккаунт' : 'Sign in required'}
            description={isRu ? 'Войдите, чтобы управлять поисками' : 'Sign in to manage your saved searches'}
            action={<Button onClick={() => navigate('/auth')}>{isRu ? 'Войти' : 'Sign in'}</Button>}
          />
        </PageContainer>
      </AppLayout>
    );
  }

  const items = list.data ?? [];

  const apply = (id: string) => {
    const item = items.find((s) => s.id === id);
    if (!item) return;
    sessionStorage.setItem('nb_apply_saved_search', JSON.stringify(item.filters));
    navigate('/property/offplan');
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={isRu ? 'Сохранённые поиски' : 'Saved searches'}
          showBack
          actions={
            <Button variant="ghost" size="icon" onClick={() => navigate('/account/newbuild-alerts')}>
              <Settings className="w-5 h-5" />
            </Button>
          }
        />

        {list.isLoading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={isRu ? 'Пока нет сохранённых поисков' : 'No saved searches yet'}
            description={isRu
              ? 'Откройте каталог новостроек, выставьте фильтры и нажмите «Сохранить поиск».'
              : 'Open the off-plan catalog, set filters and tap “Save search”.'}
            action={
              <Button onClick={() => navigate('/property/offplan')}>
                {isRu ? 'Перейти в каталог' : 'Open catalog'}
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {items.map((s) => (
              <Card key={s.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate">{s.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRu ? 'Создан' : 'Created'}: {new Date(s.created_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => apply(s.id)} title={isRu ? 'Применить' : 'Apply'}>
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        await remove.mutateAsync(s.id);
                        toast.success(isRu ? 'Удалено' : 'Deleted');
                      }}
                      title={isRu ? 'Удалить' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    {s.is_active ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                    <span>{s.is_active ? (isRu ? 'Активен' : 'Active') : (isRu ? 'Пауза' : 'Paused')}</span>
                  </div>
                  <Switch
                    checked={s.is_active}
                    onCheckedChange={(v) => update.mutate({ id: s.id, patch: { is_active: v } })}
                  />
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <Switch
                      checked={s.notify_email}
                      onCheckedChange={(v) => update.mutate({ id: s.id, patch: { notify_email: v } })}
                    />
                    <span className="text-xs">{isRu ? 'Email' : 'Email'}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <Switch
                      checked={s.notify_whatsapp}
                      onCheckedChange={(v) => update.mutate({ id: s.id, patch: { notify_whatsapp: v } })}
                    />
                    <span className="text-xs">WhatsApp</span>
                  </label>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
