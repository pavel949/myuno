import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, RefreshCw, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
    profileReview: 'Профиль требует проверки',
    phone: 'Телефон сохранён',
    phoneReview: 'Телефон требует проверки',
    terms: 'Условия использования приняты',
    termsReview: 'Принятие условий использования требует проверки',
    privacy: 'Политика конфиденциальности принята',
    privacyReview: 'Принятие политики конфиденциальности требует проверки',
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
    profileReview: 'Profile needs review',
    phone: 'Phone saved',
    phoneReview: 'Phone needs review',
    terms: 'Terms of Service accepted',
    termsReview: 'Terms acceptance needs review',
    privacy: 'Privacy Policy accepted',
    privacyReview: 'Privacy acceptance needs review',
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
    profileReview: 'ต้องตรวจสอบโปรไฟล์',
    phone: 'บันทึกเบอร์โทรแล้ว',
    phoneReview: 'ต้องตรวจสอบเบอร์โทร',
    terms: 'ยอมรับเงื่อนไขแล้ว',
    termsReview: 'ต้องตรวจสอบการยอมรับเงื่อนไข',
    privacy: 'ยอมรับนโยบายความเป็นส่วนตัวแล้ว',
    privacyReview: 'ต้องตรวจสอบการยอมรับนโยบายความเป็นส่วนตัว',
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
        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
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
  const { user, session, isLoading: authLoading } = useAuth();
  const ownActor = !userId || (user?.id === userId && session?.user.id === userId && !authLoading);
  const [savedReport, setReport] = useState<IntegrityReport | null>(initialReport);
  const report = ownActor ? savedReport : null;
  const [error, setError] = useState<string | null>(initialError);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(initialReport || initialError ? Date.now() : null);
  const lastFetchRef = useRef<number>(0);
  const scopeRef = useRef({ open, userId, emailConfirmationRequired, actorId: user?.id, token: session?.access_token });
  const previousScope = scopeRef.current;
  if (previousScope.open !== open || previousScope.userId !== userId ||
      previousScope.emailConfirmationRequired !== emailConfirmationRequired ||
      previousScope.actorId !== user?.id || previousScope.token !== session?.access_token) {
    scopeRef.current = { open, userId, emailConfirmationRequired, actorId: user?.id, token: session?.access_token };
  }

  // Sync when parent passes fresh initial values (e.g. modal re-opened after a new signUp)
  useEffect(() => {
    setReport(initialReport);
    setError(initialError);
    if (initialReport || initialError) setLastCheckedAt(Date.now());
    lastFetchRef.current = 0;
  }, [initialReport, initialError, userId, emailConfirmationRequired]);

  const fetchStatus = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!open || !userId || emailConfirmationRequired || !ownActor) return;
      const requestScope = scopeRef.current;
      // Throttle: ignore calls within 2s of the previous one
      const now = Date.now();
      if (now - lastFetchRef.current < 2000) return;
      lastFetchRef.current = now;

      setRefreshing(true);
      if (!opts?.silent) setError(null);
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || auth.user?.id !== userId || scopeRef.current !== requestScope) return;
        const { data, error: invErr } = await supabase.functions.invoke('verify-signup-integrity', {
          body: { user_id: userId, expected_phone: expectedPhone || undefined },
        });
        const { data: currentActor, error: actorError } = await supabase.auth.getUser();
        if (actorError || currentActor.user?.id !== userId || scopeRef.current !== requestScope) return;
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
        if (scopeRef.current !== requestScope) return;
        const msg = e instanceof Error ? e.message : 'verify_failed';
        setError(msg);
        if (!opts?.silent) toast.error(t.verifyError);
      } finally {
        setRefreshing(false);
      }
    },
    [open, userId, expectedPhone, emailConfirmationRequired, ownActor, t.verifyError, t.okBanner],
  );

  const handleRefresh = () => fetchStatus();

  // Auto-refresh when modal opens
  useEffect(() => {
    if (open && userId) fetchStatus({ silent: true });
  }, [open, userId, emailConfirmationRequired, fetchStatus]);

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
          <div className="flex items-start gap-3 rounded border border-warning/40 bg-warning/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-warning" />
            <span>{t.verifyError}</span>
          </div>
        )}

        {report && (
          <>
            <div
              className={`rounded border p-3 text-sm ${
                allOk
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-warning/40 bg-warning/10 text-warning'
              }`}
            >
              {allOk ? t.okBanner : t.warnBanner}
            </div>
            <div className="divide-y divide-border">
              <Row ok={report.profile_exists} label={report.profile_exists ? t.profile : t.profileReview} />
              <Row ok={phoneOk} label={(phoneOk ? t.phone : t.phoneReview) + (report.phone_saved && expectedPhone && !report.phone_matches ? ` — ${t.phoneMismatch}` : '')} />
              <Row ok={report.terms_accepted} label={report.terms_accepted ? t.terms : t.termsReview} />
              <Row ok={report.privacy_accepted} label={report.privacy_accepted ? t.privacy : t.privacyReview} />
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
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing || !userId || emailConfirmationRequired || !ownActor}>
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
