import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/** Explains request handling without implying stock, a reservation or a delivery SLA. */
export function MarketplaceRequestSteps() {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  return <section className="border-t border-border pt-6" aria-labelledby="marketplace-request-steps">
    <h2 id="marketplace-request-steps" className="font-display text-xl">{t('Как это работает', 'How it works', 'ขั้นตอนการใช้บริการ')}</h2>
    <ol className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
      <li><span className="font-medium">{t('01 · Выберите предложение', '01 · Choose an offer', '01 · เลือกข้อเสนอ')}</span><p className="mt-1 text-muted-foreground">{t('Изучите фотографии, состав и условия в карточке.', 'Review photos, inclusions and terms on the offer page.', 'ดูรูปภาพ สิ่งที่รวม และเงื่อนไขในหน้าข้อเสนอ')}</p></li>
      <li><span className="font-medium">{t('02 · Укажите пожелания', '02 · Share your plans', '02 · ระบุความต้องการ')}</span><p className="mt-1 text-muted-foreground">{t('Продолжите оформление на странице предложения.', 'Continue with the request on the offer page.', 'ดำเนินการส่งคำขอในหน้าข้อเสนอ')}</p></li>
      <li><span className="font-medium">{t('03 · Согласуйте с myUNO', '03 · Confirm with myUNO', '03 · ยืนยันกับ myUNO')}</span><p className="mt-1 text-muted-foreground">{t('myUNO обрабатывает заявку. Отправка заявки не означает подтверждение услуги.', 'myUNO handles your request. Sending it does not confirm the service.', 'myUNO ดูแลคำขอของคุณ การส่งคำขอยังไม่ใช่การยืนยันบริการ')}</p></li>
    </ol>
  </section>;
}
