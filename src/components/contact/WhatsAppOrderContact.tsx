/**
 * WhatsAppOrderContact — кнопка «Связаться по WhatsApp» с предзаполненным
 * сообщением, содержащим номер заказа и краткое описание.
 *
 * Используется в UnifiedSuccessLayout и может применяться в любых
 * order/booking confirmation экранах.
 */
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { COMPANY_CONTACTS, getWhatsAppUrl } from '@/lib/config/contacts';

export interface WhatsAppOrderContactProps {
  orderNumber?: string;
  /** Опциональное краткое описание заказа (товары / даты / адрес). */
  summary?: { ru?: string; en?: string };
  /** Сумма заказа для добавления в сообщение. */
  totalAmount?: number;
  currency?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

function buildMessage({
  isRu,
  orderNumber,
  summary,
  totalAmount,
  currency,
}: {
  isRu: boolean;
  orderNumber?: string;
  summary?: { ru?: string; en?: string };
  totalAmount?: number;
  currency?: string;
}): string {
  const lines: string[] = [];
  lines.push(
    isRu
      ? 'Здравствуйте, myUNO! У меня вопрос по заказу.'
      : 'Hello myUNO! I have a question about my order.',
  );
  if (orderNumber) {
    lines.push(
      isRu ? `Номер заказа: ${orderNumber}` : `Order number: ${orderNumber}`,
    );
  }
  const summaryText = isRu ? summary?.ru : summary?.en;
  if (summaryText) lines.push(summaryText);
  if (totalAmount && totalAmount > 0) {
    const cur = (currency || 'THB').toUpperCase();
    const formatted = `${cur === 'THB' ? '฿' : ''}${totalAmount.toLocaleString()}${cur !== 'THB' ? ` ${cur}` : ''}`;
    lines.push(isRu ? `Сумма: ${formatted}` : `Total: ${formatted}`);
  }
  return lines.join('\n');
}

export function WhatsAppOrderContact({
  orderNumber,
  summary,
  totalAmount,
  currency,
  className,
  variant = 'outline',
}: WhatsAppOrderContactProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const message = buildMessage({ isRu, orderNumber, summary, totalAmount, currency });
  const url = getWhatsAppUrl(message);

  return (
    <Button
      asChild
      variant={variant}
      className={className}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isRu ? 'Связаться с myUNO в WhatsApp' : 'Contact myUNO on WhatsApp'}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {isRu
          ? `Связаться по WhatsApp · ${COMPANY_CONTACTS.phone.display}`
          : `Contact via WhatsApp · ${COMPANY_CONTACTS.phone.display}`}
      </a>
    </Button>
  );
}
