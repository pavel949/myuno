import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { z } from 'zod';

export type MagnetContext = {
  type: 'project' | 'area' | 'resale' | 'developer' | 'global';
  slug?: string;
  payload?: Record<string, unknown>;
};

interface MagnetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  magnetSlug: string;
  context?: MagnetContext;
  /** Optional override; otherwise loaded from DB */
  title?: string;
  description?: string;
}

const submitSchema = z.object({
  full_name: z.string().trim().min(2, 'Введите имя').max(200),
  email: z.string().trim().email('Некорректный email').max(255),
  whatsapp: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
});

function readUtm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function MagnetDialog({
  open,
  onOpenChange,
  magnetSlug,
  context,
  title,
  description,
}: MagnetDialogProps) {
  const [loadingMagnet, setLoadingMagnet] = useState(false);
  const [magnet, setMagnet] = useState<{
    title_ru: string;
    description_ru: string | null;
  } | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open || title) return;
    let cancelled = false;
    setLoadingMagnet(true);
    supabase
      .from('lead_magnets')
      .select('title_ru, description_ru')
      .eq('slug', magnetSlug)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setMagnet(data ?? null);
          setLoadingMagnet(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, magnetSlug, title]);

  useEffect(() => {
    if (!open) return;
    // Prefill from authed user
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user?.email && !email) setEmail(user.email);
      const meta = (user?.user_metadata ?? {}) as Record<string, string>;
      if (meta.full_name && !name) setName(meta.full_name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const headerTitle = title ?? magnet?.title_ru ?? 'Получить материал';
  const headerDescription = description ?? magnet?.description_ru ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = submitSchema.safeParse({
      full_name: name,
      email,
      whatsapp,
      message,
    });
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(firstError ?? 'Проверьте данные формы');
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const utm = readUtm();
      const { data, error } = await supabase.functions.invoke('magnet-submit', {
        body: {
          magnet_slug: magnetSlug,
          context_type: context?.type ?? 'global',
          context_slug: context?.slug,
          context_payload: { ...(context?.payload ?? {}), message: parsed.data.message || undefined },
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          whatsapp: parsed.data.whatsapp || undefined,
          preferred_channel: parsed.data.whatsapp ? 'whatsapp' : 'email',
          language: 'ru',
          utm,
          referer: typeof document !== 'undefined' ? document.referrer : undefined,
          landing_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
          user_id: userData.user?.id ?? null,
        },
      });
      if (error || !data?.success) {
        toast.error(data?.error ?? error?.message ?? 'Не удалось отправить');
        return;
      }
      setSubmitted(true);
      toast.success('Готово — отправили вам на email в течение 2 минут');
    } catch (err) {
      console.error(err);
      toast.error('Не удалось отправить, попробуйте ещё раз');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {loadingMagnet ? 'Загрузка…' : headerTitle}
          </DialogTitle>
          {headerDescription && <DialogDescription>{headerDescription}</DialogDescription>}
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="text-2xl">✅</div>
            <p className="text-sm text-muted-foreground">
              Письмо уже летит к вам. Если не пришло за 2 минуты — проверьте спам или напишите нам в
              WhatsApp.
            </p>
            <Button onClick={() => handleClose(false)} className="w-full">
              Закрыть
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magnet-name">Имя *</Label>
              <Input
                id="magnet-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как к вам обращаться"
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="magnet-email">Email *</Label>
              <Input
                id="magnet-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="magnet-whatsapp">WhatsApp (необязательно)</Label>
              <Input
                id="magnet-whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+7..."
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="magnet-message">Комментарий (необязательно)</Label>
              <Textarea
                id="magnet-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Бюджет, сроки, любые пожелания"
                maxLength={1000}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Получить материал
              </Button>
            </DialogFooter>
            <p className="text-xs text-muted-foreground text-center">
              Отправляя форму, вы соглашаетесь получать материалы и быть на связи. Мы не передаём
              ваши данные третьим лицам.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface MagnetCTAProps {
  magnetSlug: string;
  context?: MagnetContext;
  /** Visual variant */
  variant?: 'button' | 'card' | 'inline';
  label?: string;
  className?: string;
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
  buttonSize?: React.ComponentProps<typeof Button>['size'];
}

/**
 * Universal lead-magnet CTA. Drop into any page/card.
 * Looks up magnet copy from DB; shows form dialog; submits via magnet-submit edge function.
 */
export function MagnetCTA({
  magnetSlug,
  context,
  variant = 'button',
  label,
  className,
  buttonVariant = 'default',
  buttonSize = 'default',
}: MagnetCTAProps) {
  const [open, setOpen] = useState(false);
  const [magnet, setMagnet] = useState<{
    title_ru: string;
    description_ru: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('lead_magnets')
      .select('title_ru, description_ru')
      .eq('slug', magnetSlug)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setMagnet(data ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [magnetSlug]);

  const ctaLabel = label ?? magnet?.title_ru ?? 'Получить материал';

  if (variant === 'card') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            className ??
            'w-full text-left rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors'
          }
        >
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">{ctaLabel}</div>
              {magnet?.description_ru && (
                <div className="text-sm text-muted-foreground mt-1">{magnet.description_ru}</div>
              )}
            </div>
          </div>
        </button>
        <MagnetDialog
          open={open}
          onOpenChange={setOpen}
          magnetSlug={magnetSlug}
          context={context}
        />
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={className ?? 'text-primary underline-offset-4 hover:underline font-medium'}
        >
          {ctaLabel}
        </button>
        <MagnetDialog
          open={open}
          onOpenChange={setOpen}
          magnetSlug={magnetSlug}
          context={context}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {ctaLabel}
      </Button>
      <MagnetDialog open={open} onOpenChange={setOpen} magnetSlug={magnetSlug} context={context} />
    </>
  );
}
