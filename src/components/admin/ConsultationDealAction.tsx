import { ConvertLeadToDealButton } from '@/components/crm/ConvertLeadToDealButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { OFFPLAN_BUYER_ENTRY } from '@/lib/consultationIntake';
import { pickLang } from '@/lib/i18n/pickLang';

type Props = {
  id: string;
  entryPoint?: string | null;
  convertedDealId?: string | null;
};

/**
 * The existing broad conversion cannot prove off-plan lead scope, deal company,
 * or preserve the buyer request context. Keep follow-up in the current request
 * until the checked CRM capability is available. This UI gate is not RPC auth.
 */
export function ConsultationDealAction({ id, entryPoint, convertedDealId }: Props) {
  const { language } = useLanguage();

  if (entryPoint !== OFFPLAN_BUYER_ENTRY) {
    return <ConvertLeadToDealButton leadId={id} convertedDealId={convertedDealId} />;
  }

  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      {convertedDealId
        ? pickLang(language, {
          ru: 'У заявки есть связь со сделкой. Уточните доступ у ответственного за CRM.',
          en: 'This request has a deal link. Check access with the CRM owner.',
          th: 'คำขอนี้มีรายการใน CRM ที่เชื่อมโยงอยู่ โปรดตรวจสอบสิทธิ์กับผู้ดูแล CRM',
        })
        : pickLang(language, {
          ru: 'Создание сделки из этой заявки пока недоступно. Продолжайте работу с заявкой.',
          en: 'Creating a deal from this request is not available yet. Continue working in this request.',
          th: 'ยังไม่สามารถย้ายคำขอนี้ไปยัง CRM ได้ โปรดดำเนินการในคำขอนี้ต่อ',
        })}
    </p>
  );
}
