/** Read-only reference conversion over the existing canonical currency RPC. */
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency, type Currency } from '@/contexts/CurrencyContext';
import { pickLang } from '@/lib/i18n/pickLang';

const ExchangeBotPage: React.FC = () => {
  const { language } = useLanguage();
  const { referenceRates, ratesError, isLoading } = useCurrency();
  const text = (ru: string, en: string, th: string) => pickLang(language, {ru,en,th});
  const [amount, setAmount] = useState('1000');
  const [selected, setSelected] = useState<Currency>('USD');
  const rate = referenceRates[selected] && Number.isFinite(1 / referenceRates[selected]!.rate) ? referenceRates[selected] : undefined;
  const available = (['USD','EUR','RUB'] as Currency[]).filter(code => referenceRates[code] && Number.isFinite(1 / referenceRates[code]!.rate));
  const active = rate ? selected : available[0];
  const current = active ? referenceRates[active] : undefined;
  const numericAmount = Number(amount);
  const converted = current && amount.trim() && Number.isFinite(numericAmount) && numericAmount >= 0 && Number.isFinite(numericAmount / current.rate)
    ? numericAmount / current.rate : null;
  const locale = language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB';
  const title = text('Справочные курсы валют', 'Reference exchange rates', 'อัตราแลกเปลี่ยนอ้างอิง');
  return <AppLayout>
    <SEOHead title={`${title} | myUNO`} description={text('Справочные курсы из системы myUNO. Условия обмена уточняйте у выбранного поставщика.', 'Reference rates recorded in myUNO. Confirm exchange terms with your chosen provider.', 'อัตราอ้างอิงที่บันทึกใน myUNO โปรดยืนยันเงื่อนไขกับผู้ให้บริการ')} />
    <div className="px-4 md:px-6 py-6 pb-20 max-w-[900px] mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-display">{title}</h1>
      <p className="text-muted-foreground">{text('Это справочные данные, а не предложение обменника. Итоговый курс и комиссии могут отличаться.', 'These are reference figures, not an exchanger quote. Final rates and fees may differ.', 'ข้อมูลนี้เป็นอัตราอ้างอิง ไม่ใช่ข้อเสนอจากร้านแลกเงิน อัตราจริงและค่าธรรมเนียมอาจแตกต่างกัน')}</p>
      {isLoading ? <p role="status">{text('Загрузка курсов…', 'Loading rates…', 'กำลังโหลดอัตรา…')}</p>
        : ratesError ? <p role="alert">{text('Не удалось загрузить курсы. Попробуйте позже.', 'Rates could not be loaded. Try again later.', 'ไม่สามารถโหลดอัตราได้ โปรดลองใหม่ภายหลัง')}</p>
        : !current ? <p role="status">{text('Курсы с подтверждённой датой обновления пока не опубликованы.', 'No rates with a recorded update date are available yet.', 'ยังไม่มีอัตราที่ระบุวันที่อัปเดต')}</p>
        : <>
          <Card><CardContent className="p-5 space-y-4">
            <h2 className="font-semibold">{text('Калькулятор в тайских батах', 'Convert to Thai baht', 'แปลงเป็นเงินบาท')}</h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[120px]"><label htmlFor="exchange-amount">{text('Сумма', 'Amount', 'จำนวนเงิน')}<Input id="exchange-amount" type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} /></label></div>
              <div className="flex-1 min-w-[120px]"><label htmlFor="exchange-currency">{text('Валюта', 'Currency', 'สกุลเงิน')}<select id="exchange-currency" className="w-full h-10 border border-input bg-background px-3" value={active} onChange={e=>setSelected(e.target.value as Currency)}>{available.map(code=><option key={code} value={code}>{code}</option>)}</select></label></div>
            </div>
            <output aria-live="polite" className="block text-xl font-mono">{converted === null ? '—' : `${converted.toLocaleString(locale,{maximumFractionDigits:2})} THB`}</output>
            <p className="text-sm text-muted-foreground">{text('Дата записи курса', 'Rate recorded', 'วันที่บันทึกอัตรา')}: <time dateTime={current.updatedAt}>{new Date(current.updatedAt).toLocaleString(locale,{timeZone:'Asia/Bangkok'})}</time> ({text('Бангкок', 'Bangkok', 'กรุงเทพฯ')})</p>
          </CardContent></Card>
          <ul className="space-y-3">{available.map(code=>{const item=referenceRates[code]!;return <li key={code} className="flex flex-wrap justify-between gap-2 border-b border-border py-3"><span>1 {code}</span><span>{(1/item.rate).toLocaleString(locale,{maximumFractionDigits:4})} THB</span></li>;})}</ul>
        </>}
      <section className="space-y-2"><h2 className="text-xl font-display">{text('Обменные пункты', 'Currency exchangers', 'ร้านแลกเปลี่ยนเงินตรา')}</h2><p className="text-muted-foreground">{text('Каталог обменных пунктов здесь пока недоступен. Адрес, часы работы, комиссии и итоговый курс уточняйте непосредственно у поставщика.', 'An exchanger directory is not available here yet. Confirm the address, hours, fees and final rate directly with the provider.', 'ยังไม่มีรายชื่อร้านแลกเงินในหน้านี้ โปรดยืนยันที่อยู่ เวลาทำการ ค่าธรรมเนียม และอัตราจริงกับผู้ให้บริการโดยตรง')}</p></section>
    </div>
  </AppLayout>;
};
export default ExchangeBotPage;
