import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { readAdminSystemSettings, saveAdminSystemSettings } from '@/lib/adminSystemSettings';
import { EMPTY_SOCIAL_LINKS, normalizeSocialUrl, PLATFORM_SOCIAL_QUERY_KEY, PLATFORM_SOCIAL_SETTING, readSocialLinks, SOCIAL_LABELS, SOCIAL_NETWORKS, type PlatformSocialLinks } from '@/lib/social/platformSocialLinks';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SocialNetworkSettings() {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { user } = useAuth();
  const actorId = user?.id ?? null;
  const actor = useRef(actorId); actor.current = actorId;
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const client = useQueryClient();
  const [values, setValues] = useState<PlatformSocialLinks>({ ...EMPTY_SOCIAL_LINKS });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);
  const [reload, setReload] = useState(0);
  const [invalid, setInvalid] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    setLoadedFor(null); setFailed(false); setNeedsReload(false); setSaving(false); setInvalid([]);
    if (!actorId) return;
    const assertCurrent = () => { if (cancelled || !alive.current || actor.current !== actorId) throw new Error('Settings account changed'); };
    void (async () => {
      try {
        const rows = await readAdminSystemSettings([PLATFORM_SOCIAL_SETTING], assertCurrent);
        const next = rows.length ? readSocialLinks(rows[0].value) : { ...EMPTY_SOCIAL_LINKS };
        assertCurrent(); setValues(next); setLoadedFor(actorId);
      } catch { if (!cancelled && actor.current === actorId) setFailed(true); }
    })();
    return () => { cancelled = true; };
  }, [actorId, reload]);
  const save = async () => {
    if (!actorId || loadedFor !== actorId || failed || saving || needsReload) return;
    const normalized = SOCIAL_NETWORKS.map(network => [network, normalizeSocialUrl(network, values[network])] as const);
    const errors = normalized.filter(([, value]) => value === null).map(([network]) => network);
    setInvalid(errors); if (errors.length) return;
    const expected = actorId;
    const assertCurrent = () => { if (!alive.current || actor.current !== expected) throw new Error('Settings account changed'); };
    setSaving(true);
    try {
      const value = Object.fromEntries(normalized) as PlatformSocialLinks;
      await saveAdminSystemSettings([{ key: PLATFORM_SOCIAL_SETTING, value, description: 'Public myUNO YouTube, Instagram and LinkedIn profile URLs.' }], assertCurrent);
      assertCurrent(); setValues(value);
      await client.invalidateQueries({ queryKey: PLATFORM_SOCIAL_QUERY_KEY });
      assertCurrent(); toast.success(t('Социальные сети сохранены', 'Social networks saved', 'บันทึกโซเชียลมีเดียแล้ว'));
    } catch {
      if (alive.current && actor.current === expected) { setNeedsReload(true); toast.error(t('Сохранение не подтверждено. Загрузите настройки заново.', 'Save not confirmed. Reload settings before retrying.', 'ยังยืนยันการบันทึกไม่ได้ โปรดโหลดการตั้งค่าใหม่')); }
    } finally { if (alive.current && actor.current === expected) setSaving(false); }
  };
  if (!actorId) return <p role="alert">{t('Войдите для управления настройками.', 'Sign in to manage settings.', 'เข้าสู่ระบบเพื่อจัดการการตั้งค่า')}</p>;
  if (failed) return <div role="alert"><p>{t('Не удалось загрузить ссылки.', 'Social links could not be loaded.', 'โหลดลิงก์ไม่สำเร็จ')}</p><Button onClick={() => setReload(value => value + 1)}>{t('Повторить загрузку', 'Reload settings', 'โหลดใหม่')}</Button></div>;
  if (loadedFor !== actorId) return <p role="status">{t('Загрузка…', 'Loading…', 'กำลังโหลด…')}</p>;
  return <Surface variant="card" padding="md" radius="lg" className="space-y-4">
    <div><h2 className="font-display text-h3">{t('Социальные сети myUNO', 'myUNO social networks', 'โซเชียลมีเดีย myUNO')}</h2><p className="text-sm text-muted-foreground">{t('Вставьте полные адреса профилей. Заполненные ссылки появятся в подвале приложения. Очистите поле, чтобы скрыть иконку.', 'Paste full profile URLs. Saved links appear in the app footer. Clear a field to hide its icon.', 'วาง URL โปรไฟล์แบบเต็ม ลิงก์ที่บันทึกจะแสดงที่ส่วนท้าย ล้างช่องเพื่อซ่อนไอคอน')}</p></div>
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save(); }}>
      {SOCIAL_NETWORKS.map(network => <div key={network} className="space-y-2"><Label htmlFor={`social-${network}`}>{SOCIAL_LABELS[network]}</Label><Input id={`social-${network}`} type="url" inputMode="url" maxLength={2048} autoComplete="off" value={values[network]} disabled={saving || needsReload} aria-invalid={invalid.includes(network)} aria-describedby={invalid.includes(network) ? `social-${network}-error` : undefined} placeholder={network === 'youtube' ? 'https://www.youtube.com/@your-channel' : network === 'instagram' ? 'https://www.instagram.com/your-profile' : 'https://www.linkedin.com/company/your-company'} onChange={event => { setValues(current => ({ ...current, [network]: event.target.value })); setInvalid(current => current.filter(key => key !== network)); }} />{invalid.includes(network) && <p role="alert" id={`social-${network}-error`} className="text-sm text-destructive">{t('Укажите HTTPS-ссылку на профиль этой социальной сети.', 'Enter an HTTPS profile URL for this social network.', 'กรุณาระบุ HTTPS URL ของโปรไฟล์บนเครือข่ายนี้')}</p>}</div>)}
      {needsReload && <p role="alert">{t('Сохранение не подтверждено. Перезагрузите настройки перед повтором.', 'Save not confirmed. Reload settings before retrying.', 'ยังยืนยันการบันทึกไม่ได้ โปรดโหลดใหม่ก่อนลองอีกครั้ง')}</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={saving || needsReload}>{saving ? t('Сохранение…', 'Saving…', 'กำลังบันทึก…') : t('Сохранить', 'Save', 'บันทึก')}</Button>{needsReload && <Button type="button" variant="outline" onClick={() => setReload(value => value + 1)}>{t('Загрузить заново', 'Reload settings', 'โหลดใหม่')}</Button>}</div>
    </form>
  </Surface>;
}
