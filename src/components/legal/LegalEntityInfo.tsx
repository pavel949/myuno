/**
 * Single source of truth for rights-holder / operator legal data in the UI.
 *
 * Thailand compliance notes (Electronic Transactions Act, Direct Sales & Direct
 * Marketing Act, Consumer Protection Act, PDPA):
 *  - the operating legal entity must be named in full, in its registered form;
 *  - the registered office address must be shown;
 *  - a working contact channel (phone + email) must be shown;
 *  - the company registration / Tax ID (เลขทะเบียนนิติบุคคล) must be shown when
 *    goods or services are sold online — rendered here as soon as it is filled
 *    into COMPANY_CONTACTS.legal.registrationNumber.
 *
 * Never hardcode the company name, address or contacts anywhere else — import
 * one of the components below instead.
 */
import { COMPANY_CONTACTS } from '@/lib/config/contacts';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const L = COMPANY_CONTACTS.legal;

type Lang = 'ru' | 'en' | 'th';

const pick = (lang: string): Lang => (lang === 'ru' ? 'ru' : lang === 'th' ? 'th' : 'en');

const T = {
  address: { ru: 'Адрес', en: 'Address', th: 'ที่อยู่' },
  regNo: { ru: 'Регистрационный номер', en: 'Company registration no.', th: 'เลขทะเบียนนิติบุคคล' },
  taxId: { ru: 'Налоговый номер', en: 'Tax ID', th: 'เลขประจำตัวผู้เสียภาษี' },
  jurisdiction: { ru: 'Юрисдикция: Таиланд', en: 'Jurisdiction: Thailand', th: 'เขตอำนาจศาล: ประเทศไทย' },
} as const;

/** Localised registered name (Thai locale shows the registered Thai name). */
export function getLegalEntityName(lang: string): string {
  return pick(lang) === 'th' ? L.companyNameTh : L.companyName;
}

/** Localised registered address. */
export function getLegalEntityAddress(lang: string): string {
  const l = pick(lang);
  return l === 'ru' ? L.addressRu : l === 'th' ? L.addressTh : L.addressEn;
}

/** One-line copyright string, e.g. "© 2026 myUNO · Toplight Asia Pacific Co., Ltd., Phuket". */
export function getLegalCopyrightLine(lang: string): string {
  const l = pick(lang);
  const city = l === 'ru' ? 'Пхукет' : l === 'th' ? 'ภูเก็ต' : 'Phuket';
  return `© ${new Date().getFullYear()} myUNO · ${getLegalEntityName(lang)}, ${city}`;
}

/** Inline copyright line for footers. */
export function LegalCopyright({ className }: { className?: string }) {
  const { language } = useLanguage();
  return <span className={className}>{getLegalCopyrightLine(language)}</span>;
}

/**
 * Full rights-holder block for legal pages (Terms, Privacy, Refunds, IP, etc.).
 */
export function LegalEntityBlock({
  className,
  showJurisdiction = true,
  contactEmail,
}: {
  className?: string;
  showJurisdiction?: boolean;
  /** Optional topic-specific email shown in addition to the legal contact. */
  contactEmail?: string;
}) {
  const { language } = useLanguage();
  const l = pick(language);
  const t = (k: keyof typeof T) => T[k][l];

  return (
    <div className={cn('rounded-none bg-muted p-3 text-xs text-muted-foreground', className)}>
      <p className="mb-1 font-medium text-foreground">{getLegalEntityName(language)}</p>
      <p>
        {t('address')}: {getLegalEntityAddress(language)}
      </p>
      {L.registrationNumber ? (
        <p>
          {t('regNo')}: {L.registrationNumber}
        </p>
      ) : null}
      {L.taxId ? (
        <p>
          {t('taxId')}: {L.taxId}
        </p>
      ) : null}
      <p>
        {L.phone} · {L.email}
        {contactEmail ? ` · ${contactEmail}` : ''}
      </p>
      {showJurisdiction ? <p>{t('jurisdiction')}</p> : null}
      <p className="mt-1">www.myuno.app</p>
    </div>
  );
}
