import { useId } from 'react';
import { LifeBuoy, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { getEmergencyContacts, sanitizeTelNumber } from '@/lib/emergency/contacts';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';

const services = [
  { phone: '1669', label: { ru: 'Скорая помощь', en: 'Medical emergency', th: 'การแพทย์ฉุกเฉิน' } },
  { phone: '191', label: { ru: 'Полиция и экстренные службы', en: 'Police and emergency services', th: 'ตำรวจและเหตุฉุกเฉิน' } },
  { phone: '1155', label: { ru: 'Туристическая полиция', en: 'Tourist Police', th: 'ตำรวจท่องเที่ยว' } },
];

const phuketQuickDial = getEmergencyContacts('phuket').quickDial;

export function HomeUrgentHelp() {
  const descriptionId = useId();
  const { language } = useLanguage();
  const t = (copy: LangValues) => pickLang(language, copy);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="ds-focus home-hero-help">
          <LifeBuoy aria-hidden="true" size={19} />
          {t({ ru: 'Срочная помощь', en: 'Urgent help', th: 'ความช่วยเหลือฉุกเฉิน' })}
        </button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={descriptionId}
        closeLabel={t({ ru: 'Закрыть', en: 'Close', th: 'ปิด' })}
      >
        <DialogHeader>
          <DialogTitle>{t({ ru: 'Срочная помощь в Таиланде', en: 'Urgent help in Thailand', th: 'ความช่วยเหลือฉุกเฉินในประเทศไทย' })}</DialogTitle>
          <DialogDescription id={descriptionId}>
            {t({ ru: 'Если вам или кому-то рядом срочно нужна помощь, позвоните напрямую в нужную службу.', en: 'If you or someone nearby needs urgent help, call the service directly.', th: 'หากคุณหรือคนใกล้ตัวต้องการความช่วยเหลือด่วน โทรหาหน่วยงานที่เกี่ยวข้องได้โดยตรง' })}
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2">
          {services.map(({ phone, label }) => {
            const contact = phuketQuickDial.find(item => item.phone === phone);
            if (!contact) return null;
            return (
              <li key={contact.id}>
                <a href={`tel:${sanitizeTelNumber(contact.phone)}`} aria-label={`${t(label)} ${contact.phone}`} className="ds-focus flex min-h-12 items-center gap-3 rounded-[var(--bible-radius-card)] border border-border px-3 py-2 text-sm hover:bg-muted">
                  <Phone size={17} aria-hidden="true" className="shrink-0 text-primary" />
                  <span className="flex-1 font-medium">{t(label)}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{contact.phone}</span>
                </a>
              </li>
            );
          })}
        </ul>
        <Link to={APP_ROUTES.SOS} className="ds-focus inline-flex min-h-11 items-center justify-center text-sm font-medium text-primary underline underline-offset-4">
          {t({ ru: 'Все экстренные контакты', en: 'All emergency contacts', th: 'หมายเลขฉุกเฉินทั้งหมด' })}
        </Link>
      </DialogContent>
    </Dialog>
  );
}
