/**
 * FloatingWhatsAppContact — глобальная плавающая кнопка связи с myUNO в WhatsApp.
 * Видна на всех потребительских страницах через AppLayout.
 */
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWhatsAppUrl, COMPANY_CONTACTS } from '@/lib/config/contacts';

export function FloatingWhatsAppContact() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const message = isRu
    ? 'Здравствуйте, myUNO! У меня есть вопрос.'
    : 'Hello myUNO! I have a question.';
  const url = getWhatsAppUrl(message);
  const label = isRu ? 'Связаться в WhatsApp' : 'Contact on WhatsApp';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} ${COMPANY_CONTACTS.phone.display}`}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle className="w-6 h-6" strokeWidth={2.2} />
      <span className="sr-only">{label}</span>
    </a>
  );
}
