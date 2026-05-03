/**
 * SaveOffplanSearchDialog — modal to persist current OffplanUiFilterState
 * as a saved search with channel preferences.
 */
import React, { useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNbSavedSearches } from '@/hooks/useNbSavedSearches';
import type { OffplanUiFilterState } from '@/lib/offplan/types';

interface Props {
  filters: OffplanUiFilterState;
  resultCount: number;
}

export function SaveOffplanSearchDialog({ filters, resultCount }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { create } = useNbSavedSearches();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(false);

  const defaultName = () => {
    const parts: string[] = [];
    if (filters.fZone) parts.push(filters.fZone);
    if (filters.fSeg) parts.push(filters.fSeg);
    if (filters.fRec) parts.push(filters.fRec);
    if (filters.fYear) parts.push(filters.fYear);
    if (filters.q) parts.push(`"${filters.q}"`);
    return parts.length ? parts.join(' · ') : (isRu ? 'Мой поиск новостроек' : 'My off-plan search');
  };

  const handleOpen = (next: boolean) => {
    if (next && !user) {
      toast.error(isRu ? 'Войдите, чтобы сохранить поиск' : 'Sign in to save searches');
      navigate('/auth');
      return;
    }
    if (next) setName(defaultName());
    setOpen(next);
  };

  const handleSave = async () => {
    try {
      await create.mutateAsync({
        name: name.trim() || defaultName(),
        filters,
        notify_email: email,
        notify_whatsapp: whatsapp,
        frequency: 'daily',
      });
      toast.success(isRu ? 'Поиск сохранён — будем присылать новые проекты' : 'Search saved — we will notify you on new matches');
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0 rounded-full gap-1.5">
          <Bookmark className="w-4 h-4" />
          {isRu ? 'Сохранить поиск' : 'Save search'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Сохранить поиск' : 'Save this search'}</DialogTitle>
          <DialogDescription>
            {isRu
              ? `Будем присылать уведомления, когда появятся новые проекты под ваши фильтры. Сейчас совпадает ${resultCount}.`
              : `We will notify you when new projects match your filters. Currently matching ${resultCount}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="search-name">{isRu ? 'Название поиска' : 'Search name'}</Label>
            <Input id="search-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ch-email" className="font-normal">{isRu ? 'Уведомлять на email' : 'Notify by email'}</Label>
            <Switch id="ch-email" checked={email} onCheckedChange={setEmail} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ch-wa" className="font-normal">{isRu ? 'Уведомлять в WhatsApp' : 'Notify on WhatsApp'}</Label>
            <Switch id="ch-wa" checked={whatsapp} onCheckedChange={setWhatsapp} />
          </div>
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Канал и номер WhatsApp настраиваются в Настройках уведомлений новостроек.'
              : 'Channels and WhatsApp number can be configured in Newbuild alert settings.'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
          <Button onClick={handleSave} disabled={create.isPending || (!email && !whatsapp)}>
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
