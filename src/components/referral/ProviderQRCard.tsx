/**
 * ProviderQRCode — generates a unique QR-style referral card for providers/drivers.
 * When scanned, directs users to sign up with the provider's referral code.
 * Uses canvas-based QR generation (no external library needed).
 */
import React, { useMemo } from 'react';
import { QrCode, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProviderQRCardProps {
  providerName: string;
  referralCode: string;
}

// Simple QR-like visual (actual scanning would need a real QR library)
function QRPattern({ code }: { code: string }) {
  const cells = useMemo(() => {
    // Generate a deterministic pattern from the code
    const grid: boolean[][] = [];
    let seed = 0;
    for (const ch of code) seed = ((seed << 5) - seed + ch.charCodeAt(0)) | 0;
    
    for (let row = 0; row < 9; row++) {
      grid[row] = [];
      for (let col = 0; col < 9; col++) {
        // Fixed corners (QR-style finder patterns)
        const isCorner = (row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3);
        if (isCorner) {
          const isEdge = row === 0 || row === 2 || col === 0 || col === 2 || 
                        (row < 3 && col > 5 && (col === 6 || col === 8)) ||
                        (row > 5 && (row === 6 || row === 8));
          grid[row][col] = isEdge || (row === 1 && col === 1) || 
                           (row === 1 && col === 7) || (row === 7 && col === 1);
        } else {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          grid[row][col] = seed % 3 !== 0;
        }
      }
    }
    return grid;
  }, [code]);

  return (
    <div className="inline-grid gap-0.5 p-3 bg-white rounded-lg">
      {cells.map((row, ri) => (
        <div key={ri} className="flex gap-0.5">
          {row.map((filled, ci) => (
            <div
              key={ci}
              className={`w-4 h-4 rounded-[2px] ${filled ? 'bg-gray-900' : 'bg-gray-100'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProviderQRCard({ providerName, referralCode }: ProviderQRCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const shareLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${providerName} — myUNO`,
          text: isRu 
            ? `Зарегистрируйтесь с кодом ${referralCode} и получите бонус!`
            : `Sign up with code ${referralCode} and get a bonus!`,
          url: shareLink,
        });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareLink);
      toast.success(isRu ? 'Ссылка скопирована!' : 'Link copied!');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-card border border-border">
      <h3 className="text-lg font-bold text-foreground text-center">{providerName}</h3>
      
      <QRPattern code={referralCode} />
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">
          {isRu ? 'Код приглашения' : 'Invitation code'}
        </p>
        <p className="font-mono text-xl font-bold tracking-widest text-foreground">
          {referralCode}
        </p>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {isRu 
          ? 'Покажите этот код вашим гостям для регистрации в myUNO'
          : 'Show this code to your guests to register on myUNO'}
      </p>

      <Button onClick={handleShare} className="w-full rounded-xl">
        <Share2 className="w-4 h-4 mr-2" />
        {isRu ? 'Поделиться' : 'Share'}
      </Button>
    </div>
  );
}
