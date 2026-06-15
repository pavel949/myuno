import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, RefreshCw, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type IntegrityReport = {
  ok: boolean;
  profile_exists: boolean;
  phone_saved: boolean;
  phone_matches: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  warnings: string[];
};

type Lang = 'ru' | 'en' | 'th';

interface SignupIntegrityModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  expectedPhone: string | null;
  initialReport: IntegrityReport | null;
  initialError: string | null;
  emailConfirmationRequired: boolean;
  language: Lang;
}

const L = {
  ru: {
    title: 'Статус регистрации',
    subtitle: 'Проверьте, какие данные сохранены на сервере.',
    profile: 'Профиль создан',
    phone: 'Телефон сохранён',
    terms: 'Условия использования приняты',
    privacy: 'Политика конфиденциальности принята',
    phoneMismatch: 'Телефон не совпадает с введённым',
    refresh: 'Обновить данные',
    refreshing: 'Обновляем…',
    close: 'Закрыть',
    confirmEmail: 'Подтвердите email — мы отправили ссылку на вашу почту.',
    verifyError: 'Не удалось получить статус с сервера.',
    okBanner: 'Все данные сохранены.',
    warnBanner: 'Часть данных не записалась — обновите или свяжитесь с поддержкой.',
  },
  en: {
    title: 'Signup status',
    subtitle: 'Check which data was stored on the server.',
    profile: 'Profile created',
    phone: 'Phone saved',
    terms: 'Terms of Service accepted',
    privacy: 'Privacy Policy accepted',
    phoneMismatch: "Stored phone doesn't match the value you entered",
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    close: 'Close',
    confirmEmail: 'Confirm your email — we sent you a verification link.',
    verifyError: 'Could not fetch status from the server.',
    okBanner: 'All data saved.',
    warnBanner: 'Some data is missing — refresh or contact support.',
  },
  th: {
    title: 'สถานะการลงทะเบียน',
    subtitle: 'ตรวจสอบข้อมูลที่บันทึกบนเซิร์ฟเวอร์',
    profile: 'สร้างโปรไฟล์แล้ว',
    phone: 'บันทึกเบอร์โทรแล้ว',
    terms: 'ยอมรับเงื่อนไขแล้ว',
    privacy: 'ยอมรับนโยบายความเป็นส่วนตัวแล้ว',
    phoneMismatch: 'เบอร์โทรไม่ตรงกับที่กรอก',
    refresh: 'รีเฟรช',
    refreshing: 'กำลังรีเฟรช…',
    close: 'ปิด',
    confirmEmail: 'กรุณายืนยันอีเมล — เราส่งลิงก์ไปแล้ว',
    verifyError: 'ไม่สามารถดึงสถานะจากเซิร์ฟเวอร์ได้',
    okBanner: 'ข้อมูลทั้งหมดถูกบันทึกแล้ว',
    warnBanner: 'ข้อมูลบางส่วนหายไป — โปรดรีเฟรชหรือติดต่อฝ่ายสนับสนุน',
  },
} as const;

function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {ok ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      )}
      <span className={ok ? 'text-foreground' : 'text-foreground/80'}>{label}</span>
    </div>
  );
}

export function SignupIntegrityModal({
  open,
  onClose,
  userId,
  expectedPhone,
  initialReport,
  initialError,
  emailConfirmationRequired,
  language,
}: SignupIntegrityModalProps) {
  const t = L[language] ?? L.en;
  const [report, setReport] = useState<IntegrityReport | null>(initialReport);
  const [error, setError] = useState<string | null>(initialError);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(initialReport || initialError ? Date.now() : null);
  const lastFetchRef = useRef<number>(0);

  // Sync when parent passes fresh initial values (e.g. modal re-opened after a new signUp)
  useEffect(() => {
    setReport(initialReport);
    setError(initialError);
    if (initialReport || initialError) setLastCheckedAt(Date.now());
  }, [initialReport, initialError]);

  const fetchStatus = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!userId) return;
      // Throttle: ignore calls within 2s of the previous one
      const now = Date.now();
      if (now - lastFetchRef.current < 2000) return;
      lastFetchRef.current = now;

      setRefreshing(true);
      if (!opts?.silent) setError(null);
      try {
        const { data, error: invErr } = await supabase.functions.invoke('verify-signup-integrity', {
          body: { user_id: userId, expected_phone: expectedPhone || undefined },
        });
        if (invErr) {
          setError(invErr.message || 'verify_failed');
          if (!opts?.silent) toast.error(t.verifyError);
        } else {
          setReport(data as IntegrityReport);
          setError(null);
          if (!opts?.silent && (data as IntegrityReport)?.ok) toast.success(t.okBanner);
        }
        setLastCheckedAt(Date.now());
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'verify_failed';
        setError(msg);
        if (!opts?.silent) toast.error(t.verifyError);
      } finally {
        setRefreshing(false);
      }
    },
    [userId, expectedPhone, t.verifyError, t.okBanner],
  );

  const handleRefresh = () => fetchStatus();

  // Auto-refresh when modal opens
  useEffect(() => {
    if (open && userId) fetchStatus({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  // Auto-refresh on tab focus / visibility return while modal is open
  useEffect(() => {
    if (!open || !userId) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchStatus({ silent: true });
    };
    const onFocus = () => fetchStatus({ silent: true });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [open, userId, fetchStatus]);

  const phoneOk = !!report && report.phone_saved && (expectedPhone ? report.phone_matches : true);
  const allOk = !!report && report.ok;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>

        {emailConfirmationRequired && (
          <div className="flex items-start gap-3 rounded border border-border bg-muted/50 p-3 text-sm">
            <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <span>{t.confirmEmail}</span>
          </div>
        )}

        {error && !report && (
          <div className="flex items-start gap-3 rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <span>{t.verifyError}</span>
          </div>
        )}

        {report && (
          <>
            <div
              className={`rounded border p-3 text-sm ${
                allOk
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200'
              }`}
            >
              {allOk ? t.okBanner : t.warnBanner}
            </div>
            <div className="divide-y divide-border">
              <Row ok={report.profile_exists} label={t.profile} />
              <Row ok={phoneOk} label={t.phone + (report.phone_saved && expectedPhone && !report.phone_matches ? ` — ${t.phoneMismatch}` : '')} />
              <Row ok={report.terms_accepted} label={t.terms} />
              <Row ok={report.privacy_accepted} label={t.privacy} />
            </div>
          </>
        )}

        {lastCheckedAt && (
          <p className="text-xs text-muted-foreground">
            {language === 'ru' ? 'Обновлено: ' : language === 'th' ? 'อัปเดต: ' : 'Last checked: '}
            {new Date(lastCheckedAt).toLocaleTimeString(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-US')}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing || !userId}>
            {refreshing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.refreshing}</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" />{t.refresh}</>
            )}
          </Button>
          <Button onClick={onClose}>{t.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
