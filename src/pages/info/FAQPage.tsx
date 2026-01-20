import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FAQPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const faqCategories = [
    {
      title: isRu ? 'Общие вопросы' : 'General Questions',
      items: [
        {
          q: isRu ? 'Что такое UNO?' : 'What is UNO?',
          a: isRu 
            ? 'UNO — это ваш дом вдали от дома. Платформа, объединяющая все необходимые сервисы для комфортной жизни за рубежом: аренда жилья, транспорт, туры, медицина, рестораны и многое другое. Все партнёры проходят проверку качества.'
            : 'UNO is your home away from home. A platform that brings together all essential services for comfortable living abroad: housing rental, transport, tours, medical care, restaurants and more. All partners are quality verified.',
        },
        {
          q: isRu ? 'Приложение бесплатное?' : 'Is the app free?',
          a: isRu 
            ? 'Да, использование приложения полностью бесплатно. Вы платите только за услуги, которые бронируете.'
            : 'Yes, using the app is completely free. You only pay for the services you book.',
        },
        {
          q: isRu ? 'На каких языках доступно приложение?' : 'What languages is the app available in?',
          a: isRu 
            ? 'Приложение доступно на русском и английском языках. Вы можете переключить язык в настройках профиля.'
            : 'The app is available in Russian and English. You can switch the language in your profile settings.',
        },
      ],
    },
    {
      title: isRu ? 'G-Trust и Гарантии' : 'G-Trust & Guarantees',
      items: [
        {
          q: isRu ? 'Что такое G-Trust?' : 'What is G-Trust?',
          a: isRu 
            ? 'G-Trust — это система гарантий myUNO, которая защищает каждую транзакцию на платформе. Мы гарантируем 100% возврат средств, если услуга не была оказана или не соответствует описанию.'
            : 'G-Trust is myUNO\'s guarantee system that protects every transaction on the platform. We guarantee 100% refund if the service was not provided or doesn\'t match the description.',
        },
        {
          q: isRu ? 'Как получить 100% возврат средств?' : 'How do I get a 100% refund?',
          a: isRu 
            ? 'Если услуга не была оказана, свяжитесь с поддержкой через SOS-кнопку или раздел «Помощь». Мы рассмотрим вашу заявку в течение 24 часов и вернём полную сумму на ваш счёт или карту.'
            : 'If the service was not provided, contact support via the SOS button or "Help" section. We will review your request within 24 hours and return the full amount to your account or card.',
        },
        {
          q: isRu ? 'Как проверяются партнёры G-Trust?' : 'How are G-Trust partners verified?',
          a: isRu 
            ? 'Все партнёры проходят многоуровневую проверку: документы, лицензии, страховка, история работы. Премиум-партнёры также проходят физическую инспекцию и финансовую проверку.'
            : 'All partners undergo multi-level verification: documents, licenses, insurance, work history. Premium partners also undergo physical inspection and financial verification.',
        },
        {
          q: isRu ? 'Что означает Trust Score?' : 'What does Trust Score mean?',
          a: isRu 
            ? 'Trust Score — это индекс доверия от 0 до 100%, который показывает надёжность партнёра. Он рассчитывается на основе отзывов, повторных заказов, времени отклика и других факторов.'
            : 'Trust Score is a trust index from 0 to 100% that shows partner reliability. It is calculated based on reviews, repeat orders, response time and other factors.',
        },
      ],
    },
    {
      title: isRu ? 'Бронирование' : 'Booking',
      items: [
        {
          q: isRu ? 'Как забронировать услугу?' : 'How do I book a service?',
          a: isRu 
            ? 'Выберите категорию, найдите нужный сервис, выберите дату и время, заполните контактные данные и подтвердите бронирование. Оплата возможна онлайн или на месте.'
            : 'Select a category, find the service you need, choose a date and time, fill in your contact details and confirm the booking. Payment is possible online or on-site.',
        },
        {
          q: isRu ? 'Можно ли отменить бронирование?' : 'Can I cancel a booking?',
          a: isRu 
            ? 'Да, бронирование можно отменить в разделе «Мои бронирования». Условия отмены зависят от политики конкретного партнёра и указаны на странице услуги.'
            : 'Yes, you can cancel a booking in the "My Bookings" section. Cancellation terms depend on the specific partner policy and are shown on the service page.',
        },
        {
          q: isRu ? 'Как изменить дату бронирования?' : 'How do I change the booking date?',
          a: isRu 
            ? 'Для изменения даты свяжитесь с поддержкой или напрямую с партнёром через чат в приложении.'
            : 'To change the date, contact support or the partner directly through the in-app chat.',
        },
      ],
    },
    {
      title: isRu ? 'Оплата' : 'Payment',
      items: [
        {
          q: isRu ? 'Какие способы оплаты доступны?' : 'What payment methods are available?',
          a: isRu 
            ? 'Мы принимаем банковские карты (Visa, Mastercard), наличные при получении услуги и оплату через UNO Кошелёк.'
            : 'We accept bank cards (Visa, Mastercard), cash upon service delivery and payment via UNO Wallet.',
        },
        {
          q: isRu ? 'Что такое UNO Кошелёк?' : 'What is UNO Wallet?',
          a: isRu 
            ? 'UNO Кошелёк — это ваш баланс в приложении. Сюда начисляется кэшбек за бронирования и бонусы по реферальной программе. Баланс можно использовать для оплаты услуг.'
            : 'UNO Wallet is your balance in the app. Cashback from bookings and referral bonuses are credited here. The balance can be used to pay for services.',
        },
        {
          q: isRu ? 'Безопасна ли оплата картой?' : 'Is card payment secure?',
          a: isRu 
            ? 'Да, все платежи защищены системой G-Trust. Мы используем шифрование и escrow-счета — деньги переводятся партнёру только после оказания услуги.'
            : 'Yes, all payments are protected by the G-Trust system. We use encryption and escrow accounts — money is transferred to the partner only after the service is provided.',
        },
      ],
    },
    {
      title: isRu ? 'Партнёры и качество' : 'Partners & Quality',
      items: [
        {
          q: isRu ? 'Как вы проверяете партнёров?' : 'How do you verify partners?',
          a: isRu 
            ? 'Каждый партнёр проходит проверку документов, лицензий и качества услуг через систему G-Trust. Мы также отслеживаем отзывы и оперативно реагируем на жалобы.'
            : 'Each partner undergoes document, license and service quality verification through the G-Trust system. We also monitor reviews and promptly respond to complaints.',
        },
        {
          q: isRu ? 'Что делать, если услуга оказана некачественно?' : 'What if the service was poor quality?',
          a: isRu 
            ? 'Свяжитесь с нашей поддержкой через SOS-кнопку или раздел «Помощь». G-Trust гарантирует разбор ситуации в течение 24 часов и возврат средств при подтверждении проблемы.'
            : 'Contact our support via the SOS button or "Help" section. G-Trust guarantees case review within 24 hours and refund upon problem confirmation.',
        },
      ],
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Частые вопросы' : 'FAQ'} 
          showBack 
        />

        {/* Search hint */}
        <SectionCard className="flex items-center gap-3">
          <HelpCircle className="w-10 h-10 text-primary flex-shrink-0" />
          <div>
            <h2 className="font-semibold">{isRu ? 'Нужна помощь?' : 'Need Help?'}</h2>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Найдите ответ ниже или свяжитесь с поддержкой'
                : 'Find your answer below or contact support'}
            </p>
          </div>
        </SectionCard>

        {/* FAQ Sections */}
        {faqCategories.map((category, catIndex) => (
          <div key={catIndex}>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 mt-4">
              {category.title}
            </h3>
            <SectionCard noPadding>
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`${catIndex}-${index}`}
                    className="border-b last:border-b-0"
                  >
                    <AccordionTrigger className="px-4 text-left text-sm hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </SectionCard>
          </div>
        ))}

        {/* Contact Support */}
        <SectionCard className="text-center">
          <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-1">
            {isRu ? 'Не нашли ответ?' : 'Did not find an answer?'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isRu ? 'Наша поддержка работает 24/7' : 'Our support works 24/7'}
          </p>
          <Button className="w-full">
            {isRu ? 'Написать в поддержку' : 'Contact Support'}
          </Button>
        </SectionCard>
      </PageContainer>
    </AppLayout>
  );
}