/**
 * ShareCTA — reusable, referral-aware multi-channel share sheet.
 *
 * Generalises the share UI from PropertyShareSheet so ANY surface (referral
 * program, free tools, articles, landings) can offer one-tap sharing whose
 * link carries the sharer's referral code + UTM attribution. This is the
 * no-budget viral loop from docs/canonical/research/no-budget-growth-playbook.md
 * §3.4: every share is a tracked, reward-bearing invite.
 *
 * Gated by feature flag SHARE_CTA (src/lib/featureFlags.ts). When the flag is
 * off the trigger degrades to a plain copy-link action.
 */
import React, { useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ShareCTAProps {
  /** Title shown in the preview card. */
  title: string;
  /** Absolute or relative URL to share. Defaults to current location. */
  url?: string;
  /** Pre-filled share message. Falls back to a bilingual default built from title. */
  text?: string;
  /** Optional image for the preview card. */
  image?: string;
  /** Append the sharer's referral code as `?ref=CODE`. */
  referralCode?: string | null;
  /** utm_campaign value (utm_medium is always `share`; utm_source is per-channel). */
  utmCampaign?: string;
  /** Trigger element. */
  children: React.ReactNode;
}

type ChannelId = 'copy' | 'whatsapp' | 'telegram' | 'email';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const CHANNELS: { id: ChannelId; labelEn: string; labelRu: string; icon: React.ComponentType; color: string }[] = [
  { id: 'copy', labelEn: 'Copy link', labelRu: 'Скопировать ссылку', icon: Copy, color: 'bg-muted hover:bg-muted/80' },
  { id: 'whatsapp', labelEn: 'WhatsApp', labelRu: 'WhatsApp', icon: WhatsAppIcon, color: 'bg-success/10 hover:bg-success/20 text-success' },
  { id: 'telegram', labelEn: 'Telegram', labelRu: 'Telegram', icon: TelegramIcon, color: 'bg-info/10 hover:bg-info/20 text-info' },
  { id: 'email', labelEn: 'Email', labelRu: 'Email', icon: Mail, color: 'bg-muted hover:bg-muted/80' },
];

/** Build a share URL carrying referral code + per-channel UTM attribution. */
function buildShareUrl(
  rawUrl: string,
  opts: { referralCode?: string | null; utmSource: string; utmCampaign?: string },
): string {
  try {
    const u = new URL(rawUrl, window.location.origin);
    if (opts.referralCode) u.searchParams.set('ref', opts.referralCode);
    u.searchParams.set('utm_source', opts.utmSource);
    u.searchParams.set('utm_medium', 'share');
    if (opts.utmCampaign) u.searchParams.set('utm_campaign', opts.utmCampaign);
    return u.toString();
  } catch {
    return rawUrl;
  }
}

export function ShareCTA({ title, url, text, image, referralCode, utmCampaign = 'referral_share', children }: ShareCTAProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const baseUrl = url || window.location.href;
  const shareText = text || (isRu ? `Присоединяйся к myUNO: ${title}` : `Join myUNO: ${title}`);

  const handleShare = async (channelId: ChannelId) => {
    const shareUrl = buildShareUrl(baseUrl, { referralCode, utmSource: channelId, utmCampaign });
    switch (channelId) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast.success(isRu ? 'Ссылка скопирована!' : 'Link copied!');
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error(isRu ? 'Не удалось скопировать' : 'Failed to copy');
        }
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, '_blank');
        setOpen(false);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        setOpen(false);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`, '_blank');
        setOpen(false);
        break;
    }
  };

  // Flag off → degrade to a plain copy-link trigger (no multi-channel sheet).
  if (!isFeatureEnabled('SHARE_CTA')) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={() => handleShare('copy')}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleShare('copy'); }}
      >
        {children}
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Поделиться' : 'Share'}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 p-3 rounded-none bg-muted/50 border border-border/50">
          {image && <img src={image} alt="" className="w-16 h-16 rounded-none object-cover flex-shrink-0" />}
          <div className="min-w-0">
            <p className="font-semibold text-sm line-clamp-2 text-foreground">{title}</p>
            {referralCode && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRu ? 'С вашим кодом' : 'With your code'}{' '}
                <span className="font-mono text-accent">{referralCode}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const isCopyDone = channel.id === 'copy' && copied;
            return (
              <button
                key={channel.id}
                onClick={() => handleShare(channel.id)}
                className={cn('flex items-center gap-3 px-4 py-3 rounded-none text-sm font-medium transition-all', channel.color)}
              >
                {isCopyDone ? <Check className="w-5 h-5 text-success" /> : <Icon />}
                <span className="text-foreground">
                  {isCopyDone ? (isRu ? 'Скопировано!' : 'Copied!') : (isRu ? channel.labelRu : channel.labelEn)}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
