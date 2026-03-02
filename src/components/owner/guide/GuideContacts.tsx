import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Mail, Phone, Clock, Globe, QrCode } from 'lucide-react';

const steps = [
  { numRu: '1', numEn: '1', textRu: 'Зарегистрируйтесь в приложении UNO', textEn: 'Register in the UNO app' },
  { numRu: '2', numEn: '2', textRu: 'Перейдите в раздел «Для собственников»', textEn: 'Go to "For Owners" section' },
  { numRu: '3', numEn: '3', textRu: 'Добавьте свой первый объект', textEn: 'Add your first property' },
  { numRu: '4', numEn: '4', textRu: 'Пройдите модерацию', textEn: 'Complete moderation' },
  { numRu: '5', numEn: '5', textRu: 'Настройте цены и календарь', textEn: 'Set up pricing and calendar' },
  { numRu: '6', numEn: '6', textRu: 'Начните принимать гостей!', textEn: 'Start accepting guests!' },
];

const contacts = [
  { icon: MessageCircle, labelRu: 'Чат в приложении', labelEn: 'In-app chat', valueRu: 'Кнопка в правом нижнем углу', valueEn: 'Button in the bottom right' },
  { icon: Mail, labelRu: 'Email', labelEn: 'Email', valueRu: 'support@myuno.app', valueEn: 'support@myuno.app' },
  { icon: Phone, labelRu: 'WhatsApp', labelEn: 'WhatsApp', valueRu: 'Через приложение', valueEn: 'Via app' },
  { icon: Clock, labelRu: 'Время работы', labelEn: 'Hours', valueRu: '24/7', valueEn: '24/7' },
];

export function GuideContacts() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="p-8 print:p-12 space-y-8">
      {/* How to Start */}
      <section className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Как начать' : 'How to Start'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl"
            >
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                {step.numRu}
              </span>
              <span className="text-sm text-muted-foreground pt-1">
                {isRu ? step.textRu : step.textEn}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Контакты и поддержка' : 'Contacts & Support'}
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {contacts.map((contact) => (
            <Card key={contact.labelEn} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <contact.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    {isRu ? contact.labelRu : contact.labelEn}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? contact.valueRu : contact.valueEn}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* QR Code placeholder */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="w-32 h-32 mx-auto bg-white rounded-xl flex items-center justify-center mb-4">
              <QrCode className="w-24 h-24 text-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Отсканируйте для скачивания приложения'
                : 'Scan to download the app'
              }
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <div className="pt-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground mb-2">
          {isRu ? 'Версия документа: 2.0' : 'Document Version: 2.0'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {isRu ? 'Январь 2025' : 'January 2025'}
        </p>
        <div className="flex items-center justify-center gap-2 text-primary">
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">myuno.app</span>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          © myUNO Pte. Ltd.
        </p>
      </div>
    </div>
  );
}
