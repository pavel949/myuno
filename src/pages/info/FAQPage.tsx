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
            ? 'UNO — это платформа, объединяющая все необходимые сервисы для жизни на Пхукете: аренда жилья, транспорт, туры, медицина, рестораны и многое другое. Все партнёры проходят проверку качества.'
            : 'UNO is a platform that brings together all essential services for living in Phuket: housing rental, transport, tours, medical care, restaurants and more. All partners are quality verified.',
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
            ? 'Да, все платежи защищены шифрованием. Мы используем проверенные платёжные системы и не храним данные карт.'
            : 'Yes, all payments are encrypted. We use trusted payment systems and do not store card data.',
        },
      ],
    },
    {
      title: isRu ? 'Партнёры и качество' : 'Partners & Quality',
      items: [
        {
          q: isRu ? 'Как вы проверяете партнёров?' : 'How do you verify partners?',
          a: isRu 
            ? 'Каждый партнёр проходит проверку документов, лицензий и качества услуг. Мы также отслеживаем отзывы и оперативно реагируем на жалобы.'
            : 'Each partner undergoes document, license and service quality verification. We also monitor reviews and promptly respond to complaints.',
        },
        {
          q: isRu ? 'Что делать, если услуга оказана некачественно?' : 'What if the service was poor quality?',
          a: isRu 
            ? 'Свяжитесь с нашей поддержкой через SOS-кнопку или раздел «Помощь». Мы разберёмся в ситуации и поможем решить проблему, включая возврат средств.'
            : 'Contact our support via the SOS button or "Help" section. We will investigate and help resolve the issue, including refunds.',
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